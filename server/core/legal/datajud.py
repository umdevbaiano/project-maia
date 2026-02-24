"""
Maia Platform — Datajud API Integration
Consulta pública de processos judiciais via API do CNJ (Datajud).
Retorna dados públicos: partes, classe processual, movimentações, etc.
"""
import re
import httpx
from typing import Optional


DATAJUD_BASE_URL = "https://api-publica.datajud.cnj.jus.br"
# Public API key (CNJ provides this for public access)
DATAJUD_API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="

# Mapping of tribunal codes (first 4 digits of process number => API index)
TRIBUNAL_INDICES = {
    "8.26": "api_publica_tjsp",
    "8.19": "api_publica_tjrj",
    "8.13": "api_publica_tjmg",
    "8.05": "api_publica_tjba",
    "8.06": "api_publica_tjce",
    "8.16": "api_publica_tjpr",
    "8.21": "api_publica_tjrs",
    "8.17": "api_publica_tjpe",
    "8.08": "api_publica_tjdf",
    "8.09": "api_publica_tjes",
    "8.12": "api_publica_tjgo",
    "8.27": "api_publica_tjsp",  # São Paulo interior
    "5.01": "api_publica_trt1",
    "5.02": "api_publica_trt2",
    "5.15": "api_publica_trt15",
}


def _parse_numero_processo(numero: str) -> Optional[str]:
    """
    Clean and validate a Brazilian process number.
    Expected format: NNNNNNN-DD.AAAA.J.TR.OOOO
    """
    # Remove any non-digit characters except dots and dashes
    cleaned = re.sub(r'[^\d.\-]', '', numero.strip())
    # Validate basic format
    if re.match(r'^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$', cleaned):
        return cleaned
    # Try to match without formatting (just digits)
    digits_only = re.sub(r'[^\d]', '', numero.strip())
    if len(digits_only) == 20:
        # Reformat: NNNNNNN-DD.AAAA.J.TR.OOOO
        return f"{digits_only[:7]}-{digits_only[7:9]}.{digits_only[9:13]}.{digits_only[13]}.{digits_only[14:16]}.{digits_only[16:20]}"
    return None


def _get_tribunal_index(numero: str) -> str:
    """Determine the correct Datajud API index based on the process number."""
    # Extract J.TR from the formatted number
    match = re.search(r'\.\d{4}\.(\d\.\d{2})\.', numero)
    if match:
        code = match.group(1)
        for key, val in TRIBUNAL_INDICES.items():
            if code == key:
                return val
    return "api_publica_tjsp"  # Default fallback


async def lookup_case(numero_processo: str) -> Optional[dict]:
    """
    Query the Datajud API for public case data.
    Returns structured data or None if not found/error.
    """
    formatted = _parse_numero_processo(numero_processo)
    if not formatted:
        return None

    index = _get_tribunal_index(formatted)
    url = f"{DATAJUD_BASE_URL}/{index}/_search"

    query = {
        "query": {
            "match": {
                "numeroProcesso": re.sub(r'[^\d]', '', formatted)
            }
        },
        "size": 1
    }

    headers = {
        "Authorization": f"ApiKey {DATAJUD_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=query, headers=headers)

            if response.status_code != 200:
                print(f"Datajud API returned {response.status_code}: {response.text[:200]}")
                return None

            data = response.json()
            hits = data.get("hits", {}).get("hits", [])
            if not hits:
                return None

            source = hits[0].get("_source", {})

            # Extract and structure relevant data
            result = {
                "numero": source.get("numeroProcesso", ""),
                "classe": _safe_get(source, "classe", "nome"),
                "orgao_julgador": _safe_get(source, "orgaoJulgador", "nome"),
                "sistema": source.get("sistema", {}).get("nome", ""),
                "formato": source.get("formato", {}).get("nome", ""),
                "data_ajuizamento": source.get("dataAjuizamento", ""),
                "grau": source.get("grau", ""),
                "tribunal": source.get("tribunal", ""),
                "assuntos": [a.get("nome", "") for a in source.get("assuntos", [])],
                "movimentacoes": [],
            }

            # Get last 10 movements
            movs = source.get("movimentos", [])
            for mov in movs[:10]:
                result["movimentacoes"].append({
                    "data": mov.get("dataHora", ""),
                    "nome": mov.get("nome", ""),
                    "complementos": [
                        c.get("valor", "") for c in mov.get("complementosTabelados", [])
                    ],
                })

            return result

    except httpx.TimeoutException:
        print("Datajud API timeout")
        return None
    except Exception as e:
        print(f"Datajud lookup error: {e}")
        return None


def _safe_get(d: dict, key1: str, key2: str, default: str = "") -> str:
    """Safely get nested dict value."""
    try:
        return d.get(key1, {}).get(key2, default)
    except (AttributeError, TypeError):
        return default
