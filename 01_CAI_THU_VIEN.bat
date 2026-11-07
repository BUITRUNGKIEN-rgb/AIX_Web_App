@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "..\.venv\Scripts\python.exe" set "PY=..\.venv\Scripts\python.exe"
if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"

"%PY%" --version
if errorlevel 1 exit /b 1
"%PY%" -m pip install -r requirements.txt -r requirements_cnn.txt
if errorlevel 1 (echo [ERROR] Cai thu vien that bai.& exit /b 1)
echo [OK] Da cai thu vien cho V4 + CNN V5 + Streamlit.

pause
