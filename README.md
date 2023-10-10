# Find Java

Find java will locate a compatible version of Java within commonly used directories, including:
- The minecraft launcher folder
- The minecraft uwp launcher folder
- The java home directory

If a suitable version of Java cannot be found, the utility will automatically initiate the download process.

## Installation

`npm i github:doublekekse/find-java`

## Usage

```javascript
import findJava from 'find-java';

const javaPath = await findJava(
  { min: 17, optimal: 18 }, // If neither min or max are specified only the optimal version will be used
  'temp', // Path where the downloaded Java ZIP will temporarily reside
  'java-folder' // Path where the extracted Java will be stored
);

console.log(javaPath); // Example output: "javaw" or "C:\Users\User\AppData\Local\Packages\Microsoft.4297127D64EC6_8wekyb3d8bbwe\LocalCache\Local\runtime\java-runtime-beta\windows-x64\java-runtime-beta\bin\javaw.exe"
```

If you prefer the java executable instead of javaw, you can specify it in the function call:
```javascript
const javaPath = await findJava(
  { min: 17, optimal: 18 },
  'temp',
  'java-folder',
  'java'
);
```

`findJava` also provides a callback to track download progress using a callback

```javascript
const javaPath = await findJava(
  { min: 17, optimal: 18 },
  'temp',
  'java-folder',
  undefined,
  (progress) => {
    console.log(progress * 100);
  }
);
```
