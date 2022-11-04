# Keyframe File

In order to use keyframe mode, you must have a separate file describing your keyframes. Create a text file in the same directory you are running WackyWebM. Fill the
file in as detailed below.

Keyframes also require the `-k` argument in the command line. The complete command (with no other arguments) would look like this:

`node wackywebm.js -k <keyframefile.txt> keyframes <input_file>`

# Keyframe File Format

Every line describes a keyframe, and consists of 4 values. The last value is optional and can be left out. They are all separated by comma characters (`,`)

  - First, the time in the video of the keyframe. This is either of these two options:
    - One integer representing seconds in the video
    - Two integers, separated by any one of the characters `.`, `:` or `-`, where the first still represents seconds, and the second represents frames (so for example, `1.5` does *not* represent 1.5 seconds, but represents the fifth frame after the first second of the video)
  - Next, the width of the video, followed by its height - both of these support some very basic mathematical expressions and some placeholders (for example `last/2` means to scale the video to half its size at the last keyframe)
  - Finally, the interpolation with which to advance towards the next keyframe - currently, the following are supported:
    - `linear`: linearly interpolates towards the next keyframe.
    - `instant`: instantly jumps to the *next* keyframe at its time - unlike the name might imply, it does *not* create a jump from the last keyframe to the current one.

The interpolation mode is optional and if not given, `linear` is used as a default.

If it isn't overwritten, an implicit keyframe at 0 frames into the video is added with linear interpolation and the video's original size.

To use this mode, add `-k` with the path to your file (do *not* supply the keyframe data itself to the `-k` flag).

Also, any lines that are entirely whitespace or start in a `#` character are ignored.

# Example

    # for easier explanations, lets assume the original video is 1000x1000 pixels.

    # 0.1 means 0 seconds and 1 frame. this "jumps" the video size to 300x300 at the very first frame, 
    # and then slowly interpolates towards the next frame (because "linear" is implied)
    0.1, 300, 300

    # after 1.5 seconds, the video would be approximately 450 pixels in width and 225 in height,
    # since the scaling is linear and that time is about halfway between the two keyframes, so
    # it's expected that the size is roughly halfway between 300x300 and 600x150
    3, last*2, last/2

    # slowly scale the video up to 1000x1000 (the original resolution) over 7 seconds, then keep it there until the next keyframe
    # (in this case, for 5 seconds) where it "jumps" to 100x100
    10, original, original, instant
    
    15, 100, 100
    # since there are no further keyframes after this one, the video stays at the size of
    # 100x100 pixels from 15 seconds until the end.
