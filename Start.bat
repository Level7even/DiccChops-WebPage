@echo off
cd /d "%~dp0"
py -m http.server 8000
pause
