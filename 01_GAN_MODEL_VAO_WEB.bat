@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo =============================================
echo SMART CAMPUS AI - GIAI DOAN GAN MODEL WEB
 echo Nhap duong dan THU MUC GOC cua bo code AI02 da train.
echo VD: D:\AI02\UNETI12_ODD3_AI02
 echo.
set /p "PROJECT=Duong dan du an AI02: "
if "%PROJECT%"=="" (
  echo Ban chua nhap duong dan.
  pause
  exit /b 1
)
py export_models_for_web.py --project "%PROJECT%"
if errorlevel 1 (
  echo.
  echo KHONG THANH CONG: kiem tra file metrics, file model va duong dan.
) else (
  echo.
  echo DA GAN XONG: day thu muc web nay len GitHub Pages.
)
pause
