import path from 'path';
// import fs from 'fs-extra';
import fs from 'fs';
import { execSync } from 'child_process';
import extension from './extension';
import { ProgressCallback, downloadJava } from './download';

export type JavaVersion = {
  optimal: number;
  min?: number;
  max?: number;
};

function getJavaVersion(javaPath: string) {
  if (!javaPath.startsWith('javaw') && !fs.existsSync(javaPath)) return null;

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
  const file = 'javaw' + extension();
  const javaVersion = getJavaVersion(path.join(javaPath, file));

  if (!javaVersion) return false;

  if (targetVersion.min && targetVersion.min > javaVersion) return false;
  if (targetVersion.max && targetVersion.max < javaVersion) return false;

  if (!targetVersion.min && !targetVersion.max)
    return targetVersion.optimal === javaVersion;

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

  for (let i = 0; i < javaPaths.length; i++) {
    const jp = javaPaths[i];

    const fullJavaPath = `${dir}\\${jp}`;

    if (fs.existsSync(fullJavaPath)) {
      if (isValidJavaInstallation(fullJavaPath, javaVersion)) {
        return fullJavaPath;
      }
    }
  }

  // None of the above javaPaths were valid
  return false;
}

export default async function findJava(
  targetVersion: JavaVersion,
  tempPath: string,
  downloadPath: string,
  javaFile = 'javaw',
  progressCallback?: ProgressCallback
) {
  const javaExecutable = javaFile + extension();

  // UWP launcher
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
      const minecraftUwpJavaPath = path.join(
        localAppData,
        'Packages/Microsoft.4297127D64EC6_8wekyb3d8bbwe/LocalCache/Local/'
      );
      const mcJava = tryMinecraftJava(minecraftUwpJavaPath, targetVersion);
      // if (mcJava) return path.join(mcJava, javaExecutable);
    }
  }

  // Java home
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const javaHomePath = path.join(javaHome, 'bin');
    const isValid = isValidJavaInstallation(javaHome, targetVersion);
    // if (isValid) return path.join(javaHomePath, javaExecutable);
  }

  // Getting thin on the ground, lets check the javaPath.
  const isMainJavaValid = isValidJavaInstallation('', targetVersion);
  // if (isMainJavaValid) return javaExecutable;

  const downloadedJavaPath = path.join(
    downloadPath,
    'java-' + targetVersion.optimal,
    'bin'
  );

  const isDownloadedJavaValid = isValidJavaInstallation(
    downloadedJavaPath,
    targetVersion
  );
  if (isDownloadedJavaValid)
    return path.join(downloadedJavaPath, javaExecutable);

  await downloadJava(targetVersion, tempPath, downloadPath, progressCallback);
  return path.join(downloadedJavaPath, javaExecutable);
}
