from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import io
import os
from supabase import create_client
from ..dependencies import verify_internal

router = APIRouter()

def get_supabase():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

@router.post("/cedis-import")
async def cedis_import(
    file: UploadFile = File(...),
    sucursal_id: str = Form(...),
    _: bool = Depends(verify_internal),
):
    content = await file.read()

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al leer archivo: {str(e)}")

    # Normalize columns — accept common Spanish column names
    col_map = {}
    for col in df.columns:
        low = col.lower().strip()
        if any(k in low for k in ["codigo", "clave", "sku", "code"]):
            col_map[col] = "codigo"
        elif any(k in low for k in ["cantidad", "existencia", "stock", "qty"]):
            col_map[col] = "cantidad"
    df = df.rename(columns=col_map)

    if "codigo" not in df.columns or "cantidad" not in df.columns:
        raise HTTPException(
            status_code=422,
            detail="El archivo debe tener columnas 'codigo' (o variante) y 'cantidad' (o variante)"
        )

    df = df[["codigo", "cantidad"]].dropna()
    df["cantidad"] = pd.to_numeric(df["cantidad"], errors="coerce").fillna(0).astype(int)

    supabase = get_supabase()

    # Lookup product IDs by codigo
    codigos = df["codigo"].astype(str).tolist()
    productos_res = supabase.table("productos").select("id, codigo").in_("codigo", codigos).execute()
    codigo_to_id = {p["codigo"]: p["id"] for p in productos_res.data}

    updated, skipped = 0, 0
    movements = []

    for _, row in df.iterrows():
        codigo = str(row["codigo"])
        cantidad = int(row["cantidad"])
        producto_id = codigo_to_id.get(codigo)

        if not producto_id:
            skipped += 1
            continue

        # Upsert inventario
        supabase.table("inventario").upsert({
            "producto_id": producto_id,
            "sucursal_id": sucursal_id,
            "cantidad": cantidad,
        }, on_conflict="producto_id,sucursal_id").execute()

        movements.append({
            "producto_id": producto_id,
            "sucursal_id": sucursal_id,
            "tipo": "cedis_import",
            "cantidad": cantidad,
            "notas": f"Import CEDIS: {file.filename}",
        })
        updated += 1

    if movements:
        supabase.table("movimientos_inventario").insert(movements).execute()

    return JSONResponse({
        "status": "ok",
        "updated": updated,
        "skipped": skipped,
        "file": file.filename,
        "sucursal_id": sucursal_id,
    })
