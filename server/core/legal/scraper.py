"""
Maia Platform — Legal Scraper
Scrapes Brazilian federal legislation from planalto.gov.br.
"""
import hashlib
from typing import Optional

import requests
from bs4 import BeautifulSoup


# Registry of all laws to scrape
# Format: (law_id, law_name, full_url)
LAWS_REGISTRY = [
    # Constituição
    ("cf88", "Constituição Federal de 1988",
     "https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm"),

    # Códigos clássicos (pré-2000, under /ccivil_03/)
    ("cc2002", "Código Civil (Lei 10.406/2002)",
     "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm"),
    ("cp1940", "Código Penal (Decreto-Lei 2.848/1940)",
     "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm"),
    ("cpp1941", "Código de Processo Penal (Decreto-Lei 3.689/1941)",
     "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm"),
    ("clt1943", "CLT (Decreto-Lei 5.452/1943)",
     "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm"),
    ("cdc1990", "Código de Defesa do Consumidor (Lei 8.078/1990)",
     "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm"),
    ("eca1990", "Estatuto da Criança e Adolescente (Lei 8.069/1990)",
     "https://www.planalto.gov.br/ccivil_03/leis/l8069compilado.htm"),
    ("ctn1966", "Código Tributário Nacional (Lei 5.172/1966)",
     "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm"),
    ("lep1984", "Lei de Execução Penal (Lei 7.210/1984)",
     "https://www.planalto.gov.br/ccivil_03/leis/l7210compilado.htm"),

    # Leis pós-2000 (under /ccivil_03/_ato*/)
    ("cpc2015", "Código de Processo Civil (Lei 13.105/2015)",
     "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm"),
    ("licitacoes2021", "Lei de Licitações (Lei 14.133/2021)",
     "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm"),
    ("maria_penha2006", "Lei Maria da Penha (Lei 11.340/2006)",
     "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm"),
    ("marco_civil2014", "Marco Civil da Internet (Lei 12.965/2014)",
     "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm"),
    ("lgpd2018", "LGPD (Lei 13.709/2018)",
     "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm"),
]


def fetch_law_text(url: str) -> Optional[str]:
    """
    Fetch and extract clean text from a planalto.gov.br law page.
    """
    try:
        response = requests.get(url, timeout=30, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        response.raise_for_status()

        html_bytes = response.content
        if html_bytes.startswith(b'\xff\xfe') or html_bytes.startswith(b'\xfe\xff'):
            html = html_bytes.decode('utf-16', errors='ignore')
        else:
            try:
                html = html_bytes.decode('utf-8')
            except UnicodeDecodeError:
                html = html_bytes.decode('iso-8859-1', errors='ignore')

        soup = BeautifulSoup(html, "html.parser")

        # Remove scripts, styles and head
        for tag in soup(["script", "style", "head"]):
            tag.decompose()

        # Extract text from full document (some pages like CC have content outside body)
        text = soup.get_text(separator="\n")

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
    Returns list of: {law_id, law_name, text, hash}
    """
    results = []
    for law_id, law_name, url in LAWS_REGISTRY:
        print(f"📥 Baixando: {law_name}...")
        text = fetch_law_text(url)
        if text and len(text) > 100:
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
    for lid, law_name, url in LAWS_REGISTRY:
        if lid == law_id:
            text = fetch_law_text(url)
            if text and len(text) > 100:
                return {
                    "law_id": lid,
                    "law_name": law_name,
                    "text": text,
                    "hash": compute_hash(text),
                }
    return None
