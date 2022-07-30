# WackyWebM

This is a simple tool to allow you to create WebM files with changing aspect ratios.

## Dependencies
* NodeJS
* ffmpeg 
* ffprobe

## How to run
`node wackywebm.js [mode] <file>`

You can also tweak the script to taste if you want to adjust how your file is generated.

## Mode options

* `Bounce` (Default): The video bounces up and down.
* `Shutter`: The video bounces left to right.
* `Bounce+Shutter`: The simultaneous effects of `Bounce` and `Shutter`, slightly offset from each other
* `Sporadic`: The video glitches and wobbles randomly.
