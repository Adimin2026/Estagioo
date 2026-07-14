@echo off
set PATH=C:\Program Files\nodejs;%PATH%
echo Iniciando servidor...
start /B node server.js
echo Servidor rodando em http://localhost:3000
echo Pressione qualquer tecla para parar...
pause
taskkill /f /im node.exe >nul 2>&1
