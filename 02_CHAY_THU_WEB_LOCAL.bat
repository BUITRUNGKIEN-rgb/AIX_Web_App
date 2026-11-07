@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo SMART CAMPUS AI - mo tai http://localhost:8000
start "" "http://localhost:8000"
py -m http.server 8000
pause
