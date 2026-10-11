@echo off
title GitHub'a Yukle - Dinozor Oyunu
cd /d "%~dp0"

echo ============================================================
echo   🦖 Dinozor Oyunu - GitHub'a Push Islemi Baslatiliyor...
echo   Eger GitHub giris penceresi acilirsa lutfen giris yapin.
echo ============================================================
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ============================================================
    echo   [BASARILI] Kodlar GitHub'a basariyla gonderildi!
    echo ============================================================
) else (
    echo ============================================================
    echo   [HATA] Bir sorun olustu. Lutfen ekrandaki mesaji kontrol edin.
    echo ============================================================
)
echo.
pause
