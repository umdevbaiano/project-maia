"""
Maia Platform — RPA PJe Formulario Modeler
"""
from core.rpa.pages.base_page import BasePage
import asyncio

class PJeLoginPage(BasePage):
    URL = "https://pje.jus.br/pje/login.seam"  # URL Mock/Exemplo
    
    # Locators
    CERTIFICADO_BTN = "#btnCertificadoDigital"
    CPF_INPUT = "#cpf"
    PASSWORD_INPUT = "#senha"
    ENTER_BTN = "#btnEntrar"

    async def login_via_certificado(self):
        """Usa o certificado previamente injetado no nssdb via engine.py args."""
        await self.goto(self.URL)
        # O tribunal as vezes joga um modal na frente
        # Aqui injetaríamos um solver 2Captcha se fosse ReCaptcha
        await asyncio.sleep(2)  # Smart wait para animações
        await self.click_element(self.CERTIFICADO_BTN)
        await self.page.wait_for_load_state("networkidle")

    async def login_via_cpf(self, cpf: str, senha: str):
        """Fallback caso A1 falhe."""
        await self.goto(self.URL)
        await self.fill_text(self.CPF_INPUT, cpf)
        await self.fill_text(self.PASSWORD_INPUT, senha)
        await self.click_element(self.ENTER_BTN)
        await self.page.wait_for_load_state("networkidle")

class PJeProtocoloPage(BasePage):
    URL_NOVO = "https://pje.jus.br/pje/Processo/Novo"
    
    TIPO_PECA_SELECT = "#comboTipoPeca"
    FILE_INPUT = "#uploadPdf"
    PROTOCOLAR_BTN = "#btnAssinarEnviar"

    async def iniciar_protocolo_peticao(self, numero_processo: str, filepath: str):
        """Anexa o PDF do Themis RAG à base legal e clica em enviar."""
        await self.goto(self.URL_NOVO + f"?processo={numero_processo}")
        
        # 1. Selecionar o tipo (Mock)
        await self.fill_text(self.TIPO_PECA_SELECT, "Petição Genérica")
        
        # 2. Upload Automático do PDF gerado (Mock)
        await self.page.set_input_files(self.FILE_INPUT, filepath)

        # 3. Assinar
        await self.click_element(self.PROTOCOLAR_BTN)
        # Wait success alert...
        await self.page.wait_for_selector(".alert-success", timeout=60000)
