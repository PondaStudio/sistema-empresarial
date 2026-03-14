from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")

app = FastAPI(
    title="Sistema Empresarial — Analysis Service",
    description="Microservicio de análisis de datos, OCR e IA",
    version="0.1.0",
    docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_internal(x_internal_key: str = Header(...)):
    if x_internal_key != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@app.get("/health")
async def health():
    return {"status": "ok", "service": "analysis"}


# Routers se registran aquí conforme se construyen las waves
# from app.routers import analysis, ocr, ai_hiring, scraping
# app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
# app.include_router(ocr.router, prefix="/ocr", tags=["ocr"])
# app.include_router(ai_hiring.router, prefix="/ai", tags=["ai"])
# app.include_router(scraping.router, prefix="/scraping", tags=["scraping"])
