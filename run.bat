@echo off
 
::: __          __        _       __          __  _     __  __ 
::: \ \        / /       | |      \ \        / / | |   |  \/  |
:::  \ \  /\  / /_ _  ___| | ___   \ \  /\  / /__| |__ | \  / |
:::   \ \/  \/ / _` |/ __| |/ / | | \ \/  \/ / _ \ '_ \| |\/| |
:::    \  /\  / (_| | (__|   <| |_| |\  /\  /  __/ |_) | |  | |
:::     \/  \/ \__,_|\___|_|\_\\__, | \/  \/ \___|_.__/|_|  |_|
:::                             __/ |                          
:::                            |___/                           

REM Print Ascii Art
for /f "delims=: tokens=*" %%A in ('findstr /b ::: "%~f0"') do @echo(%%A

REM Ask for required inputs
set /p "mode=Mode: "
set /p "file=File: "

REM Run node commmand
node wackywebm.js %mode% "%file%"

REM Wait for keyboard input
pause