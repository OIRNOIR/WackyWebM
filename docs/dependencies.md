
# Node.js

To begin installation, you must first install Node.js. You can find their website at [nodejs.org](https://nodejs.org/en/download)

There are mainly 2 versions of node.js that are being maintained at any given time: "LTS" and "Current". As of writing this, "Current" is version `v16.17.0`, which is enough for WackyWebM, so it does not matter which one you chose here. Simply select your Operating System and download one of the packages.

After downloading it, simply run the installer (in case you downloaded an archive, unpack it first) and follow the instructions on screen.

Importantly, when asked what to install, chose `Node.js runtime`, `npm package manager` and `Add to PATH`.

Depending on your Operating System, you might have to log out and back in, or even restart your computer after installation for node to be accessible. To test if this is required, open a new terminal and type `node --version` and `npm --version`. If both of them show a version number, you have successfully installed them and do not need to do anything else.

Additionally, after installing node and npm themselves, you should run `npm i` in the project directory (the one where wackywebm.js is) to install some project-specific dependency libraries. The wrapper scripts, run.bat and run.sh, do this automatically for you, so it is only required if you plan to use the command-line interface.

# FFmpeg

To install FFmpeg, navigate to [ffmpeg.org](https://ffmpeg.org/download.html) and, unless you know what you're doing, download one of the pre-built packages, located to the bottom left of the two large green buttons on the download page.

## Linux

For most of the popular Linux distributions, packages are listed on the page (after hovering over Tux). Those can simply be installed using your system's package manager.

If your distribution is not listed in that section, use the static builds (at the bottom of the list). There are installation instructions for them [here](https://www.johnvansickle.com/ffmpeg/faq/)

## Windows

To download FFmpeg for Windows, hover over the Windows logo on the download page and select either of the providers of builds from the list.

As of writing this, the options listed are `Windows builds from gyan.dev`, which only has two options (`ffmpeg-git-essentials.7z` and `ffmpeg-git-full.7z`), of which either should suffice for wackywebm, and `Windows builds by BtbN`, which links to a page with a lot of archives - for novices, the build `ffmpeg-master-latest-win64-gpl-shared.zip` is recommended, since it contains all the necessary utilities and is built from the stable branch of FFmpeg.

Once downloaded, extract the archive to some easily-memorable path (typically `C:\ffmpeg`, though it can be anything)

After extracting the archive, set the environment PATH variable to include FFmpeg's bin folder:

Open `cmd` (the syntax is different for powershell, so use cmd if you want to follow along with this guide) with permissions to write to system variables and execute the command `setx /m PATH "<ffmpeg path>;%PATH%"`, where `<ffmpeg path>` is just the path of the `bin` folder within the extracted archive. For example, for the "typical" ffmpeg path of `C:\ffmpeg`, the command would be `setx /m PATH "C:\ffmpeg\bin;%PATH%"`.

To check if everything went right, open a new terminal (not necessarily with administrator permissions) and run `ffmpeg`. If this displays version information, you are done. If it instead shows an error about ffmpeg not being recognized as a command, something went wrong.

## MacOS

For MacOS users, refer to [this](https://bbc.github.io/bbcat-orchestration-docs/installation-mac-manual/) tutorial for FFmpeg installation.
