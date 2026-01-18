import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import Logger from '../utils/Logger.js';

/**
 * Test file loader with circular dependency detection
 */
class TestFileLoader {
  constructor() {
    this.loadingStack = new Set(); // Track currently loading files to detect circular refs
    this.loadedTests = new Map(); // Cache loaded tests
  }

  /**
   * Load test file from disk
   */
  async loadTestFile(filePath, parentPath = null) {
    const resolvedPath = this.resolveTestPath(filePath, parentPath);

    // Check if already loaded (for efficiency)
    if (this.loadedTests.has(resolvedPath)) {
      Logger.info(`Using cached test: ${resolvedPath}`);
      return this.loadedTests.get(resolvedPath);
    }

    // Detect circular dependency
    if (this.loadingStack.has(resolvedPath)) {
      const chain = Array.from(this.loadingStack).join(' → ');
      throw new Error(`Circular dependency detected in test chain:\n  ${chain} → ${resolvedPath}`);
    }

    this.loadingStack.add(resolvedPath);

    try {
      Logger.info(`Loading test file: ${resolvedPath}`);

      // Validate file exists
      if (!(await fs.pathExists(resolvedPath))) {
        throw new Error(`Test file not found: ${resolvedPath}`);
      }

      // Read and parse YAML
      const fileContents = await fs.readFile(resolvedPath, 'utf8');
      const testData = yaml.load(fileContents);

      // Validate test data
      this.validateTestData(testData, resolvedPath);

      // Store source file path for reporting
      testData._sourceFile = resolvedPath;

      // Note: Child file existence will be validated when they are actually loaded
      // No need to pre-validate here as it can cause path resolution issues

      // Cache the loaded test
      this.loadedTests.set(resolvedPath, testData);

      Logger.success(`Test file loaded: ${testData.name}`);
      return testData;
    } catch (error) {
      Logger.error(`Failed to load test file: ${error.message}`);
      throw error;
    } finally {
      this.loadingStack.delete(resolvedPath);
    }
  }

  /**
   * Resolve test path relative to parent or absolute
   */
  resolveTestPath(filePath, basePath = null) {
    // If absolute path, use as-is
    if (path.isAbsolute(filePath)) {
      return path.normalize(filePath);
    }

    // If basePath provided, resolve relative to it
    if (basePath) {
      // Check if basePath is a file or directory
      const baseDir =
        basePath.endsWith('.yaml') || basePath.endsWith('.yml') ? path.dirname(basePath) : basePath;
      return path.resolve(baseDir, filePath);
    }

    // Otherwise, resolve relative to current working directory
    return path.resolve(filePath);
  }

  /**
   * Validate test data structure
   */
  validateTestData(testData, filePath) {
    if (!testData.name) {
      throw new Error(`Test file missing 'name' field: ${filePath}`);
    }

    // Child tests should not define browser startup or URL (they inherit from parent)
    // This is a soft validation - we'll just warn
    if (testData.children && testData.children.length > 0) {
      // Parent test - OK to have URL
    }

    return true;
  }

  /**
   * Clear the loading cache (useful for testing)
   */
  clearCache() {
    this.loadedTests.clear();
    this.loadingStack.clear();
  }

  /**
   * Get currently loading test chain (for debugging)
   */
  getLoadingChain() {
    return Array.from(this.loadingStack);
  }
}

export default TestFileLoader;
