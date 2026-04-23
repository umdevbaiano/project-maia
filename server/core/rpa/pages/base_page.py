"""
Maia Platform — RPA Page Object Model (Base)
"""
from typing import Optional
from playwright.async_api import Page
import logging

from core.rpa.exceptions import LocatorNotFoundError

logger = logging.getLogger(__name__)

class BasePage:
    def __init__(self, page: Page):
        self.page = page

    async def goto(self, url: str):
        logger.info(f"Navigating to {url}")
        await self.page.goto(url, wait_until="networkidle")

    async def click_element(self, selector: str, timeout: int = 15000):
        try:
            await self.page.wait_for_selector(selector, state="visible", timeout=timeout)
            await self.page.click(selector)
        except Exception as e:
            raise LocatorNotFoundError(f"Failed to click element: {selector}") from e

    async def fill_text(self, selector: str, text: str, timeout: int = 15000):
        try:
            await self.page.wait_for_selector(selector, state="visible", timeout=timeout)
            await self.page.fill(selector, text)
        except Exception as e:
            raise LocatorNotFoundError(f"Failed to fill element: {selector}") from e
