@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "%~dp0..\.venv\Scripts\python.exe" set "PY=%~dp0..\.venv\Scripts\python.exe"
if exist "%~dp0.venv\Scripts\python.exe" set "PY=%~dp0.venv\Scripts\python.exe"
echo CANH BAO: ConvNeXt-Tiny nang; neu CPU yeu, nen train B2 truoc.
if not exist "data\dataset-resized\metal" (echo [LOI] Thieu TrashNet & pause & exit /b 1)
"%PY%" train_cnn.py --arch convnext_tiny --images "data/dataset-resized" --split-manifest "results/split_manifest.csv" --model-dir "model" --results "results_cnn" --batch-size 4 --audit-near-duplicates
if errorlevel 1 (echo [LOI] Xem log phia tren. & pause & exit /b 1)
pause
