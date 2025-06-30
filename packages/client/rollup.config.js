import typescript from 'rollup-plugin-typescript2';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
      tsconfig: './tsconfig.json',
      check: false,
      useTsconfigDeclarationDir: true
    })
  ],
  external: [
    '@muprotocol/types',
    '@muprotocol/core',
    'eventemitter3'
  ]
};