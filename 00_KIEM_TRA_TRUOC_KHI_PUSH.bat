@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if not errorlevel 1 (py KIEM_TRA_GITHUB_AN_TOAN.py) else (python KIEM_TRA_GITHUB_AN_TOAN.py)
echo.
pause
