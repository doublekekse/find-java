import fs from 'fs';

/**
 * Ensures that a directory exists, creates it if it doesn't
 */
export function ensureDirectoryExists(directoryPath: string) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

/**
 * Removes the directory and its contents if it exists
 */
export function cleanDirectory(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    fs.rmSync(directoryPath, { recursive: true });
  }
}
