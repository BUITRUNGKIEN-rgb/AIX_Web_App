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
echo CHI DUNG TREN MANG TIN CAY.
echo Khong bat camera tu trinh duyet may khac neu dung HTTP qua IP.
echo TAI ANH len van hoat dong duoc.
"%PY%" -m streamlit run app.py --server.address 0.0.0.0 --server.port 8501
if errorlevel 1 pause
