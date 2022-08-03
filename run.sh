# Print Ascii Art
echo " 
 __          __        _       __          __  _     __  __ 
 \ \        / /       | |      \ \        / / | |   |  \/  |
  \ \  /\  / /_ _  ___| | ___   \ \  /\  / /__| |__ | \  / |
   \ \/  \/ / _\` |/ __| |/ / | | \ \/  \/ / _ \ '_ \| |\/| |
    \  /\  / (_| | (__|   <| |_| |\  /\  /  __/ |_) | |  | |
     \/  \/ \__,_|\___|_|\_\\\\\__, | \/  \/ \___|_.__/|_|  |_|
                             __/ |                          
                            |___/                           
"

# Ask for required inputs
read -p "Mode (audiobounce, audioshutter, bounce, jumpscare, keyframes, rotate, shrink, shutter, sporadic): " mode
read -p "File: " file

# Run node commmand
node wackywebm.js $mode "$file"
