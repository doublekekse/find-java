import { findJava } from './dist/index.mjs';

const javaPath = await findJava(
  { min: 17, optimal: 18 },
  'tmp',
  'java'
);

console.log(javaPath);
