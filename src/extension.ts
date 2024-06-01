export default function extension(): string {
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
