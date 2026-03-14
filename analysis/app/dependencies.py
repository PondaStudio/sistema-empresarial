import os
from fastapi import Header, HTTPException

async def verify_internal(x_internal_key: str = Header(...)):
    if x_internal_key != os.getenv("INTERNAL_SECRET", ""):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True
