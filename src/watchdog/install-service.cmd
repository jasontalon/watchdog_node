@echo off
net.exe session 1>NUL 2>NUL || (Echo please run as administator. & pause)

sc create Watchdog "Detection service for Watchdog" binpath=%CD%\Watchdog.exe start delayed-auto

pause