To begin installation, you must install NodeJS first. You can find the NodeJS download [here.](https://nodejs.org/en/)

After that, if prompted to restart, it is recommended to do so.

# FFmpeg

After installing NodeJS, you need to download FFmpeg next. To install FFmpeg you need to go to [this](https://ffmpeg.org) link and select the green Download button.
Unzip the folder, move it to your downloads and then rename it to "ffmpeg".

Right click the unzipped folder, select "Cut", direct to This PC, enter your C: drive and paste the ffmpeg folder in there.

After moving the ffmpeg folder into your C: drive, open Command Prompt with administrator and run this: setx /m PATH "C:\ffmpeg\bin;%PATH%"

After you get a success message, type in "ffmpeg" to the command prompt. If you get an error, you need to restart your computer, once finished restarting, run ffmpeg inside of the command prompt window once more, and if you do not get an error you're all set.

# WackyWebM

Once you've downloaded the WackyWebM folder by going to the GitHub repository and selecting the green "Code" button, then clicking "Download ZIP"

Once the ZIP is fully installed, you need to extract the folder inside. After doing this, you are set. 

# Support

If you encounter bugs, issues, or have recommendations, feel free to join the Discord [here.](https://discord.gg/TmyJfq49AP)
