@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "%~dp0..\.venv\Scripts\python.exe" set "PY=%~dp0..\.venv\Scripts\python.exe"
if exist "%~dp0.venv\Scripts\python.exe" set "PY=%~dp0.venv\Scripts\python.exe"
if not exist "data\dataset-resized\metal" (
 echo [LOI] Thieu data\dataset-resized\metal - can du 6 lop TrashNet.
 pause
 exit /b 1
)
if not exist "results\split_manifest.csv" echo [CANH BAO] Khong co split V4. Khong so sanh theo cung holdout!
echo Dang huan luyen EfficientNet-B2 (pretrained ImageNet)...
"%PY%" train_cnn.py --arch efficientnet_b2 --images "data/dataset-resized" --split-manifest "results/split_manifest.csv" --model-dir "model" --results "results_cnn" --batch-size 8 --audit-near-duplicates
if errorlevel 1 (echo [LOI] Xem log phia tren. & pause & exit /b 1)
echo [OK] Kiem tra model\ai02_efficientnet_b2.pth
pause
