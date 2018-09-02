
@echo off
mouse
if not exist emperor.swp goto run
del emperor.swp

:run
call vmm.bat

sking.exe

