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

echo "Testing for FFmpeg, FFprobe, Node and npm..."
if ! command -v ffmpeg &>/dev/null; then echo "FFmpeg not found, exiting..." && exit 1; fi
if ! command -v ffprobe &>/dev/null; then echo "FFprobe not found, exiting..." && exit 1; fi
if ! command -v node &>/dev/null; then echo "Node not found, exiting..." && exit 1; fi
if ! command -v npm &>/dev/null; then echo "npm not found, exiting..." && exit 1; fi
echo "No issues found!"

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
