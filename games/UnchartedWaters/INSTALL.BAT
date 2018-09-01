@echo off
if "%1"=="" goto help
if "%1"=="a:" goto help
if "%1"=="A:" goto help
if "%1"=="b:" goto help
if "%1"=="B:" goto help
cls
Echo  -------------------------------------------------
echo              OGRP I  Install Program
echo         Program need 2M Hard Disk space.
echo             Directory Name: %1\OGRP
echo               Hit a key to continue...
Echo  ------------------------------------------------
pause >nul
md %1\OGRP
copy install.com %1\OGRP >nul
if not exist %1\OGRP\install.com goto help

cls
echo Loading....
copy *.* %1\OGRP

:disk2
echo Insert Disk 2 in Default Drive
pause
if not exist OPEN.EXE goto disk2
copy *.* %1\OGRP

cls
Echo Install Complete !!!
echo Type KOEI to start game
goto end

:help
echo 
echo     Install c: or d: etc
echo ÿ
:end
