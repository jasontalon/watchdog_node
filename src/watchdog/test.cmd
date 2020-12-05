@echo off
net.exe session 1>NUL 2>NUL || (Echo please run as administator. & Exit /b 1)
