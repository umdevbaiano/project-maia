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
    """
    Return aggregated data for dashboard charts:
    - cases_by_status: pie chart data
    - cases_by_type: bar chart data
    - cases_by_month: line chart data
    - deadlines_by_status: pie chart data
    - totals: summary counts
    """
    db: AsyncIOMotorDatabase = get_database()
    workspace_id = current_user["_workspace_id"]

    # Fetch all cases
    casos = []
    async for caso in db["casos"].find({"workspace_id": workspace_id}):
        caso["id"] = str(caso["_id"])
        casos.append(caso)

    # Fetch all deadlines
    prazos = []
    async for prazo in db["prazos"].find({"workspace_id": workspace_id}):
        prazo["id"] = str(prazo["_id"])
        prazos.append(prazo)

    # Documents count
    docs_count = await db["documents"].count_documents({"workspace_id": workspace_id})

    # Clients count
    clientes_count = await db["clientes"].count_documents({"workspace_id": workspace_id})

    # Peças count
    pecas_count = await db["pecas"].count_documents({"workspace_id": workspace_id})

    # --- Chart Data ---

    # Cases by status (pie chart)
    status_labels = {
        "em_andamento": "Em Andamento",
        "ativo": "Ativo",
        "arquivado": "Arquivado",
        "finalizado": "Finalizado",
        "suspenso": "Suspenso",
    }
    status_counter = Counter(c.get("status", "em_andamento") for c in casos)
    cases_by_status = [
        {"name": status_labels.get(s, s), "value": v, "key": s}
        for s, v in status_counter.items()
    ]

    # Cases by type (bar chart)
    tipo_labels = {
        "civel": "Cível",
        "criminal": "Criminal",
        "trabalhista": "Trabalhista",
        "tributario": "Tributário",
        "familia": "Família",
        "administrativo": "Administrativo",
        "previdenciario": "Previdenciário",
        "outro": "Outro",
    }
    tipo_counter = Counter(c.get("tipo", "outro") for c in casos)
    cases_by_type = [
        {"name": tipo_labels.get(t, t), "value": v, "key": t}
        for t, v in tipo_counter.items()
    ]

    # Cases by month (line chart - last 6 months)
    now = datetime.utcnow()
    months_data = {}
    for i in range(5, -1, -1):
        month = now.month - i
        year = now.year
        if month <= 0:
            month += 12
            year -= 1
        key = f"{year}-{month:02d}"
        label = f"{month:02d}/{year}"
        months_data[key] = {"name": label, "processos": 0, "prazos": 0}

    for caso in casos:
        created = caso.get("created_at")
        if isinstance(created, datetime):
            key = f"{created.year}-{created.month:02d}"
            if key in months_data:
                months_data[key]["processos"] += 1

    for prazo in prazos:
        created = prazo.get("created_at")
        if isinstance(created, datetime):
            key = f"{created.year}-{created.month:02d}"
            if key in months_data:
                months_data[key]["prazos"] += 1

    cases_by_month = list(months_data.values())

    # Deadlines by status
    now_date = datetime.utcnow()
    prazos_vencidos = sum(1 for p in prazos
                          if p.get("status") != "cumprido"
                          and isinstance(p.get("data_limite"), datetime)
                          and p["data_limite"] < now_date)
    prazos_cumpridos = sum(1 for p in prazos if p.get("status") == "cumprido")
    prazos_pendentes = len(prazos) - prazos_vencidos - prazos_cumpridos

    deadlines_summary = [
        {"name": "Pendentes", "value": prazos_pendentes, "color": "#f59e0b"},
        {"name": "Vencidos", "value": prazos_vencidos, "color": "#ef4444"},
        {"name": "Cumpridos", "value": prazos_cumpridos, "color": "#22c55e"},
    ]

    return {
        "totals": {
            "casos": len(casos),
            "clientes": clientes_count,
            "documentos": docs_count,
            "prazos": len(prazos),
            "pecas": pecas_count,
        },
        "cases_by_status": cases_by_status,
        "cases_by_type": cases_by_type,
        "cases_by_month": cases_by_month,
        "deadlines_summary": deadlines_summary,
    }
