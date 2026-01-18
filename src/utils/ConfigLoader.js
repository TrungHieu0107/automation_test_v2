import fs from 'fs';
import yaml from 'js-yaml';
import Logger from './Logger.js';

/**
 * Configuration loader for YAML files
 */
class ConfigLoader {
  static load(configPath) {
    try {
      const fileContents = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(fileContents);
      Logger.success(`Configuration loaded from ${configPath}`);
      return config;
    } catch (error) {
      Logger.error(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  static getDefaultConfig() {
    return {
      browser: {
        type: 'msedge',
        headless: false,
        viewport: {
          width: 1535,
          height: 1024,
        },
      },
      report: {
        enabled: true,
        outputDir: 'report/',
        openAfterExecution: true,
        theme: 'default',
      },
      screenshots: {
        enabled: true,
        onFailure: true,
        beforeSubmit: true,
        afterNavigation: true,
      },
    };
  }
}

export default ConfigLoader;
