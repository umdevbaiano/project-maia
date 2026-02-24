"""
Maia Platform — Legal Scraper
Scrapes Brazilian federal legislation from planalto.gov.br.
"""
import re
import hashlib
from typing import Optional

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.planalto.gov.br/ccivil_03"

# Registry of all laws to scrape
LAWS_REGISTRY = [
    # (law_id, law_name, url_path)
    ("cf88", "Constituição Federal de 1988", "/constituicao/constituicao.htm"),
    ("cc2002", "Código Civil (Lei 10.406/2002)", "/leis/2002/L10406compilada.htm"),
    ("cp1940", "Código Penal (Decreto-Lei 2.848/1940)", "/decreto-lei/Del2848compilado.htm"),
    ("cpc2015", "Código de Processo Civil (Lei 13.105/2015)", "/leis/L13105.htm"),  # Sem compilação
    ("cpp1941", "Código de Processo Penal (Decreto-Lei 3.689/1941)", "/decreto-lei/Del3689Compilado.htm"),
    ("clt1943", "CLT (Decreto-Lei 5.452/1943)", "/decreto-lei/Del5452compilado.htm"),
    ("cdc1990", "Código de Defesa do Consumidor (Lei 8.078/1990)", "/leis/L8078compilado.htm"),
    ("eca1990", "Estatuto da Criança e Adolescente (Lei 8.069/1990)", "/leis/L8069compilado.htm"),
    ("ctn1966", "Código Tributário Nacional (Lei 5.172/1966)", "/leis/L5172Compilado.htm"),
    ("lep1984", "Lei de Execução Penal (Lei 7.210/1984)", "/leis/L7210compilado.htm"),
    ("licitacoes2021", "Lei de Licitações (Lei 14.133/2021)", "/leis/L14133.htm"),  # Sem compilação
    ("maria_penha2006", "Lei Maria da Penha (Lei 11.340/2006)", "/leis/L11340.htm"),  # Sem compilação
    ("marco_civil2014", "Marco Civil da Internet (Lei 12.965/2014)", "/leis/L12965.htm"),  # Sem compilação
    ("lgpd2018", "LGPD (Lei 13.709/2018)", "/leis/L13709compilado.htm"),
]


def fetch_law_text(url_path: str) -> Optional[str]:
    """
    Fetch and extract clean text from a planalto.gov.br law page.
    """
    url = f"{BASE_URL}{url_path}"
    try:
        response = requests.get(url, timeout=30, headers={
            "User-Agent": "Mozilla/5.0 (Maia Platform Legal Indexer)"
        })
        response.encoding = response.apparent_encoding or "utf-8"
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove scripts and styles
        for tag in soup(["script", "style", "head"]):
            tag.decompose()

        # Try to find the main content area
        # planalto.gov.br uses various structures
        content = soup.find("div", {"id": "conteudo"}) or soup.find("body")
        if not content:
            return None

        # Get text
        text = content.get_text(separator="\n")

        # Clean up
        lines = [line.strip() for line in text.splitlines()]
        text = "\n".join(line for line in lines if line)

        return text

    except Exception as e:
        print(f"❌ Error fetching {url}: {e}")
        return None


def compute_hash(text: str) -> str:
    """Compute hash for change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def scrape_all_laws() -> list[dict]:
    """
    Scrape all laws from the registry.
    Returns list of: {law_id, law_name, text, hash, article_count}
    """
    results = []
    for law_id, law_name, url_path in LAWS_REGISTRY:
        print(f"📥 Baixando: {law_name}...")
        text = fetch_law_text(url_path)
        if text:
            text_hash = compute_hash(text)
            results.append({
                "law_id": law_id,
                "law_name": law_name,
                "text": text,
                "hash": text_hash,
            })
            print(f"   ✅ {law_name}: {len(text)} caracteres")
        else:
            print(f"   ⚠️ Não foi possível baixar: {law_name}")

    return results


def scrape_single_law(law_id: str) -> Optional[dict]:
    """Scrape a single law by its ID."""
    for lid, law_name, url_path in LAWS_REGISTRY:
        if lid == law_id:
            text = fetch_law_text(url_path)
            if text:
                return {
                    "law_id": lid,
                    "law_name": law_name,
                    "text": text,
                    "hash": compute_hash(text),
                }
    return None
