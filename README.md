# WackyWebM

## Features

- Good community

## Video Guide

Coming Soon

## prerequisite

Dependencies

 * [NodeJS](https://nodejs.org/en/)
 * [FFmpeg](https://ffmpeg.org)

1. Install [NodeJS](https://nodejs.org/en/) and download [FFmpeg](https://github.com/BtbN/FFmpeg-Builds/releases) (ffmpeg-master-latest-win64-gpl-shared) If you dont have them both Already.
2. Extract the folder thats inside to a location of your choice and rename it to `FFmpeg`.
    - Reccomend saving it directly to your C: drive.
    ![FFmpeg saved](https://raw.githubusercontent.com/MidnightAnnie/WebM-Maker-Thing-Idk/main/Instructions/Images/explorer_85T5BOyghh.png)
3. Open CMD (Windows 11 CMD is Windows Terminal) and type/paste `setx /m PATH "C:\ffmpeg\bin;%PATH%` and hit Enter.
    - If you extracted FFmpeg to a different location make sure you change `C:\ffmpeg\bin` to the location you saved the folder.
    ![FFmpeg set as path](https://raw.githubusercontent.com/MidnightAnnie/WebM-Maker-Thing-Idk/main/Instructions/Images/WindowsTerminal_xeFpTJSupI.png)
4. We can test both FFmpeg and nodejs now by typing in the same cmd terminal `node --version & ffmpeg -version` You will get something like this.
    ![Testing_FFmpeg_Nodejs](https://raw.githubusercontent.com/MidnightAnnie/WebM-Maker-Thing-Idk/main/Instructions/Images/WindowsTerminal_1giFm8eCyo.png)
	
## Text Guide

1. Once you've [downloaded](https://github.com/OIRNOIR/WebM-Maker-Thing-Idk/archive/refs/heads/main.zip) the WackyWebM Files extract them to a place of your choice.
    
2. Open cmd in the folder and use `node wackywebm.js [mode] <file>` 
    ![Command](https://raw.githubusercontent.com/MidnightAnnie/WebM-Maker-Thing-Idk/main/Instructions/Images/WindowsTerminal_BZIkkLMuJI.png)
3. If you're on windows, you can simply double-click run.bat
    - If you're on MacOS or Linux, you can run run.sh. You may have to give it permission to execute with chmod +x run.sh..
4. You can also change the bitrate of the output file by tweaking -b.
    - Default is 1M, which means 1 MB/s. If the file is too large, consider lowering this value.


## FAQ

- 
