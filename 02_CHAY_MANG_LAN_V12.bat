@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
 set "PY=.venv\Scripts\python.exe"
) else if exist "..\.venv\Scripts\python.exe" (
 set "PY=..\.venv\Scripts\python.exe"
) else (
 set "PY=python"
)
echo [CHU Y] Truy cap qua HTTP IP LAN (172.20.x.x) CO THE BI CHAN CAMERA.
echo Hay dung tai anh tu may/di dong, hoac cai HTTPS de bat camera tren may khac.
echo Chi chia se tren mang tin cay. Nhan Ctrl+C de tat.
echo.
"%PY%" -m streamlit run app.py --server.address 0.0.0.0 --server.port 8501
if errorlevel 1 pause
