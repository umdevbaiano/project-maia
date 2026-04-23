from fastapi import APIRouter, Depends, HTTPException
from database import get_database
from middleware import get_current_user
from models.template import TemplateResponse, TemplateCreateRequest
from services import template_service

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/marketplace", response_model=dict)
async def get_marketplace_templates(current_user: dict = Depends(get_current_user)):
    return {"templates": await template_service.list_public_templates(get_database())}


@router.post("/", response_model=TemplateResponse)
async def share_template(request: TemplateCreateRequest, current_user: dict = Depends(get_current_user)):
    try:
        new_template = await template_service.create_template(get_database(), request, current_user["_workspace_id"])
        return TemplateResponse(**new_template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{template_id}/use", response_model=TemplateResponse)
async def use_template(template_id: str, current_user: dict = Depends(get_current_user)):
    updated = await template_service.register_use(get_database(), template_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Template não encontrado.")
    return TemplateResponse(**updated)
