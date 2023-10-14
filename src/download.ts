import os from 'os';
import fetch from 'node-fetch';
import path from 'path';
import { JavaVersion } from '.';
import fs from 'fs';
import AdmZip from 'adm-zip';

type AdoptiumResponse = {
  binary: {
    architecture: string;
    download_count: number;
    heap_size: string;
    image_type: string;
    package: {
      name: string;
      link: string;
      size: number;
      checksum: string;
      checksum_link: string;
      signature_link?: string;
      download_count: number;
      metadata_link: string;
    };
    installer?: {
      name: string;
      link: string;
      size: number;
      checksum: string;
      checksum_link: string;
      signature_link?: string;
      download_count: number;
      metadata_link: string;
    };
    jvm_impl: string;
    os: string;
    project: string;
    scm_ref: string;
    updated_at: string;
  };
  release_link: string;
  release_name: string;
  vendor: string;
  version: {
    build: number;
    major: number;
    minor: number;
    openjdk_version: string;
    patch: number;
    security: number;
    semver: string;
  };
}[];

function mapPlatformToAdoptiumOS(): string {
  switch (process.platform) {
    case 'linux':
      if (os.release().includes('alpine')) return 'alpine-linux';
      return 'linux';
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'mac';
    case 'sunos':
      return 'solaris';
    case 'aix':
      return 'aix';
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

function getJavaZipFilepath(tempPath: string) {
  const { platform } = process;
  let extension = '';

  switch (platform) {
    case 'win32':
      extension = 'zip';
      break;
    case 'darwin':
      extension = 'dmg';
      break;
    case 'linux':
      extension = 'tar.gz';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  const fileName = `jdk-latest.${extension}`;
  return path.join(tempPath, fileName);
}

export type ProgressCallback = (progress: number) => void;

export async function downloadJava(
  targetVersion: JavaVersion,
  tempPath: string,
  javaPath: string,
  progressCallback?: ProgressCallback
) {
  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

  if (fs.existsSync(javaPath)) fs.rmSync(javaPath, { recursive: true });

  const platform = mapPlatformToAdoptiumOS();
  const architecture = process.arch;
  const imageType = 'jdk';

  const url = `https://api.adoptium.net/v3/assets/latest/${targetVersion.optimal}/hotspot?architecture=${architecture}&image_type=${imageType}&os=${platform}&vendor=eclipse`;

  const response = await fetch(url);
  const data = (await response.json()) as AdoptiumResponse;
  const downloadUrl = data[0].binary.package.link;
  const filePath = getJavaZipFilepath(tempPath);

  const fileStream = fs.createWriteStream(filePath);
  const downloadResponse = await fetch(downloadUrl);

  const name = data[0].release_name;

  await new Promise<void>((resolve, reject) => {
    if (!downloadResponse.body) {
      throw new Error('Download response body is null!');
    }

    const totalSize = parseInt(
      downloadResponse.headers.get('content-length') || '0',
      10
    );
    let downloadedSize = 0;

    downloadResponse.body.on('error', (err: Error) => {
      reject(err);
    });

    fileStream.on('finish', () => {
      resolve();
    });

    downloadResponse.body.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;

      if (progressCallback) progressCallback(downloadedSize / totalSize);
    });

    downloadResponse.body.pipe(fileStream);
  });

  await extractFolderFromZip(filePath, name, javaPath, targetVersion.optimal);
}

async function extractFolderFromZip(
  zipPath: string,
  folderInZip: string,
  target: string,
  javaVersion: number
) {
  const extractLocation = path.resolve(target);

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractLocation, true);
  fs.unlinkSync(zipPath);

  const extractedFolderPath = path.join(extractLocation, folderInZip);

  const newFolderPath = path.join(target, 'java-' + javaVersion);
  fs.renameSync(extractedFolderPath, newFolderPath);
}
