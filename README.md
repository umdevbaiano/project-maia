<div align="center">
  <img src="./client/public/maia-avatar.png" alt="Maia Logo" width="120" />
  <h1>Plataforma Maia • Projeto Themis</h1>
  <p><strong>A Inteligência Artificial Definitiva para a Advocacia de Alta Performance.</strong></p>

  <p>
    <a href="#arquitetura"><img alt="Arquitetura" src="https://img.shields.io/badge/Architecture-FastAPI%20%2B%20React-blue?style=for-the-badge" /></a>
    <a href="#segurança"><img alt="Segurança" src="https://img.shields.io/badge/Security-LGPD%20%2B%20DLP-green?style=for-the-badge" /></a>
    <a href="#ia"><img alt="IA" src="https://img.shields.io/badge/Agentes-RAG%20%2B%20RPA-orange?style=for-the-badge" /></a>
  </p>
</div>

---

## 🏛️ Sobre o Projeto

A **Plataforma Maia** (núcleo do *Projeto Themis*) não é apenas um "assistente textual". Trata-se de uma infraestrutura assíncrona, robusta e modular projetada para erradicar o trabalho cognitivo repetitivo (processamento de provas, identificação de prazos e preenchimento de portais judiciários).

O sistema inova ao abandonar a dependência cega a modelos genéricos que sofrem de "alucinações judiciais". Ele força os modelos de Inteligência Artificial através de **Grounding Estrito (RAG Híbrido)**, forçando a máquina a ler centenas de páginas de PDFs locais e gerar teses amarradas umbilicalmente ao livro de provas reais inseridas pela equipe.

---

## 🚀 Principais Features

*   ⚖️ **Chat com Grounding (RAG)**: Você conversa diretamente com seus documentos jurídicos (em PDFs). O Motor de IA só retorna teses fundadas nas jurisprudências inseridas na sua base privada.
*   🤖 **RPA (Robotic Process Automation)**: Integração para protocolo e assinatura automática em portais como e-SAJ e PJe usando tecnologia Playwright.
*   🛡️ **Vetta DLP (Data Loss Prevention)**: A arquitetura possui um sidecar que "vê e cega" CPFs e dados sigilosos num milissegundo, preservando o sigilo corporativo cliente-advogado a nível **ISO 27001**.
*   ⏱️ **Dashboard Inteligente e CRM**: Gerenciamento integrado a Tribunais para levantamento automático de Comarcas, Polos Processuais e Alertas Preditivos de Prescrição.
*   💅 **SaaS Premium UI**: Construída em **React Vite e Tailwind V4**, entregando modo noturno imersivo de altíssimo contraste via filosofia de Design *Glassmorphism*.

---

## 🏗️ Arquitetura Tecnológica

### Backend (Python)
- **FastAPI**: Orquestração assíncrona brutal em alta velocidade.
- **MongoDB + Motor**: Banco de Dados NoSQL escalável com drivers não-bloqueantes.
- **ChromaDB**: Banco Vetorial operando buscas semânticas instantâneas em contratos milionários.

### Frontend (TypeScript / React)
- **React 18 + Vite**: SPA ultrarrápida.
- **Framer Motion + Lucide**: Interfaces orgânicas e reativas.
- **TailwindCSS**: Utilitários atômicos para estilização consistente e minimalista.

### Hospedagem & Cloud (Vercel + Render)
A infraestrutura está otimizada sob o conceito de *Continuous Delivery*:
- **Rosto (Front):** Distribuído na rede CDN Global da Vercel.
- **Músculo (Back + Bancos):** Conteinerizado nativamente na Render, com Provisionamento de Código via `render.yaml`.

---

## 🖥️ Instalação (Deploy e Modo Desenvolvedor)

### 1. Usando a Render (Nuvem em 1 Clique)
Na raiz deste repositório encontra-se a automação IaaS (`render.yaml`).
1. Crie uma conta na [Render](https://render.com).
2. Vá em **Blueprints** -> **New Blueprint**.
3. Selecione este repositório. O banco Vetorial, o Serviço Mongo e o Backend Python irão se organizar sozinhos na arquitetura correta e de portas blindadas.

### 2. Rodando Localmente (Docker Compose)
Se você quer contribuir localmente usando o ecossistema inteiro:

```bash
# 1. Renomeie o arquivo de senhas
cp .env.example .env.production
# (Preencha suas senhas e a GEMINI_API_KEY no arquivo)

# 2. Inicialize tudo (Backend, Frontend, MongoDB, ChromaDB)
docker compose up -d --build
```
*O Backend ficará na porta `8000` e o painel em `5173`.*

---

## 🔒 Postura de Dados (LGPD Compliance)

Desenvolvido rigorosamente sobre os preceitos da LGPD Brasileira (Lei 13.709/18). Todo pipeline de orquestração de texto foi fragmentado de maneira a não reter cópias permanentes expostas em memória Cache. Componentes modulares operam sob criptografia de At-Rest, permitindo implantações completas em formato Zero-Trust local.

---
*“A advocacia do futuro não se julga pelo volume de petições empilhadas, mas pela inteligência estratégica capaz de controlá-las.”* — Vetta Hub Tecnologia
