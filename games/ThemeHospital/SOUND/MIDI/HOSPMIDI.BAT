@echo off
if X%1 == X goto error

if not exist %1.mid goto no_file

:ok
midiform %1.xmi %1.mid
echo %1.xmi 	>  midi.tmp
echo %1     	>> midi.tmp
type midi.txt	>> midi.tmp
copy midi.txt	midi.bak
copy midi.tmp	midi.txt
goto end

:error
echo.
echo Midi File name required
echo.
goto end

:no_file
echo.
echo Midi File %1.mid not found
echo.
goto end

:end


