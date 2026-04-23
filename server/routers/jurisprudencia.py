from typing import Optional
from fastapi import APIRouter, Depends, Query
from middleware import get_current_user
from core.legal.jurisprudencia import search_jurisprudencia

router = APIRouter(prefix="/jurisprudencia", tags=["jurisprudencia"])


@router.get("/search")
async def search(q: str = Query(..., min_length=3), tribunal: Optional[str] = Query(None), page: int = Query(1, ge=1), per_page: int = Query(10, ge=1, le=50), current_user: dict = Depends(get_current_user)):
    return await search_jurisprudencia(q, tribunal=tribunal, page=page, per_page=per_page)
