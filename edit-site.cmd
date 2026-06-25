
@echo off
REM Double-click to launch the myAnalyst local edit server.
REM Opens your site in the browser with the click-to-comment overlay.
cd /d "%~dp0"
echo Starting myAnalyst edit server...
node tools\edit-server.js
pause
