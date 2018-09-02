@echo off
if exist pclogo.exe pclogo
if "%0"=="inst" goto newstart
if "%0"=="inst" goto newstart
cls
Echo ÚÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¿
echo ³ All Heros of Kam Gung Storys Install Program ³
echo ³      Program need 130M Hard Disk space.      ³
echo ³         Press Ctrl+break to cancel           ³
Echo ÀÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÙ
mdir C:\Legend  /m     /f130000000
if errorlevel 8 goto driveH
if errorlevel 7 goto driveG
if errorlevel 6 goto driveF
if errorlevel 5 goto driveE
if errorlevel 4 goto driveD
if errorlevel 3 goto driveC
if errorlevel 2 goto driveB
if errorlevel 1 goto driveA
goto help

:driveA
copy a:install.bat inst.bat
inst A: INS

:driveB
copy b:install.bat inst.bat
inst B: INS

:driveC
copy c:install.bat inst.bat
inst C: INS

:driveD
copy d:install.bat inst.bat
inst D: INS

:driveE
copy e:install.bat inst.bat
inst E: INS

:driveF
copy f:install.bat inst.bat
inst F: INS

:driveG
copy g:install.bat inst.bat
inst G: INS

:driveH
copy h:install.bat inst.bat
inst H: INS

:stay at target path
:NewStart
cls
echo Loading....

%1Legendx.exe

if exist setsound.exe goto sets
if exist setup.bat goto setbat
if exist setup.exe goto setexe
if exist setup.com goto setcom
if exist sound.exe goto soundexe
if exist sound.bat goto soundbat
if exist sound.com goto soundcom
if exist install.exe goto instexe
if exist install.com goto instcom
goto done

:sets
setsound.exe
goto done

:setbat
call setup.bat
goto done

:setexe
setup.exe
goto done

:setcom
setup.com
goto done

:setcom
setup.com
goto done

:soundexe
sound.exe
goto done

:soundcom
sound.com
goto done

:soundbat
call sound.bat
goto done

:instexe
install.exe
goto done

:instcom
install.com
goto done


:done
cls
Echo Install Complete !!!
IF EXIST PLAY.BAT echo Type Play to start
goto end

:help
echo 
echo     Target path error, or not enough disk space !!!
echo ÿ
:end
if exist inst.bat del inst.bat
