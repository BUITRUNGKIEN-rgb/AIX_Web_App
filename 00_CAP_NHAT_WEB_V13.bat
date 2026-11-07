@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
set "TARGET=D:\UNETI12_ODD3_AI02_V3_RA_SOAT_KY\UNETI12_ODD3_AI02"
echo ========================================================
echo AI02 V13 - NHAN DIEN DA GOC + TU VAN TAI CHE
echo ========================================================
echo.
set /p "USERPATH=Duong dan project (ENTER de dung mac dinh): "
if defined USERPATH set "TARGET=%USERPATH%"
set "TARGET=%TARGET:"=%"
if not exist "%TARGET%\inference_bridge.py" (
  echo [LOI] Khong tim thay inference_bridge.py. Hay chon dung project V9-V12.
  pause
  exit /b 1
)
if not exist "%TARGET%\src\predict.py" (
  echo [LOI] Thieu src\predict.py. Hay chon thu muc GOC project.
  pause
  exit /b 1
)
if not exist "%~dp0app.py" (
  echo [LOI] Thieu app.py trong goi cap nhat.
  pause
  exit /b 1
)
if not exist "%TARGET%\backup_ui" mkdir "%TARGET%\backup_ui"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%T"
if not defined STAMP set "STAMP=manual"
if exist "%TARGET%\app.py" copy /Y "%TARGET%\app.py" "%TARGET%\backup_ui\app_before_v13_%STAMP%.py" >nul
copy /Y "%~dp0app.py" "%TARGET%\app.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp0recycling_advice.py" "%TARGET%\recycling_advice.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp0multiview_inference.py" "%TARGET%\multiview_inference.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp0ui_v10_utils.py" "%TARGET%\ui_v10_utils.py" >nul
if errorlevel 1 goto error
copy /Y "%~dp001_CHAY_LOCAL_V13.bat" "%TARGET%\01_CHAY_LOCAL_V13.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp002_CHAY_LAN_V13.bat" "%TARGET%\02_CHAY_LAN_V13.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp003_KIEM_TRA_V13.bat" "%TARGET%\03_KIEM_TRA_V13.bat" >nul
if errorlevel 1 goto error
copy /Y "%~dp0kiem_tra_v13.py" "%TARGET%\kiem_tra_v13.py" >nul
if errorlevel 1 goto error
echo.
echo [OK] Cap nhat V13 thanh cong tai:
echo %TARGET%
echo [OK] Da sao luu app.py truoc khi thay.
echo [OK] KHONG xoa model, data, results, results_cnn.
echo.
echo TAT Streamlit cu bang Ctrl+C.
echo Sau do mo project va chay 01_CHAY_LOCAL_V13.bat.
pause
exit /b 0
:error
echo [LOI] Khong copy duoc tep. Kiem tra quyen ghi va duong dan.
pause
exit /b 1
