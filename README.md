# WackyWebM

WackyWebM is a tool that allows you to create WebM video files with changing aspect ratios.

If you're having issues, want to share your custom modes, or learn from the community join the Discord at the bottom of this readme.

## Dependencies

- [NodeJS](https://nodejs.org/en/download/)
- [FFmpeg](https://ffmpeg.org/download.html)
- FFprobe

## NodeJS

To begin installation, you must install NodeJS first. You can find the NodeJS download [here.](https://nodejs.org/en/)

Select your OS, and use the installer. After finished installing, click the `finish` button.

![image](https://user-images.githubusercontent.com/69131802/182696287-ae753806-0946-4742-9f73-2cb4d1ee78f2.png)

## FFmpeg

After installing NodeJS, you need to download FFmpeg next. To install FFmpeg you need to go to [this](https://ffmpeg.org) link and select the green Download button.

![image](https://user-images.githubusercontent.com/69131802/182697226-0a60be60-8a6d-433b-bc91-2627266f6058.png)

### Windows

To download FFmpeg for Windows, navigate to the Windows logo and select `Windows builds by BtbN` after that, it is recommended to select `ffmpeg-master-latest-win64-gpl-shared.zip`

Once downloaded, unzip the file and move it to somewhere safe.

Select that folder, then rename it to `ffmpeg`

![image](https://user-images.githubusercontent.com/69131802/182937764-c2a842b4-f96e-4b09-b9f4-ac8896b2d38e.png)

Copy the unzipped folder, direct to This PC, enter your C: drive and paste the `ffmpeg` folder in there.

![image](https://user-images.githubusercontent.com/69131802/182937173-231ae1dd-19b2-4551-9f9f-228cc353b0f8.png)

After moving the ffmpeg folder into your C: drive, open Command Prompt with administrator and run this: setx /m PATH "C:\ffmpeg\bin;%PATH%" (If, for some reason, you are unable to run Command Prompt with administrator permissions, you can hit the windows key, then type "edit environment variables for your account" and hit enter, then you need to click "Path", then click "Edit," then you click "New" and paste in "C:\ffmpeg\bin" and then make sure to click "Ok" in both windows).

Now, type in "ffmpeg" to the command prompt. If you get an error, you need to log out and log back in, run ffmpeg inside of the command prompt window once more, and if you do not get an error you're all set. If you still get an error, you can try restarting your computer, and typing "ffmpeg" into the command prompt again. If it still doesn't work, you can get help in #support in [this](https://discord.gg/TmyJfq49AP) discord server.

### MacOS

For MacOS users, refer to [this](https://bbc.github.io/bbcat-orchestration-docs/installation-mac-manual/) tutorial for FFmpeg installation.

### Linux

For Linux users, refer to [this](https://www.tecmint.com/install-ffmpeg-in-linux/) tutorial for FFmpeg installation.

## How to Run

After you have finished installing the dependencies, download the WackyWebM folder by clicking the `Code` button in the top right of this page, followed by clicking `Download ZIP`

![image](https://user-images.githubusercontent.com/69131802/182936318-d3c542bc-99a6-4f01-91e0-944c4e9bc0b0.png)

Once the ZIP is fully installed, you need to extract the folder inside. After doing this, you are set.

On Windows, use the `run.bat` file to start WackyWebM.

On MacOS and Linux, use `chmod +x run.sh` then `sh run.sh` file to start WackyWebM

If you're on windows, you can simply double-click run.bat, as long as it's in the same folder as wackywebm.js.

You can also tweak the script to taste if you want to adjust how your file is generated.

You can also change the bitrate of the output file by tweaking -b (Default is 1M, which means 1 MB/s. If the file is too large, consider lowering this value.)

## Modes

- `Bounce` (Default): The video bounces up and down.
- `Shutter`: The video bounces left to right.
- `Sporadic`: The video glitches and wobbles randomly.
- `Shrink`: The video shrinks vertically until it's just one pixel thin.
- `AudioBounce`: The video's vertical height changes relative to the current audio level verses the highest within the video.
- `AudioShutter`: The video's horizontal width changes relative to the current audio level verses the highest within the video.
- `Keyframes`: The video's height and width change based on a number of keyframes outlined in the file given as an argument. The format is as follows:
  - Every line consists of 4 (or 3) comma-seperated values:
    - first, the time in the video of the keyframe; either one integer representing seconds, or two, seperated by any one of the characters `.`, `:` or `-`, where the first still represents seconds, and the second represents frames.
    - next, the width, then the height at that keyframe (in pixels)
    - finally, the interpolation with which to advance towards the next keyframe - currently, the following are supported:
      - `linear`: linearly interpolates towards the next keyframe. if the line only contains 3 values, this mode is implied, so it is not required to be written out every time.
      - `instant`: instantly sets the size to the given values
  - If it isn't overwritten, an implicit keyframe at 0 frames into the video is added with linear interpolation and the video's original size.
  - To use this mode, add `-k` with the path to your csv file.

Additionally, any 2 modes can be combined using a + symbol, like Bounce+Shutter. If one only specifies width, and one only specifies height, then those respective values are used. If there is a conflict, the value from the latter of the 2 modes is used (so Shrink+Bounce would result in the same effect as just Bounce)

## Support

If you encounter bugs, issues, or have recommendations, feel free to join the Discord [here.](https://discord.gg/TmyJfq49AP)[![Discord Invite Widget](https://invidget.switchblade.xyz/EdrqJ6AMKF)](https://discord.gg/EdrqJ6AMKF)
