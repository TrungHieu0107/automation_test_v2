import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import Logger from '../utils/Logger.js';

/**
 * Generates HTML report from aggregated data
 */
class HtmlReportGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.assetsDir = path.join(outputDir, 'assets');
    
    // Get current file's directory
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.templateDir = path.join(__dirname, '../../report-template');
  }

  /**
   * Generate HTML report
   */
  async generate(reportData) {
    try {
      Logger.info('Generating HTML report...');
      
      // Ensure output directory exists
      await fs.ensureDir(this.outputDir);
      await fs.ensureDir(this.assetsDir);
      
      // Copy template files
      await this.copyTemplateAssets();
      
      // Generate HTML with injected data
      await this.generateHtmlFile(reportData);
      
      const reportPath = path.join(this.outputDir, 'index.html');
      Logger.success(`Report generated at: ${reportPath}`);
      
      return reportPath;
    } catch (error) {
      Logger.error(`Failed to generate HTML report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Copy template assets (CSS, JS)
   */
  async copyTemplateAssets() {
    const templateAssetsDir = path.join(this.templateDir, 'assets');
    
    if (await fs.pathExists(templateAssetsDir)) {
      await fs.copy(templateAssetsDir, this.assetsDir, { overwrite: true });
      Logger.info('Template assets copied');
    }
  }

  /**
   * Generate HTML file with data injection
   */
  async generateHtmlFile(reportData) {
    const templatePath = path.join(this.templateDir, 'index.html');
    let htmlContent = await fs.readFile(templatePath, 'utf8');
    
    // Inject report data as JavaScript variable
    const dataScript = `
    <script>
      window.REPORT_DATA = ${JSON.stringify(reportData, null, 2)};
    </script>`;
    
    // Insert before closing </head> tag
    htmlContent = htmlContent.replace('</head>', `${dataScript}\n</head>`);
    
    // Write to output directory
    const outputPath = path.join(this.outputDir, 'index.html');
    await fs.writeFile(outputPath, htmlContent, 'utf8');
  }

  /**
   * Open report in browser
   */
  async openInBrowser(reportPath) {
    try {
      const { default: open } = await import('open');
      await open(reportPath);
      Logger.success('Report opened in browser');
    } catch (error) {
      Logger.warn('Could not open report automatically. Please open manually.');
    }
  }
}

export default HtmlReportGenerator;
