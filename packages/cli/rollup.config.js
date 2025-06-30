import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  // Main library build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      sourceMap: false
    })
    ],
    external: [
      'fs',
      'path',
      'os',
      'child_process',
      'commander',
      'chalk',
      'inquirer',
      'fs-extra',
      'ajv',
      'express',
      'ws',
      '@muprotocol/core',
      '@muprotocol/types'
    ]
  },
  // CLI executable build
  {
    input: 'src/cli.ts',
    output: {
      file: 'dist/cli.js',
      format: 'cjs',
      sourcemap: true,
      banner: '#!/usr/bin/env node'
    },
    plugins: [
      nodeResolve({ preferBuiltins: true }),
      commonjs(),
      json(),
      typescript({
        outDir: 'dist'
      })
    ],
    external: [
      'fs',
      'path',
      'os',
      'child_process',
      'commander',
      'chalk',
      'inquirer',
      'fs-extra',
      'ajv',
      'express',
      'ws',
      '@muprotocol/core',
      '@muprotocol/types'
    ]
  }
];