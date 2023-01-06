#!/bin/sh
# Print Ascii Art
echo "
 __          __        _       __          __  _     __  __
 \ \        / /       | |      \ \        / / | |   |  \/  |
  \ \  /\  / /_ _  ___| | ___   \ \  /\  / /__| |__ | \  / |
   \ \/  \/ / _\` |/ __| |/ / | | \ \/  \/ / _ \ '_ \| |\/| |
    \  /\  / (_| | (__|   <| |_| |\  /\  /  __/ |_) | |  | |
     \/  \/ \__,_|\___|_|\_\\\\__, | \/  \/ \___|_.__/|_|  |_|
                             __/ |
                            |___/
"

function checktools
{
	echo "Testing for FFmpeg, FFprobe, Node and npm..."
	alldependencies=1
	if ! command -v ffmpeg &>/dev/null; then echo "FFmpeg not found" && alldependencies=0; fi
	if ! command -v ffprobe &>/dev/null; then echo "FFprobe not found" && alldependencies=0; fi
	if ! command -v node &>/dev/null; then echo "Node not found" && alldependencies=0; fi
	if ! command -v npm &>/dev/null; then echo "npm not found" && alldependencies=0; fi

	if [ "$alldependencies" = "0" ]; then echo "If you believe this to be an error, run \"./run.sh --notoolcheck\"." && read -p "Press any key to exit." -n 1 -r && exit 1; fi
}

if [ "$1" != "--notoolcheck" ]; then checktools && echo "No issues found!"; else echo "Skipping Tool check..."; fi

echo "Installing Dependencies - this might take a while the first time."
if ! npm i >/dev/null 2>npm.log
then
  echo "Error during dependency installation using npm"
  echo "Issue description:"
  cat npm.log
  rm npm.log
  echo "Exiting..."
  exit 1
fi

echo "Enter the language you want to use, or press enter for the default (english)"
read lang

echo "Starting UI"
npm run terminal_ui -- $lang
