@echo off
if "%2"=="INS" goto newstart
if "%2"=="ins" goto newstart
:start
cls
Echo ÚÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄ¿
echo ³           APS Install Program            ³
echo ³     Program need 11M Hard Disk space.    ³
echo ³         Program by : KINNY WONG!         ³
Echo ÀÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÄÙ
mdir c:\APS /m /f11000000
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
     
:NewStart
cls
echo Loading....
%1DEARJ x -vv -jyc %1APS.001

cls
Echo Install Complete !!
echo Type MOUSE to Run Mouse Drive.
echo Type INSTALL to Setup Game Config.
echo Type APS to start.
goto end

:help
echo 
echo     Target path error, or not enough disk space !!!
echo ÿ

:end
