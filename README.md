# WackyWebM

This is a simple tool to allow you to create WebM files with changing aspect ratios.

If you're having trouble installing the dependencies, or need help running the code, [this tutorial](https://www.youtube.com/watch?v=ZjGMjv1Gv94) is super helpful.

## Dependencies

- NodeJS
- ffmpeg
- ffprobe

## How to run

`node wackywebm.js [mode] <file>`

If you're on windows, you can simply double-click `run.bat`, as long as it's in the same folder as `wackywebm.js`.

You can also tweak the script to taste if you want to adjust how your file is generated.

## Mode options

- `Bounce` (Default): The video bounces up and down.
- `Shutter`: The video bounces left to right.
- `Bounce+Shutter`: The simultaneous effects of `Bounce` and `Shutter`, slightly offset from each other.
- `Sporadic`: The video glitches and wobbles randomly.
- `Shrink`: The video shrinks vertically until it's just one pixel thin.
- `Audio-Bounce`: The video's vertical height changes relative to the current audio level verses the highest within the video.
- `Audio-Shutter`: The video's horizontal width changes relative to the current audio level verses the highest within the video.
