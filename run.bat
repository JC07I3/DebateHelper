@echo off
echo ====================================================
echo   Debate Helper (React + Vite) 啟動程式
echo ====================================================
echo.
echo 正在啟動本地伺服器，請稍候...
echo 伺服器啟動後將自動為您開啟瀏覽器。
echo 若要關閉專案，請在這個視窗按下 Ctrl + C，然後輸入 Y。
echo.
set PATH=C:\Program Files\nodejs;%PATH%
start http://localhost:5173
npm run dev
