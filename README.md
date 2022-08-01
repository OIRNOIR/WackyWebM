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
- `Keyframes <path to csv file>`: The video's height and width change based on a number of keyframes outlined in the file given as an argument. The format is as follows:
  - Every line consists of 4 comma-seperated values:
    - first, the time in the video of the keyframe; either one integer representing seconds, or two, seperated by any one of the characters `.`, `:` or `-`, where the first still represents seconds, and the second represents frames.
    - next, the width, then the height at that keyframe (in pixels)
    - finally, the interpolation with which to advance towards the next keyframe (currently, only `linear` is supported.)
  - If it isn't overwritten, an implicit keyframe at 0 frames into the video is added with linear interpolation and the video's original size.
