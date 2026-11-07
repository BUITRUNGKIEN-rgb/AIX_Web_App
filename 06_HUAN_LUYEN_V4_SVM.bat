@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "..\.venv\Scripts\python.exe" set "PY=..\.venv\Scripts\python.exe"
if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"

if not exist "data\dataset-resized\cardboard" (
 echo [ERROR] Chua co TrashNet trong data\dataset-resized.
 exit /b 1
)
"%PY%" -m src.train_advanced --images "data/dataset-resized" --out "results" --model-dir "model"

pause
