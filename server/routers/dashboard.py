"""
Maia Platform — Dashboard Router
Aggregated stats and chart data for the dashboard.
"""
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from database import get_database
from middleware import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db: AsyncIOMotorDatabase = get_database()
    workspace_id = current_user["_workspace_id"]

    casos = [dict(c, id=str(c["_id"])) async for c in db["casos"].find({"workspace_id": workspace_id})]
    prazos = [dict(p, id=str(p["_id"])) async for p in db["prazos"].find({"workspace_id": workspace_id})]
    
    counts = {
        "documentos": await db["documents"].count_documents({"workspace_id": workspace_id}),
        "clientes": await db["clientes"].count_documents({"workspace_id": workspace_id}),
        "prazos": len(prazos),
        "pecas": await db["pecas"].count_documents({"workspace_id": workspace_id}),
    }

    status_labels = {"em_andamento": "Em Andamento", "ativo": "Ativo", "arquivado": "Arquivado", "finalizado": "Finalizado", "suspenso": "Suspenso"}
    cases_by_status = [{"name": status_labels.get(s, s.title()), "value": v, "key": s} for s, v in Counter(c.get("status", "em_andamento") for c in casos).items()]

    tipo_labels = {"civel": "Cível", "criminal": "Criminal", "trabalhista": "Trabalhista", "tributario": "Tributário", "familia": "Família", "administrativo": "Administrativo", "previdenciario": "Previdenciário", "outro": "Outro"}
    cases_by_type = [{"name": tipo_labels.get(t, t.title()), "value": v, "key": t} for t, v in Counter(c.get("tipo", "outro") for c in casos).items()]

    now = datetime.utcnow()
    months_data = {}
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year - (1 if m <= 0 else 0)
        m = m + 12 if m <= 0 else m
        key = f"{y}-{m:02d}"
        months_data[key] = {"name": f"{m:02d}/{y}", "processos": 0, "prazos": 0}

    for item, field in [(casos, "processos"), (prazos, "prazos")]:
        for doc in item:
            dt = doc.get("created_at")
            if isinstance(dt, datetime):
                key = f"{dt.year}-{dt.month:02d}"
                if key in months_data:
                    months_data[key][field] += 1

    prazos_vencidos = sum(1 for p in prazos if p.get("status") != "cumprido" and isinstance(p.get("data_limite"), datetime) and p["data_limite"] < now)
    prazos_cumpridos = sum(1 for p in prazos if p.get("status") == "cumprido")
    
    deadlines_summary = [
        {"name": "Pendentes", "value": len(prazos) - prazos_vencidos - prazos_cumpridos, "color": "#f59e0b"},
        {"name": "Vencidos", "value": prazos_vencidos, "color": "#ef4444"},
        {"name": "Cumpridos", "value": prazos_cumpridos, "color": "#22c55e"},
    ]

    analyzed = [c for c in casos if c.get("predictive_analytics")]
    avg_score = sum(c["predictive_analytics"].get("score", 0) for c in analyzed) / len(analyzed) if analyzed else 0

    return {
        "totals": {"casos": len(casos), **counts},
        "cases_by_status": cases_by_status,
        "cases_by_type": cases_by_type,
        "cases_by_month": list(months_data.values()),
        "deadlines_summary": deadlines_summary,
        "predictive_summary": {"avg_score": round(avg_score * 100), "analyzed_count": len(analyzed)}
    }
