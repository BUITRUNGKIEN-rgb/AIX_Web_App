@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "%~dp0..\.venv\Scripts\python.exe" set "PY=%~dp0..\.venv\Scripts\python.exe"
if exist "%~dp0.venv\Scripts\python.exe" set "PY=%~dp0.venv\Scripts\python.exe"
"%PY%" compare_results_v9.py --old "results/validation_predictions.csv" --new "results_cnn/predictions_efficientnet_b2.csv" --out "results_cnn/so_sanh_v9"
if errorlevel 1 (echo [CANH BAO] Thieu CSV hoac khac validation. Khong duoc so sanh sai. & pause & exit /b 1)
pause
