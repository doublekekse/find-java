import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { downloadJava, ProgressCallback } from './download';

function extension(): string {
	switch (process.platform) {
		case 'win32':
			return '.exe';
		case 'darwin':
		case 'linux':
			return '';
		default:
			throw new Error(`Unsupported platform: ${process.platform}`);
	}
}

export type JavaVersion = {
	/**
	 * The optimal java version. Will be used to download java if no valid installation could be found
	 * If min and max are not set it will only accept java installations with this exact version
	 *
	 * @type {number}
	 */
	optimal: number;
} & (
	| {
			min?: number;
			max?: number;
		}
	| {
			/**
			 * A function to resolve weather a java installation is valid. Use this if the min, max and optimal options are not enough
			 *
			 * @param {string} dir The directory the java executable is in (e.g. "C:\Program Files\Java\jdk-18.0.2.1\bin")
			 * @param {string} file The filename (e.g. "java.exe" or "java")
			 */
			isValid: (dir: string, file: string) => boolean;
		}
);

function getJavaVersion(javaPath: string) {
	if (!javaPath.startsWith('java') && !fs.existsSync(javaPath)) return null;

	try {
		const output = execSync(`${javaPath} -version 2>&1`);
		const javaVersion = output.toString().match(/version "(\d+)/);
		if (javaVersion != null) {
			return parseInt(javaVersion[1], 10);
		}
	} catch (err) {
		// Java is not installed or an error occurred
	}

	return null;
}

function isValidJavaInstallation(javaPath: string, targetVersion: JavaVersion) {
	const file = 'java' + extension();

	if ('isValid' in targetVersion) return targetVersion.isValid(javaPath, file);

	const javaVersion = getJavaVersion(path.join(javaPath, file));

	if (!javaVersion) return false;

	if (targetVersion.min && targetVersion.min > javaVersion) return false;
	if (targetVersion.max && targetVersion.max < javaVersion) return false;

	if (!targetVersion.min && !targetVersion.max) {
		return targetVersion.optimal === javaVersion;
	}

	return true;
}

function tryMinecraftJava(dir: string, javaVersion: JavaVersion) {
	const javaPaths = [
		'runtime\\java-runtime-beta\\windows-x64\\java-runtime-beta\\bin',
		'runtime\\java-runtime-beta\\windows-x86\\java-runtime-beta\\bin',
		'runtime\\java-runtime-alpha\\windows-x64\\java-runtime-alpha\\bin',
		'runtime\\java-runtime-alpha\\windows-x86\\java-runtime-alpha\\bin',
		'runtime\\jre-legacy\\windows-x64\\jre-legacy\\bin',
		'runtime\\jre-legacy\\windows-x86\\jre-legacy\\bin',
		'runtime\\jre-x64\\bin',
		'runtime\\jre-x86\\bin',
		'runtime\\java-runtime-gamma\\windows-x64\\java-runtime-gamma\\bin',
		'runtime\\java-runtime-gamma\\windows-x86\\java-runtime-gamma\\bin',
	];

	for (const javaPath of javaPaths) {
		const fullJavaPath = `${dir}\\${javaPath}`;

		if (fs.existsSync(fullJavaPath)) {
			if (isValidJavaInstallation(fullJavaPath, javaVersion)) {
				return fullJavaPath;
			}
		}
	}

	// None of the above javaPaths were valid
	return false;
}

export async function findJava(
	targetVersion: JavaVersion,
	tmpPath: string,
	downloadPath: string,
	executable = 'java',
	progressCallback?: ProgressCallback
) {
	const javaExecutable = executable + extension();

	// Minecraft launcher
	if (process.platform === 'win32') {
		const launcherPaths = [
			'C:\\Program Files (x86)\\Minecraft Launcher',
			path.join(
				process.env.LOCALAPPDATA!,
				'Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/'
			),
		];

		for (const launcherPath of launcherPaths) {
			const mcJava = tryMinecraftJava(launcherPath, targetVersion);
			if (mcJava) return path.join(mcJava, javaExecutable);
		}
	}

	// Java home
	const javaHome = process.env.JAVA_HOME;

	if (javaHome) {
		const javaHomePath = path.join(javaHome, 'bin');
		const isValid = isValidJavaInstallation(javaHome, targetVersion);
		if (isValid) return path.join(javaHomePath, javaExecutable);
	}

	// Getting thin on the ground, lets check the javaPath.
	const isMainJavaValid = isValidJavaInstallation('', targetVersion);

	if (isMainJavaValid) return javaExecutable;

	const downloadedJavaPath = path.join(downloadPath, 'java-' + targetVersion.optimal, 'bin');

	// Is a downloaded instance available
	const isDownloadedJavaValid = isValidJavaInstallation(downloadedJavaPath, targetVersion);
	if (isDownloadedJavaValid) {
		return path.join(downloadedJavaPath, javaExecutable);
	}

	// Download java
	await downloadJava(targetVersion.optimal, tmpPath, downloadPath, progressCallback);
	return path.join(downloadedJavaPath, javaExecutable);
}
