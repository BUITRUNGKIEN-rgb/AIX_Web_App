@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "PY=python"
if exist "..\.venv\Scripts\python.exe" set "PY=..\.venv\Scripts\python.exe"
if exist ".venv\Scripts\python.exe" set "PY=.venv\Scripts\python.exe"

if not exist "data\dataset-resized\cardboard" (
 echo [ERROR] Chua co bo anh TrashNet trong data\dataset-resized.
 exit /b 1
)
"%PY%" train_cnn.py --images "data/dataset-resized" --arch mobilenet_v3_large --split-manifest "results/split_manifest.csv" --model-dir "model" --results "results_cnn"
if errorlevel 1 (echo [ERROR] Huan luyen CNN chua thanh cong.& exit /b 1)
echo [OK] Xem model\ai02_mobilenet_v3_large.pth.

pause
