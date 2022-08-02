@echo off
 
REM Print Ascii Art
echo __          __        _       __          __  _     __  __
echo \ \        / /       ^| ^|      \ \        / / ^| ^|   ^|  \/  ^|
echo  \ \  /\  / /_ _  ___^| ^| ___   \ \  /\  / /__^| ^|__ ^| \  / ^|
echo   \ \/  \/ / _` ^|/ __^| ^|/ / ^| ^| \ \/  \/ / _ \ '_ \^| ^|\/^| ^|
echo    \  /\  / (_^| ^| (__^|   ^<^| ^|_^| ^|\  /\  /  __/ ^|_) ^| ^|  ^| ^|
echo     \/  \/ \__,_^|\___^|_^|\_\\__, ^| \/  \/ \___^|_.__/^|_^|  ^|_^|
echo                             __/ ^|
echo                            ^|___/

echo installing dependencies (this might take up to a few minutes the first time, it will be skipped in any subsequent start.)
npm i

echo starting GUI...
node nodegui-wrapper.js