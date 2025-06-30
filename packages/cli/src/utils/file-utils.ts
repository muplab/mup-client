import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Copy template files to destination or write content to file
 */
export async function copyTemplate(
  destPath: string,
  content: string,
  variables: any = {}
): Promise<void> {
  // Process variables in content
  let processedContent = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, String(value));
  }
  
  // Ensure directory exists
  await fs.ensureDir(path.dirname(destPath));
  
  // Write content to file
  await fs.writeFile(destPath, processedContent, 'utf-8');
}

/**
 * Recursively copy files and process templates
 */
async function copyRecursive(
  src: string,
  dest: string,
  variables: Record<string, string>
): Promise<void> {
  const stats = await fs.stat(src);

  if (stats.isDirectory()) {
    await fs.ensureDir(dest);
    const items = await fs.readdir(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      await copyRecursive(srcPath, destPath, variables);
    }
  } else {
    // Process template files
    if (src.endsWith('.template')) {
      const content = await fs.readFile(src, 'utf-8');
      const processedContent = processTemplate(content, variables);
      const destFile = dest.replace('.template', '');
      await fs.writeFile(destFile, processedContent);
    } else {
      await fs.copy(src, dest);
    }
  }
}

/**
 * Process template content with variables
 */
function processTemplate(content: string, variables: Record<string, string>): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Find files matching a pattern
 */
export async function findFiles(
  dir: string,
  pattern: RegExp,
  recursive = true
): Promise<string[]> {
  const files: string[] = [];

  if (!(await fs.pathExists(dir))) {
    return files;
  }

  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory() && recursive) {
      const subFiles = await findFiles(fullPath, pattern, recursive);
      files.push(...subFiles);
    } else if (stats.isFile() && pattern.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if directory is empty
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const items = await fs.readdir(dirPath);
    return items.length === 0;
  } catch (error) {
    return true;
  }
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * Read JSON file safely
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T | null> {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * Write JSON file safely
 */
export async function writeJsonFile(
  filePath: string,
  data: any,
  options: { spaces?: number } = {}
): Promise<void> {
  await fs.writeJson(filePath, data, { spaces: options.spaces || 2 });
}

/**
 * Get relative path from current working directory
 */
export function getRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

/**
 * Normalize path separators
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}