/**
 * Logger utility for colorful console output
 */
class Logger {
  static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };

  static getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
  }

  static info(message) {
    console.log(
      `${this.colors.gray}[${this.getTimestamp()}]${this.colors.reset} ` +
      `${this.colors.blue}INFO${this.colors.reset}  ${message}`
    );
  }

  static success(message) {
    console.log(
      `${this.colors.gray}[${this.getTimestamp()}]${this.colors.reset} ` +
      `${this.colors.green}✓${this.colors.reset}     ${message}`
    );
  }

  static error(message) {
    console.log(
      `${this.colors.gray}[${this.getTimestamp()}]${this.colors.reset} ` +
      `${this.colors.red}ERROR${this.colors.reset} ${message}`
    );
  }

  static warn(message) {
    console.log(
      `${this.colors.gray}[${this.getTimestamp()}]${this.colors.reset} ` +
      `${this.colors.yellow}WARN${this.colors.reset}  ${message}`
    );
  }

  static step(message) {
    console.log(
      `${this.colors.gray}[${this.getTimestamp()}]${this.colors.reset} ` +
      `${this.colors.cyan}→${this.colors.reset}     ${message}`
    );
  }
}

export default Logger;
