@echo off
echo *** Make a DOS boot disk for game ***
format /v:bootdisk /u a:/s
copy config.7 a:\config.sys
copy autoexec.7 a:\autoexec.bat
copy mouse a:\mouse.com
echo *** Ok
@echo on
