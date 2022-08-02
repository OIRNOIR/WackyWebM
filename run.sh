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

echo "installing dependencies (this might take up to a few minutes the first time, it will be skipped in any subsequent start.)"
npm i

echo starting GUI...
node nodegui-wrapper.js
