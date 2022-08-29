# Frequently Asked Questions

## Questions

#### Can this tool produce videos with a glitchy length?

No, it only changes the video's size.

#### Does this tool let me edit videos (changing colours and such)?

No, it only changes the video's size.

#### How do I use Keyframes?

Check out the [dedicated page](./keyframes.md).

#### Can I make an effect start at a certain point in the video?

Not yet, no. Some of them, you can emulate using keyframes (like Shrink), but others are not as easy to work around - you'll have to edit the mode file (they're in the `modes` directory). For help, ask on the Discord.

## Issues

#### FFmpeg/FFprobe/node/npm could not be found

Install the corresponding tool. If you need help, [Here](./dependencies.md) is a basic guide to doing so for all of them.

#### "upng-js" could not be found

Install the required packages by running `npm install` within the project directory from a terminal.

#### "....replaceAll is not a function"

Update your Node.js - `replaceAll` is a relatively new feature, so at least Node v16.6 is required.

#### "Unexpected Token '?'"

Same as above - null coalescence (the technical name for this syntax) is relatively new to Node, so use at least version v16.6

#### (windows specific) Pop-up box with a title of "Windows Script Host"

You tried to run `wackywebm.js` using windows' built-in interpreter. Run it using node instead (either run one of the wrapper scripts, or `node wackywebm.js <arguments>` from a terminal)

#### When using the Interactive Interface, I get "file does not exist", even though it does

Currently, File names should *not* be quoted, even if they contain special characters. This is especially common among Windows users. For example, it should look like `C:/File Name With Spaces.webm`, NOT `"C:/File Name With Spaces.webm"`
