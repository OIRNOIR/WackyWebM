# WackyWebM

This is a simple tool to allow you to create WebM files with changing aspect ratios.

`wackywebm.js` - Generates very glitchy random videos

`bouncywebm.js` - Generates bouncing videos, change the rate of bouncing by setting the variable `bouncespersecond` (lower = slower, can be decimals)

## Dependencies
* NodeJS
* ffmpeg 
* ffprobe

## How to run
`node wackywebm.js <file>` OR `node bouncywebm.js <file>`, depending on the file you're using

You can also tweak the script to taste if you want to adjust how your file is generated.
