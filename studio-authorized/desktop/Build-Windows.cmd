@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo 请先安装 Node.js 22.13 或更高版本，然后重新运行。
 pause
 exit /b 1
)
call npm install
if errorlevel 1 goto failed
call npm run test
if errorlevel 1 goto failed
call npm run dist:win
if errorlevel 1 goto failed
echo 安装包已生成，请打开 release 文件夹。
start "" "%cd%\release"
pause
exit /b 0
:failed
echo 打包未完成，请保留上方错误信息。
pause
exit /b 1
