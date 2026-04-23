# Maia Desktop — Arquitetura e Guia de Build

Para transformar a Maia em um software instalável e otimizado para Windows, Mac e Linux, adotamos a arquitetura **Tauri + Sidecar**.

## 🏗️ Arquitetura
1.  **Frontend (UI)**: React + Vite (empacotado pelo Tauri).
2.  **Backend (Cérebro)**: FastAPI + Python (empacotado via PyInstaller como um binário independente).
3.  **Tauri (Wrapper)**: Controla a janela nativa e orquestra o ciclo de vida do backend.

## 🚀 Pré-requisitos
Para gerar os instaladores, sua máquina precisa de:
- **Rust**: [Instalar via rustup.rs](https://rustup.rs/)
- **Node.js**: v18+
- **Python**: v3.10+
- **Ferramentas de Build**:
  - **Windows**: Visual Studio C++ Build Tools.
  - **Linux**: libsoup, webkit2gtk.
  - **Mac**: Xcode.

## 🛠️ Passo a Passo para Build

### 1. Gerar o Binário do Servidor (Sidecar)
O backend Python precisa ser compilado em um executável para que o usuário não precise de Python instalado.
```powershell
cd server
python scripts/installer_build.py
```
Isso gerará um arquivo em `src-tauri/binaries/maia-server-[triple].exe`.

### 2. Preparar o Frontend
```powershell
cd client
npm install
npm run build
```

### 3. Gerar o Instalador do Software
```powershell
cd ..
npm run tauri build
```
O instalador (.exe, .dmg ou .deb) estará na pasta `src-tauri/target/release/bundle/`.

---

## ⚡ Otimizações Implementadas
- **Zero-Hallucination Brain**: Sistema de busca de 3 camadas (Doutrina -> Web -> Lógica).
- **Lightweight UI**: Tauri utiliza o WebView nativo do sistema, reduzindo o consumo de RAM em até 90% comparado ao Electron.
- **Persistent RAG**: O banco Vetorial (ChromaDB) roda localmente no binário do servidor.

---
**Status atual:** Ambiente configurado. Pronto para compilação assim que os pré-requisitos forem instalados.
