import { exec } from 'node:child_process';
import path from 'node:path';
import util from 'node:util';
import os from 'node:os';

const execAsync = util.promisify(exec);

class ExtractionError extends Error {
	constructor(
		public stdout: string,
		public stderr: string
	) {
		super(stderr);
	}
}

export async function extractFile(filePath: string, outputDir: string) {
	const ext = path.extname(filePath).toLowerCase();
	const platform = os.platform();

	if (platform === 'win32' && ext === '.zip') {
		await extractZip(filePath, outputDir);
	} else if (platform === 'linux' && ext === '.gz') {
		await extractTarGz(filePath, outputDir);
	} else if (platform === 'darwin' && ext === '.gz') {
		await extractTarGz(filePath, outputDir);
	} else {
		throw new Error('Unsupported file type or platform');
	}

	// TODO: del tmp
}

export async function extractZip(filePath: string, outputDir: string) {
	const { stdout, stderr } = await execAsync(
		`powershell.exe Expand-Archive -Path "${filePath}" -DestinationPath "${outputDir}" -Force`
	);

	if (stderr) {
		throw new ExtractionError(stdout, stderr);
	}
}

export async function extractTarGz(filePath: string, outputDir: string) {
	const { stdout, stderr } = await execAsync(`tar -xzf "${filePath}" -C "${outputDir}"`);

	if (stderr) {
		throw new ExtractionError(stdout, stderr);
	}
}
