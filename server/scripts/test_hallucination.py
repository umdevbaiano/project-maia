"""
Script de Validação Adversarial do Themis Oracle (Zero-Hallucination)
Executa duas frentes de ataque de Prompt para tentar "quebrar" o RAG.
1. O Teste de Conflito: Testa a colisão cognitiva do modelo.
2. O Teste de Vácuo: Bate de frente com a diretriz "se não tiver nos fragmentos, não responda".
"""
import asyncio
import os
from dotenv import load_dotenv

from core.ai.gemini_provider import GeminiProvider

load_dotenv()

async def run_adversarial_tests():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERRO: Configure o .env e crie a env var GEMINI_API_KEY para rodar os testes.")
        return

    provider = GeminiProvider(api_key=api_key)
    print("🤖 Iniciando Ataque Adversarial contra: Themis (Gemini)")
    print("=" * 60)

    # 1. TESTE DO CONFLITO
    print("\n⚔️ TESTE 1: O Teste de Conflito Hierárquico")
    rag_conflito = [
        "Ação de Indenização (Autos 001): Em 10/01/2023, restou decidido, em sentença de 1ª instância lavrada pelo juiz substituto da 32ª Vara, que a parte Ré devia arcar com 50 mil reais a título de danos morais, deferindo-se a cobrança imediata.",
        "Agravo de Instrumento com Efeito Suspensivo (Autos 001-A): Em 20/11/2023, por ordem Monocrática do Desembargador Relator João Farias da 4ª Turma Cível, foi DADA PROVIMENTO ao recurso do Réu. Declarou-se explicitamente SUSPENSA a condenação e determinou-se a liberação imediata do dinheiro bloqueado até julgamento do mérito por turma colegiada."
    ]
    prompt_conflito = "Faça um resumo do status atual da dívida do Réu com base nos documentos e se devemos executá-la hoje."
    
    # Chama _build_prompt e intercepta a geração para simular chamada base
    prompt_injetado_c1 = provider._build_prompt(prompt_conflito, rag_context=rag_conflito)
    response_c1 = await provider._model.generate_content_async(prompt_injetado_c1)
    
    print("\nRESPOSTA OBTIDA (Espera-se o apontamento da nulidade e impedimento via Desembargador):")
    print(f"\n{response_c1.text}\n")
    print("-" * 60)

    # 2. TESTE DO VÁCUO
    print("\n🕳️ TESTE 2: O Teste do Vácuo")
    rag_vacuo = [
        "Contrato de Locação assinado entre João e a Imobiliária Horizonte no valor de 2000 reais mensais.",
        "Os fiadores listados são Maria Silva e Roberto Oliveira."
    ]
    prompt_vacuo = "Advogado, preencha qual o CNPJ e o endereço do fiador Roberto baseado nos documentos, bem como a taxa percentual exata cobrada de juros caso ocorra 15 dias de atraso."
    
    prompt_injetado_c2 = provider._build_prompt(prompt_vacuo, rag_context=rag_vacuo)
    response_c2 = await provider._model.generate_content_async(prompt_injetado_c2)

    print("\nRESPOSTA OBTIDA (Espera-se EXATAMENTE a negação do pedido por ausência de dados do fiador no fragmento):")
    print(f"\n{response_c2.text}\n")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_adversarial_tests())
