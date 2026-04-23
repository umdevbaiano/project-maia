"""
Maia Platform — Themis Stress Suite -> RPA Boundary
"""
import pytest
import os
from unittest.mock import patch
from playwright.async_api import async_playwright
from core.rpa.engine import RPAEngine
from core.rpa.exceptions import LocatorNotFoundError

@pytest.mark.asyncio
async def test_rpa_survives_heavy_network_throttling():
    """
    Força um gargalo de banda de rede (5000ms delay + baixíssimo bandwidth) e aguarda 
    o Smart Wait interceptar os Timeouts antes de acontecer um Server Crash.
    """
    engine = RPAEngine(headless=True)
    await engine.start()
    
    # Injeta delay severo na rede para emular tribunais sobrecarregados
    async def intercept_delay_route(route):
        await asyncio.sleep(5)  # 5000ms letargia
        await route.continue_()
        
    await engine.page.route("**/pje.jus.br/*", intercept_delay_route)
    
    # Tentativa de acesso base
    try:
        from core.rpa.pages.pje_pages import PJeLoginPage
        login_page = PJeLoginPage(engine.page)
        
        # O timeout precisa estar calibrado abaixo disso pra testes, ou a Exception explodirá
        # A intenção é que o Erro Dispáre o print_screen e feche sem vazar memória
        await login_page.goto(login_page.URL)
        await login_page.click_element(login_page.CERTIFICADO_BTN, timeout=1000)
        
        pytest.fail("Exception deveria ter sido raised devido ao timeout.")
    except LocatorNotFoundError as e:
        assert e.screenshot_path is not None
        assert os.path.exists(e.screenshot_path)
    finally:
        await engine.stop()
