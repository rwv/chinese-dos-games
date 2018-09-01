@echo off
if exist title\title.exe goto OK
etin
goto END
:OK
cd title
title.exe
cd ..
etin
:END
@echo off
