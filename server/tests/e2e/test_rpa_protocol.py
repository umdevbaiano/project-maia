"""
Maia Platform — RPA Resilience Test (E2E)
Tests the bot's reaction to failing government servers.
Requires pytest-playwright.
"""
import pytest
import os
from unittest.mock import patch
from playwright.async_api import async_playwright
from core.rpa.engine import RPAEngine
from core.rpa.exceptions import PortalOfflineError, LocatorNotFoundError

@pytest.mark.asyncio
async def test_rpa_engine_captures_screenshot_on_503_timeout():
    """
    Testa se o RPA tira printscreen e relata o erro ao tomar um 503 Service Unavailable do PJe.
    """
    engine = RPAEngine(headless=True)
    await engine.start()
    
    # Rotear/Mockar a URL do Tribunal para devolver um 503
    async def intercept_route(route):
        await route.fulfill(status=503, body="Serviço Indisponível (Mock)")
        
    await engine.page.route("**/pje.jus.br/*", intercept_route)
    
    # Try navigation and action
    try:
        from core.rpa.pages.pje_pages import PJeLoginPage
        login_page = PJeLoginPage(engine.page)
        
        # O goto vai completar (pois 503 é finalizado), 
        # mas o smart_wait do botão deve falhar via Timeout porque não tem UI.
        # Nós ajustamos o timeout do click_element para falhar extremamente rápido pra teste.
        await login_page.goto(login_page.URL)
        await login_page.click_element(login_page.CERTIFICADO_BTN, timeout=1000)
        
        # Test will fail if we reach here
        pytest.fail("Should have raised LocatorNotFoundError")
    except LocatorNotFoundError as e:
        # Verifica se tirou a print
        assert e.screenshot_path is not None
        assert "timeout" in e.screenshot_path
        assert os.path.exists(e.screenshot_path)
    finally:
        await engine.stop()
