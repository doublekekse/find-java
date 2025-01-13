# `find-java`
`find-java` helps you to locate a compatible version of Java on the system. It searches within commonly used directories, including:
- The Java home directory
- The Minecraft Launcher directory
- The Minecraft UWP Launcher directory

If no compatible version of Java can be found, it will automatically download the required version of Java.

## Installation
```bash
npm install @doublekekse/find-java
```

## Usage
```js
import { findJava } from 'find-java';

const javaPath = await findJava(
  // The required Java version
  { min: 17, optimal: 18 },

  // Path where the required version will temporarily be downloaded and extracted to
  'tmp',

  // Path where Java should be installed to
  'java-dir'
);
```

You can also specify a different Java executable instead of `java`, like `javaw`:

```js
const javaPath = await findJava(
  { min: 17, optimal: 18 },
  'tmp',
  'java-dir',
  'javaw'
);
```

Note that `javaw` is only available on Windows.

Finally, you can specify a callback function to track the download progress:

```js
const javaPath = await findJava(
  { min: 17, optimal: 18 },
  'tmp',
  'java-dir',
  'java',
  (progress) => {
    console.log(`Downloading Java: ${progress * 100}%`);
  }
);
```
