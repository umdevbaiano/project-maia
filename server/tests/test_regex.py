import re
import urllib.request
from bs4 import BeautifulSoup

def test_regex():
    url = "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html_bytes = urllib.request.urlopen(req).read()
    
    if html_bytes.startswith(b'\xff\xfe') or html_bytes.startswith(b'\xfe\xff'):
        html = html_bytes.decode('utf-16', errors='ignore')
    else:
        try:
            html = html_bytes.decode('utf-8')
        except UnicodeDecodeError:
            html = html_bytes.decode('iso-8859-1', errors='ignore')
            
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator="\n")
    
    idx = text.lower().find('art.')
    if idx != -1:
        print("Snippet around first Art.:", repr(text[idx:idx+100]))
    else:
        print("Could not find 'art.'. Raw text start:", repr(text[:500]))
        
    pattern_old = r'([Aa]rt\.\s*\d+[º°]?[\-A-Z]*\.?\s*)'
    parts_old = re.split(pattern_old, text)
    articles_old = [p.strip() for p in parts_old if re.match(pattern_old, p)]
    print(f"Old Regex found {len(articles_old)} articles.")
    if len(articles_old) > 0:
        print("Sample old:", articles_old[:5])

    # Handle `Art. 1º`, `Art. 1o`, `art. 2`, `art. 1o-A`, etc.
    pattern_new = r'((?:[Aa]rt\.|[Aa]rtigo)\s*\d+(?:[º°oOA-Z\-])*\.?\s*)'
    parts_new = re.split(pattern_new, text)
    articles_new = [p.strip() for p in parts_new if re.match(pattern_new, p)]
    print(f"\nNew Regex found {len(articles_new)} articles.")
    if len(articles_new) > 0:
        print("Sample new:", articles_new[:10])

if __name__ == "__main__":
    test_regex()
