import aiohttp
import logging
from typing import Optional, List, Dict
from config import get_settings

logger = logging.getLogger(__name__)

async def search_legal_web(query: str, max_results: int = 5) -> List[Dict]:
    """
    Search the web for legal references using Tavily API.
    Used as a fallback when RAG/Doctrine returns insufficient information.
    """
    settings = get_settings()
    api_key = settings.TAVILY_API_KEY
    
    if not api_key:
        logger.warning("TAVILY_API_KEY not configured. Web search skipped.")
        return []

    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": f"Direito brasileiro: {query}",
        "search_depth": "advanced",
        "include_answer": False,
        "include_raw_content": False,
        "max_results": max_results,
        "include_domains": ["planalto.gov.br", "stf.jus.br", "stj.jus.br", "tst.jus.br", "conjur.com.br", "migalhas.com.br"]
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("results", [])
                else:
                    logger.error(f"Tavily search failed with status {response.status}")
                    return []
    except Exception as e:
        logger.error(f"Error performing web search: {e}")
        return []

def format_search_results(results: List[Dict]) -> str:
    """Format Tavily results for insertion into the LLM prompt."""
    if not results:
        return ""
        
    formatted = "\n\n🌐 RESULTADOS DA PESQUISA WEB (FONTES CONFIÁVEIS):\n"
    for i, res in enumerate(results, 1):
        formatted += f"--- Fonte {i}: {res.get('title', 'Sem título')} ---\n"
        formatted += f"URL: {res.get('url')}\n"
        formatted += f"Conteúdo: {res.get('content')}\n\n"
    return formatted
