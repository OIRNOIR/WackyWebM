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

if "%1"=="--notoolcheck" echo Skipping FFmpeg, FFprobe, Node and npm checks && goto npmi

:: test for dependencies.
echo Testing for FFmpeg, FFprobe, Node and npm...

set allprogramsfound=1
where /q ffmpeg || echo FFmpeg could not be found && set allprogramsfound=0
where /q ffprobe || echo FFprobe could not be found && set allprogramsfound=0
where /q node || echo Node could not be found && set allprogramsfound=0
where /q npm || echo npm could not be found && set allprogramsfound=0
if "%allprogramsfound%"=="0" echo If you believe this to be an error, run "run.bat --notoolcheck". && pause && exit /B

:npmi
echo Installing Dependencies - this might take a while the first time.
call npm i >NUL 2>npm.log || (
  echo Issue installing dependencies using npm.
  echo Error:
  type npm.log
  del npm.log
  echo Exiting...
  exit /b
)

echo Enter the language you want to use, or press enter for the default (english)
set /p "lang= "

echo Starting UI
npm run terminal_ui -- %lang%
