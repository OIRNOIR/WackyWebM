# WackyWebM

WackyWebM is a tool that allows you to create WebM video files with changing aspect ratios.

If you're having issues, want to share your custom modes, or learn from the community join the Discord at the bottom of this readme.

## Dependencies

- NodeJS
- FFmpeg
- FFprobe

### NodeJS

To begin installation, you must install NodeJS first. You can find the NodeJS download [here.](https://nodejs.org/en/)

After that, if prompted to restart, it is recommended to do so.

### FFmpeg

After installing NodeJS, you need to download FFmpeg next. To install FFmpeg you need to go to [this](https://ffmpeg.org) link and select the green Download button.
Unzip the folder, move it to your downloads and then rename it to "ffmpeg".

Right click the unzipped folder, select "Cut", direct to This PC, enter your C: drive and paste the ffmpeg folder in there.

After moving the ffmpeg folder into your C: drive, open Command Prompt with administrator and run this: setx /m PATH "C:\ffmpeg\bin;%PATH%" (If, for some reason, you are unable to run Command Prompt with administrator permissions, you can hit the windows key, then type "edit environment variables for your account" and hit enter, then you need to click "Path", then click "Edit," then you click "New" and paste in "C:\ffmpeg\bin" and then make sure to click "Ok" in both windows).

Now, type in "ffmpeg" to the command prompt. If you get an error, you need to log out and log back in, run ffmpeg inside of the command prompt window once more, and if you do not get an error you're all set. If you still get an error, you can try restarting your computer, and typing "ffmpeg" into the command prompt again. If it still doesn't work, you can get help in #support in [this](https://discord.gg/TmyJfq49AP) discord server.

## How to Run

Once you've downloaded the WackyWebM folder by going to the GitHub repository and selecting the green "Code" button, then clicking "Download ZIP"

Once the ZIP is fully installed, you need to extract the folder inside. After doing this, you are set.

Use `node wackywebm.js [mode] <file>` to use WackyWebM without running the run.bat.

If you're on windows, you can simply double-click run.bat, as long as it's in the same folder as wackywebm.js.

If you're on MacOS or Linux, you can run run.sh. You may have to give it permission to execute with chmod +x run.sh.

You can also tweak the script to taste if you want to adjust how your file is generated.

You can also change the bitrate of the output file by tweaking -b (Default is 1M, which means 1 MB/s. If the file is too large, consider lowering this value.)

## Modes

`Bounce` (Default): The video bounces up and down.

`Shutter`: The video bounces left to right.

`Sporadic`: The video glitches and wobbles randomly.

`Shrink`: The video shrinks vertically until it's just one pixel thin.

`AudioBounce`: The video's vertical height changes relative to the current audio level verses the highest within the video.

`AudioShutter`: The video's horizontal width changes relative to the current audio level verses the highest within the video.

`Jumpscare`: The video shrinks down small, then gets big at the specified frame.

`Keyframes`: The video's height and width change based on a number of keyframes outlined in the file given as an argument. The format is as follows:
Every line consists of 3 or 4 comma-seperated values:
 - first, the time in the video of the keyframe; either one integer representing seconds, or two, seperated by any one of the characters ., : or -, where the first still represents seconds, and the second represents frames.
 - next, the width, then the height at that keyframe (in pixels)
 - finally, the interpolation with which to advance towards the next keyframe (currently, only `linear` is supported.) If this is not given (and the line only has 3 fields), linear is assumed by default.  

Lines that start either in a `#` character, or are entirely empty, are ignored and may be used as comments.

If it isn't overwritten, an implicit keyframe at 0 frames into the video is added with linear interpolation and the video's original size.  
To use this mode, add -k with the path to your csv file.


Additionally, any 2 modes can be combined using a + symbol, like Bounce+Shutter. If one only specifies width, and one only specifies height, then those respective values are used. If there is a conflict, the value from the latter of the 2 modes is used (so Shrink+Bounce would result in the same effect as just Bounce)

## Support

If you encounter bugs, issues, or have recommendations, feel free to join the Discord [here.](https://discord.gg/TmyJfq49AP)[![Discord Invite Widget](https://invidget.switchblade.xyz/EdrqJ6AMKF)](https://discord.gg/EdrqJ6AMKF)
