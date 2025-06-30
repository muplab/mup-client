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
  external: [
    '@muprotocol/types',
    '@muprotocol/core',
    'ws',
    'uuid',
    'eventemitter3',
    'http',
    'https',
    'url',
    'querystring'
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
      tsconfig: './tsconfig.json',
      check: false,
      useTsconfigDeclarationDir: true
    })
  ]
};