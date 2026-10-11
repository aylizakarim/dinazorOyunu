@echo off
title Dinozor Oyunu - Yerel Sunucu

:: Scriptin bulundugu dizine gecis yap
cd /d "%~dp0"

echo ===================================================
echo   🦖 Dinozor Oyunu Baslatiliyor...
echo   Lutfen oyun oynarken bu pencereyi kapatmayin.
echo ===================================================
echo.

:: Sunucu kurulurken 3 saniye bekleyip tarayiciyi otomatik ac
start "" cmd /c "timeout /t 3 >nul & start http://localhost:5173"

:: Vite geliştirme sunucusunu başlat
npm run dev

pause