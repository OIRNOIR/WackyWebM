"use strict";

/*
Make WebM files with changing aspect ratios
By OIRNOIR#0032
*/

const fs = require('fs');
const { exec } = require('child_process');

async function execa(command, settings) {
	return new Promise(async (resolve, reject) => {
		exec(command, settings, (error, stdout, stderr) => {
			if (error) reject(error);
			resolve({error, stdout, stderr});
		});
	});
}

async function writeFileAsync(file, data) {
	return new Promise(async (resolve, reject) => {
		fs.writeFile(file, data, (err) => {
			if (err) reject(err);
			resolve(true);
		});
	});
}

const input = `"${process.argv.slice(2).join(" ")}"`;
const delta = 2;

async function main() {
	console.log(`Input file: ${input}\nUsing minimum w/h ${delta}px\nGetting framerate...`);
	const inputFramerateRes = await execa(`ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=r_frame_rate ${input}`);
	const inputFramerate = inputFramerateRes.stdout.replace(/\n/, "");
	const decimalInputFramerate = inputFramerate.includes("/") ? Number(inputFramerate.split("/")[0]) / Number(inputFramerate.split("/")[1]) : Number(inputFramerate);
	console.log(`Got framerate of ${inputFramerate}! Getting width...`);
	const maxWidthRes = await execa(`ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=width ${input}`);
	const maxWidth = Number(maxWidthRes.stdout.replace(/\n/, ""));
	console.log(`Got width of ${maxWidth}! Getting height...`);
	const maxHeightRes = await execa(`ffprobe -v error -select_streams v -of default=noprint_wrappers=1:nokey=1 -show_entries stream=height ${input}`);
	const maxHeight = Number(maxHeightRes.stdout.replace(/\n/, ""));
	console.log(`Got height of ${maxHeight}! Splitting audio to temporary file...`);
	let lines = [];
	await execa(`ffmpeg -y -i ${input} -vn -c:a libvorbis tempAudio.webm`);
	console.log(`Creating temporary directories...`);
	try {
		await execa(`mkdir tempFrames;mkdir tempResizedFrames`);
	} catch {

	}
	console.log(`Splitting file into frames...`);
	await execa(`ffmpeg -y -i ${input} tempFrames/%d.png`);
	process.stdout.write(`Converting frames to webm (File 0/${fs.readdirSync(`${__dirname}/tempFrames/`).filter(f => f.endsWith("png")).length})...`);
	let index = 0;
	for (const file of fs.readdirSync(`${__dirname}/tempFrames/`).filter(f => f.endsWith("png")).sort((a, b) => Number(a.split("/").slice(-1)[0].split(".")[0]) - Number(b.split("/").slice(-1)[0].split(".")[0]))) {
		const width = index == 0 ? maxWidth : (Math.floor(Math.random() * (maxWidth - delta)) + delta);
		const height = index == 0 ? maxHeight : (Math.floor(Math.random() * (maxHeight - delta)) + delta);
		const bouncespersecond = 1.9;
		//const width = maxWidth;
		//const height = index == 0 ? maxHeight : (Math.floor(Math.abs(Math.cos(index / (decimalInputFramerate / bouncespersecond) * Math.PI) * (maxHeight - delta))) + delta);
		await execa(`ffmpeg -y -i ${__dirname}/tempFrames/${file} -c:v vp8 -b:v 1M -crf 10 -vf scale=${width}x${height} -aspect ${width}:${height} -r ${inputFramerate} -f webm ${__dirname}/tempResizedFrames/${file}.webm`);
		lines.push(`file '${__dirname}/tempResizedFrames/${file}.webm'`);
		index++;
		process.stdout.clearLine();
    process.stdout.cursorTo(0);
		process.stdout.write(`Converting frames to webm (File ${index}/${fs.readdirSync(`${__dirname}/tempFrames/`).filter(f => f.endsWith("png")).length})...`);
	}
	process.stdout.write("\n");
	console.log("Writing concat file...");
	await writeFileAsync("./tempConcatList.txt", lines.join("\n"));
	console.log("Combining webm files into a single webm...");
	await execa(`ffmpeg -y -f concat -safe 0 -i tempConcatList.txt -c copy tempVideo.webm`);
	console.log("Creating final webm...");
	await execa(`ffmpeg -y -i tempVideo.webm -i tempAudio.webm -c copy out.webm`);
	console.log("Done!");
		console.log("Removing temporary files...");
		for (const file of fs.readdirSync(`${__dirname}/tempFrames/`)) {
			fs.unlinkSync(`${__dirname}/tempFrames/${file}`);
		}
		fs.rmdirSync(__dirname + "/tempFrames");
		for (const file of fs.readdirSync(`${__dirname}/tempResizedFrames/`)) {
			fs.unlinkSync(`${__dirname}/tempResizedFrames/${file}`);
		}
		fs.rmdirSync(__dirname + "/tempResizedFrames");
		fs.unlinkSync(__dirname + "/tempAudio.webm");
		fs.unlinkSync(__dirname + "/tempVideo.webm");
		fs.unlinkSync(__dirname + "/tempConcatList.txt");
}

void main();