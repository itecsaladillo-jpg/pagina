@echo off
title Servidor Asistente ITEC
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="GEMINI_API_KEY" set GEMINI_API_KEY=%%b
    )
)
:: pip install -r requirements.txt
echo ==========================================
echo Iniciando servidor backend del Asistente ITEC...
echo ==========================================
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
