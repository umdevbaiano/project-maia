"""
Maia Platform — RPA Engine
Core driver manager for Playwright. 
Handles browser context, certificate emulation (A1 strategy via Chrome policies), 
and automatic screenshot capture upon failure.
"""
import os
import uuid
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
import logging

from core.rpa.exceptions import LocatorNotFoundError, PortalOfflineError

logger = logging.getLogger(__name__)

class RPAEngine:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self._playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.execution_id = str(uuid.uuid4())[:8]

    async def start(self):
        """Starts Playwright, Browser, and Context."""
        self._playwright = await async_playwright().start()
        
        # Chrome arguments to auto-select certificate if installed in Linux nssdb
        # This is vital for A1 certificates running in headless Docker.
        args = [
            '--disable-blink-features=AutomationControlled',
            '--auto-select-certificate-for-urls={"pattern":"*","filter":{}}',
            '--ignore-certificate-errors'
        ]

        self.browser = await self._playwright.chromium.launch(
            headless=self.headless,
            args=args
        )
        
        self.context = await self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            viewport={"width": 1920, "height": 1080},
            ignore_https_errors=True
        )
        self.page = await self.context.new_page()

    async def stop(self):
        """Cleanly close all resources."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self._playwright:
            await self._playwright.stop()

    async def capture_error_state(self, error_name: str) -> str:
        """Saves a screenshot and returns the path for auditing."""
        if not self.page:
            return ""
            
        os.makedirs("/tmp/rpa_errors", exist_ok=True)
        path = f"/tmp/rpa_errors/{error_name}_{self.execution_id}.png"
        try:
            await self.page.screenshot(path=path, full_page=True)
            logger.error(f"[RPA {self.execution_id}] Screenshot saved: {path}")
            return path
        except Exception as e:
            logger.error(f"Failed to capture error state: {e}")
            return ""

    async def smart_wait(self, selector: str, timeout: int = 30000) -> None:
        """Smart Wait implementation for dynamic gov portals."""
        try:
            await self.page.wait_for_selector(selector, state="visible", timeout=timeout)
        except Exception:
            screenshot = await self.capture_error_state("timeout")
            raise LocatorNotFoundError(f"Element {selector} not found after {timeout}ms.", screenshot)
