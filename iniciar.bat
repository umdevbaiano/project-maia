@echo off
echo ========================================
echo   VettaLaw - Iniciando Aplicacao
echo ========================================
echo.

REM Verificar se o arquivo .env existe
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado!
    echo.
    echo Criando .env a partir de .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANTE: Edite o arquivo .env e adicione sua GEMINI_API_KEY
    echo Pressione qualquer tecla apos configurar o .env...
    pause
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo.
    echo Por favor, inicie o Docker Desktop e tente novamente.
    echo.
    pause
    exit /b 1
)

echo Docker detectado! Iniciando containers...
echo.

docker-compose up -d

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao iniciar containers.
    echo Verifique os logs com: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ========================================
echo   VettaLaw iniciado com sucesso!
echo ========================================
echo.
echo Aguarde cerca de 30 segundos e acesse:
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Para ver logs:     docker-compose logs -f
echo Para parar:        docker-compose down
echo Ou use o arquivo:  parar.bat
echo.

timeout /t 3 >nul
start http://localhost:5173

pause
