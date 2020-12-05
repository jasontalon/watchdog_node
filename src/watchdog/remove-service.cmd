@echo off
net.exe session 1>NUL 2>NUL || (Echo please run as administator. & pause)

sc delete Watchdog

pause