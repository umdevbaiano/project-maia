# 🪟 Guia de Instalação VettaLaw para Windows

## ✅ Pré-requisitos para Windows

Você só precisa de **Docker Desktop** instalado. Ele inclui tudo que você precisa!

## 📥 Passo 1: Baixar o Projeto

1. **Baixe o arquivo:**
   ```
   https://dede3phc22dgx.cloudfront.net/creao2/3932ea59-bcbe-4d82-ab0d-240e65df5f61/182193b0-60d1-701d-7102-0b198bb91867/08fa1d36-e071-4254-9180-6c95e70e7249/vettalaw-mvp.tar.gz
   ```

2. **Extraia o arquivo:**
   - Clique com botão direito no arquivo baixado
   - Selecione "Extrair tudo..." ou use 7-Zip/WinRAR
   - Extraia para uma pasta de sua escolha (ex: `C:\projetos\vettalaw`)

## 🐳 Passo 2: Instalar Docker Desktop

1. **Baixe o Docker Desktop:**
   - Acesse: https://www.docker.com/products/docker-desktop
   - Clique em "Download for Windows"

2. **Instale:**
   - Execute o instalador baixado
   - Siga o assistente de instalação (aceite as configurações padrão)
   - **IMPORTANTE**: Permita que o instalador habilite o WSL 2 (Windows Subsystem for Linux)
   - Reinicie o computador se solicitado

3. **Inicie o Docker Desktop:**
   - Abra o Docker Desktop através do menu Iniciar
   - Aguarde o Docker inicializar completamente (ícone fica verde na bandeja)

## 🔑 Passo 3: Obter Chave da API Google Gemini

1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada (algo como: `AIzaSy...`)

## ⚙️ Passo 4: Configurar o Projeto

### Opção A: Usando o PowerShell (Recomendado)

1. **Abra o PowerShell:**
   - Pressione `Win + X`
   - Selecione "Windows PowerShell" ou "Terminal"

2. **Navegue até a pasta do projeto:**
   ```powershell
   cd C:\projetos\vettalaw
   ```

3. **Crie o arquivo .env:**
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

4. **No Notepad, edite a linha:**
   ```
   GEMINI_API_KEY=cole_sua_chave_aqui
   ```
   - Cole a chave que você copiou no Passo 3
   - Salve (Ctrl+S) e feche o Notepad

### Opção B: Usando o Explorador de Arquivos

1. Abra a pasta `vettalaw` no Explorador de Arquivos
2. Copie o arquivo `.env.example`
3. Cole e renomeie para `.env`
4. Abra o arquivo `.env` com Notepad
5. Substitua `your_google_gemini_api_key_here` pela sua chave
6. Salve o arquivo

## 🚀 Passo 5: Iniciar o VettaLaw

### No PowerShell/Terminal:

```powershell
# Certifique-se de estar na pasta vettalaw
cd C:\projetos\vettalaw

# Inicie todos os serviços
docker-compose up -d
```

### Ou usando o Prompt de Comando (CMD):

```cmd
cd C:\projetos\vettalaw
docker-compose up -d
```

**O que vai acontecer:**
- O Docker vai baixar as imagens necessárias (primeira vez demora ~5 minutos)
- Iniciará 3 containers: MongoDB, Backend (Python), Frontend (React)
- Mostrará mensagens de sucesso quando tudo estiver pronto

## 🌐 Passo 6: Acessar a Aplicação

Aguarde cerca de 30-60 segundos após o comando, então abra seu navegador:

- **Aplicação Principal**: http://localhost:5173
- **API Backend**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## ✅ Testar se Está Funcionando

1. Acesse http://localhost:5173
2. Você verá o **Dashboard do VettaLaw** (com gráficos e KPIs)
3. No canto inferior direito, clique no **botão azul pulsante** (ChatWidget)
4. Digite: "Qual o prazo para contestação em ação trabalhista?"
5. A **Maia** (IA) deve responder em alguns segundos

## 🛠️ Comandos Úteis do Windows

### Ver se os containers estão rodando:
```powershell
docker ps
```

### Ver logs em tempo real:
```powershell
docker-compose logs -f
```

### Parar todos os serviços:
```powershell
docker-compose down
```

### Reiniciar tudo:
```powershell
docker-compose restart
```

### Ver logs de um serviço específico:
```powershell
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

## 🐛 Problemas Comuns no Windows

### ❌ "Docker não está rodando"
**Solução:**
1. Abra o Docker Desktop através do menu Iniciar
2. Aguarde o ícone ficar verde na bandeja
3. Tente novamente

### ❌ "WSL 2 installation is incomplete"
**Solução:**
1. Abra PowerShell como Administrador
2. Execute:
   ```powershell
   wsl --install
   ```
3. Reinicie o computador
4. Inicie o Docker Desktop novamente

### ❌ "Porta já em uso"
**Solução:**
Verifique se não há outras aplicações usando as portas:
```powershell
netstat -ano | findstr :5173
netstat -ano | findstr :8000
netstat -ano | findstr :27017
```

### ❌ "Permission denied" ou erro de permissão
**Solução:**
Execute o PowerShell/CMD como **Administrador**:
1. Clique com botão direito no PowerShell/CMD
2. Selecione "Executar como administrador"

### ❌ Frontend mostra página em branco
**Solução:**
Aguarde mais tempo (pode levar até 2 minutos) e recarregue a página (F5)

Ou verifique os logs:
```powershell
docker-compose logs frontend
```

## 📂 Estrutura de Pastas no Windows

Após extrair, você terá:
```
C:\projetos\vettalaw\
├── server\              # Backend Python
├── client\              # Frontend React
├── docker-compose.yml   # Configuração Docker
├── .env                 # Suas configurações (criar)
├── .env.example         # Exemplo de configuração
├── start.sh             # Script Linux (não usar no Windows)
└── README.md            # Documentação
```

## 💡 Dicas para Windows

1. **Use o Windows Terminal** (melhor que CMD):
   - Instale pela Microsoft Store: "Windows Terminal"
   - Suporta PowerShell, CMD e WSL

2. **Acesse Docker Desktop Dashboard:**
   - Clique no ícone do Docker na bandeja
   - Veja status dos containers, logs, etc.

3. **Atalho para parar/iniciar:**
   - Crie um arquivo `iniciar.bat` com:
     ```batch
     @echo off
     cd C:\projetos\vettalaw
     docker-compose up -d
     start http://localhost:5173
     ```
   - Crie um arquivo `parar.bat` com:
     ```batch
     @echo off
     cd C:\projetos\vettalaw
     docker-compose down
     ```

## 🎯 Desenvolvimento sem Docker (Avançado)

Se preferir rodar nativamente no Windows:

### Backend:
```powershell
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Instale MongoDB Community: https://www.mongodb.com/try/download/community
# Configure variáveis de ambiente no PowerShell:
$env:MONGODB_URL="mongodb://localhost:27017"
$env:GEMINI_API_KEY="sua_chave_aqui"

uvicorn main:app --reload
```

### Frontend:
```powershell
cd client
npm install
npm run dev
```

**Porém, usar Docker é MUITO mais fácil!** 😊

## ✨ Pronto!

Agora você tem o VettaLaw rodando no Windows!

**Qualquer problema, verifique:**
1. Docker Desktop está rodando? (ícone verde na bandeja)
2. Arquivo `.env` está configurado com sua chave?
3. Aguardou tempo suficiente após `docker-compose up -d`?

---

**🎉 Aproveite o VettaLaw!**
