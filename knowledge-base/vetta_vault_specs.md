# Vetta Vault - Blueprint Arquitetural (On-Premise Edge AI)

O **Vetta Vault** representa a evolução definitiva em privacidade jurídica: processamento de linguagem natural severamente restrito, rodando *Baremetal* dentro dos escritórios de advocacia, eliminando o envio de PII e Segredos de Justiça para a nuvem.

---

## 1. Topologia de Hardware (O Motor Metálico)
Para garantir inferência rápida do **LLaMA-3 8B Instruct** (ou equivalente como Mistral NeMo), sem os custos astronômicos de Servidores HGX (A100/H100), nós otimizamos a stack para funcionar com hardware _Consumer_ de Alta Capacidade em gabinetes de 1U ou Mini-PCs Industriais.

### Configuração Recommended (Vault Standard)
*   **Form Factor:** Servidor 1U rackmount curto ou Micro-Node Industrial (ex: série MS-01 / NUC Extreme).
*   **GPU (O Cérebro):** 1x NVIDIA RTX 4060 Ti (16GB VRAM) ou RTX 4000 SFF Ada Generation (20GB VRAM). 
    *   *Por que 16GB+?* Modelos de 8 Bilhões de parâmetros quantizados em 8-bits exigem cerca de 8.5 GB de VRAM. Os 8GB restantes são devorados pelo Context Window (devemos suportar 8,192 a 16k tokens para bater o RAG do Themis).
*   **Processador / RAM:** Intel Core i7/i9 moderno ou AMD Ryzen 9. Múltiplos núcleos. Mínimo de 64GB DDR5 (para desafogar o banco vetorial ChromaDB in-memory).
*   **Storage:** 2TB NVMe PCIe 4.0. Redundância em RAID 1.

---

## 2. Software Stack (A Engenharia Subjacente)

A máquina operará totalmente auto-contida. Se cortarmos o cabo de internet externa do escritório, o Chat Themis e RAG continuam a funcionar.

*   **Sistema Operacional:** Ubuntu Server 24.04 LTS (Minimal) ou Proxmox VE (se o cliente desejar isolamento de VMs).
*   **Inference Engine:** `vLLM` via Docker. 
    *   **Motivo:** Extremamente contínuo, performático via PagedAttention.
    *   **Integração Padrão:** O `vLLM` expõe uma porta HTTP na rede interna imitando identicamente a **API da OpenAI** (`/v1/chat/completions`). Assim, o backend atual em FastAPI e o módulo `AIProvider` precisarão de um único condicional para apontar o Base URL para o IP Local do Vault.
*   **Databases:** MongoDB (Auth, Telemetry) e ChromaDB (Vetores) como contêineres colados no mesmo Docker Compose. 

---

## 3. Escalonamento Agentic (O Plano dos "Braços")
A transição da "IA que responde" para a "IA que executa":

**Abordagem MVP:** Automação via **Playwright (Stealth Mode)**.
Dado que os protocolos MNI (Modelo Nacional de Interoperabilidade) de cortes como E-SAJ e PJe costumam ser extremamente burocráticos para chaves de API, a tática "Guerrilha" de Produto consiste em:
- Agentes de scraping que simulam perfis humanos no Chromium headless, varrendo pushes processuais ou preenchendo guias judiciais em massa.
- Serviço anti-captcha integrado a uma API 2Captcha, atuando simultaneamente com o RAG e emitindo Relatórios ("Fiz o push das petições da fila X").
