@echo off
echo ========================================
echo   VettaLaw - Parando Aplicacao
echo ========================================
echo.

docker-compose down

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao parar containers.
    pause
    exit /b 1
)

echo.
echo Todos os servicos foram parados com sucesso!
echo.
pause
