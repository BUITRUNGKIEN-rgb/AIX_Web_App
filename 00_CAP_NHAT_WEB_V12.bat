@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
set "TARGET=D:\UNETI12_ODD3_AI02_V3_RA_SOAT_KY\UNETI12_ODD3_AI02"
echo ======================================================
echo SMART CAMPUS AI02 - WEB V12 ON DINH
 echo ======================================================
echo.
set /p "USERPATH=Duong dan du an AI02 (Enter de dung mac dinh): "
if defined USERPATH set "TARGET=%USERPATH%"
set "TARGET=%TARGET:"=%"
if not exist "%TARGET%\inference_bridge.py" (
 echo [LOI] Khong tim thay inference_bridge.py. Hay chon dung thu muc project V9/V11.
 pause
 exit /b 1
)
if not exist "%TARGET%\src\predict.py" (
 echo [LOI] Thieu src\predict.py trong project. Hay chon dung thu muc goc.
 pause
 exit /b 1
)
if not exist "%~dp0app.py" (
 echo [LOI] Bo cap nhat thieu app.py.
 pause
 exit /b 1
)
if not exist "%TARGET%\backup_ui" mkdir "%TARGET%\backup_ui"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%T"
if not defined STAMP set "STAMP=manual"
if exist "%TARGET%\app.py" copy /Y "%TARGET%\app.py" "%TARGET%\backup_ui\app_before_v12_%STAMP%.py" >nul
copy /Y "%~dp0app.py" "%TARGET%\app.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp0ui_v10_utils.py" "%TARGET%\ui_v10_utils.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp001_CHAY_LOCAL_V12.bat" "%TARGET%\01_CHAY_LOCAL_V12.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp002_CHAY_MANG_LAN_V12.bat" "%TARGET%\02_CHAY_MANG_LAN_V12.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp003_KIEM_TRA_V12.bat" "%TARGET%\03_KIEM_TRA_V12.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp0kiem_tra_v12.py" "%TARGET%\kiem_tra_v12.py" >nul
if errorlevel 1 goto error
if not exist "%TARGET%\.streamlit" mkdir "%TARGET%\.streamlit"
copy /Y "%~dp0.streamlit\config.toml" "%TARGET%\.streamlit\config.toml" >nul
if errorlevel 1 goto error
echo.
echo [OK] Web V12 da duoc cap nhat vao:
echo %TARGET%
echo [OK] Da sao luu app.py cu trong backup_ui.
echo [OK] Khong xoa data, model, results, results_cnn.
echo.
echo TAT Streamlit cu bang Ctrl+C, sau do chay 01_CHAY_LOCAL_V12.bat.
pause
exit /b 0
:error
echo [LOI] Khong copy duoc tep. Kiem tra quyen ghi va duong dan.
pause
exit /b 1
