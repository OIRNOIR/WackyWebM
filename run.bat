@echo off
 
::: __          __        _       __          __  _     __  __ 
::: \ \        / /       | |      \ \        / / | |   |  \/  |
:::  \ \  /\  / /_ _  ___| | ___   \ \  /\  / /__| |__ | \  / |
:::   \ \/  \/ / _` |/ __| |/ / | | \ \/  \/ / _ \ '_ \| |\/| |
:::    \  /\  / (_| | (__|   <| |_| |\  /\  /  __/ |_) | |  | |
:::     \/  \/ \__,_|\___|_|\_\\__, | \/  \/ \___|_.__/|_|  |_|
:::                             __/ |                          
:::                            |___/                           

for /f "delims=: tokens=*" %%A in ('findstr /b ::: "%~f0"') do @echo(%%A


set /p "mode=Mode (Bounce, Shutter, Bounce+Shutter, Sporadic): "
set /p "file=File: "
node wackywebm.js %mode% %file%
pause