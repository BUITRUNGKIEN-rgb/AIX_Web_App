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
if not exist "app.py" (
 echo [LOI] Khong thay app.py. Hay chay BAT nay trong thu muc project da cap nhat.
 pause
 exit /b 1
)
echo Python: %PY%
"%PY%" -c "import streamlit; import PIL" >nul 2>&1
if errorlevel 1 (
 echo [LOI] Chua cai Streamlit/Pillow trong moi truong dang dung.
 echo Chay: "%PY%" -m pip install -r requirements.txt -r requirements_cnn.txt
 pause
 exit /b 1
)
echo.
echo Truy cap tren CHINH MAY: http://localhost:8501
echo Khong mo qua IP 172.20.x.x neu muon dung camera.
echo Dung web: Ctrl+C trong cua so nay.
echo.
"%PY%" -m streamlit run app.py --server.address 127.0.0.1 --server.port 8501
if errorlevel 1 (
 echo [LOI] Streamlit khong chay duoc. Neu cong 8501 dang ban, hay tat web cu bang Ctrl+C.
 pause
 exit /b 1
)
