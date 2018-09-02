@echo off
echo *** Make a DOS boot disk for game ***
format /v:bootdisk /u a:/s
copy config.6 a:\config.sys
copy autoexec.6 a:\autoexec.bat
copy mouse a:\mouse.com
echo *** Ok
@echo on
