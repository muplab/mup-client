import * as fs from 'fs-extra';
import * as path from 'path';
import { formatDuration, formatFileSize } from './index';

export interface BuildOptions {
  outputDir: string;
  configFile?: string;
  minify?: boolean;
  sourcemap?: boolean;
  verbose?: boolean;
}

export interface BuildResult {
  success: boolean;
  files?: string[];
  totalSize?: string;
  buildTime?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Build MUP project
 */
export async function buildProject(options: BuildOptions): Promise<BuildResult> {
  const startTime = Date.now();
  const result: BuildResult = {
    success: false,
    files: [],
    errors: [],
    warnings: []
  };

  try {
    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      result.errors!.push('package.json not found in current directory');
      return result;
    }

    // Read package.json
    const packageJson = await fs.readJson(packageJsonPath);
    
    // Check if it's a MUP project
    const isMupProject = 
      packageJson.dependencies?.['@muprotocol/client'] ||
      packageJson.dependencies?.['@muprotocol/server'] ||
      packageJson.devDependencies?.['@muprotocol/client'] ||
      packageJson.devDependencies?.['@muprotocol/server'];

    if (!isMupProject) {
      result.warnings!.push('This does not appear to be a MUP project');
    }

    // Look for source files
    const srcDir = path.join(process.cwd(), 'src');
    if (!(await fs.pathExists(srcDir))) {
      result.errors!.push('src directory not found');
      return result;
    }

    // Copy source files to output directory
    await fs.copy(srcDir, options.outputDir);
    
    // Get list of built files
    const files = await getFilesRecursively(options.outputDir);
    result.files = files.map(file => path.relative(options.outputDir, file));

    // Calculate total size
    let totalSize = 0;
    for (const file of files) {
      const stats = await fs.stat(file);
      totalSize += stats.size;
    }
    result.totalSize = formatFileSize(totalSize);

    // Process files based on options
    if (options.minify) {
      await minifyFiles(files, options.verbose);
    }

    if (options.sourcemap) {
      await generateSourceMaps(files, options.verbose);
    }

    // Create build manifest
    const manifest = {
      buildTime: new Date().toISOString(),
      files: result.files,
      totalSize: result.totalSize,
      options: {
        minify: options.minify,
        sourcemap: options.sourcemap
      }
    };

    await fs.writeJson(
      path.join(options.outputDir, 'build-manifest.json'),
      manifest,
      { spaces: 2 }
    );

    result.success = true;
    result.buildTime = formatDuration(Date.now() - startTime);

  } catch (error) {
    result.errors!.push(`Build failed: ${error}`);
  }

  return result;
}

/**
 * Get all files recursively from a directory
 */
async function getFilesRecursively(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await getFilesRecursively(fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Minify files (placeholder implementation)
 */
async function minifyFiles(files: string[], verbose?: boolean): Promise<void> {
  if (verbose) {
    console.log('Minifying files...');
  }
  
  // TODO: Implement actual minification
  // This would typically involve:
  // - Minifying JavaScript files
  // - Minifying CSS files
  // - Optimizing JSON files
  // - Compressing images
}

/**
 * Generate source maps (placeholder implementation)
 */
async function generateSourceMaps(files: string[], verbose?: boolean): Promise<void> {
  if (verbose) {
    console.log('Generating source maps...');
  }
  
  // TODO: Implement source map generation
  // This would typically involve:
  // - Creating .map files for JavaScript
  // - Creating .map files for CSS
  // - Updating file references
}