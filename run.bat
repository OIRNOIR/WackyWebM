@echo off

:: Print Ascii Art (ugly because batch requires escaping of "|" and "<" with `^`, instead of with `\`.)

echo __          __        _       __          __  _     __  __
echo \ \        / /       ^| ^|      \ \        / / ^| ^|   ^|  \/  ^|
echo  \ \  /\  / /_ _  ___^| ^| ___   \ \  /\  / /__^| ^|__ ^| \  / ^|
echo   \ \/  \/ / _` ^|/ __^| ^|/ / ^| ^| \ \/  \/ / _ \ '_ \^| ^|\/^| ^|
echo    \  /\  / (_^| ^| (__^|   ^<^| ^|_^| ^|\  /\  /  __/ ^|_) ^| ^|  ^| ^|
echo     \/  \/ \__,_^|\___^|_^|\_\\__, ^| \/  \/ \___^|_.__/^|_^|  ^|_^|
echo                             __/ ^|
echo                            ^|___/

echo.

:: test for dependencies.
echo Testing for FFmpeg, FFprobe, Node and npm...

where /q ffmpeg || echo FFmpeg could not be found && exit /B
where /q ffprobe || echo FFprobe could not be found && exit /B
where /q node || echo Node could not be found && exit /B
where /q npm || echo npm could not be found && exit /B

echo Installing Dependencies - this might take a while the first time.
call npm i

echo Enter the language you want to use, or press enter for the default (english)
set /p "lang= "

echo Starting UI
npm run terminal_ui -- %lang%
