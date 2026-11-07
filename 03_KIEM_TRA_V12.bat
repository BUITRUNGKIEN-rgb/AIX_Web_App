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
"%PY%" kiem_tra_v12.py
pause
