import Logger from '../utils/Logger.js';

/**
 * Execution context for preserving browser state between tests
 */
class ExecutionContext {
  constructor(testName, url) {
    this.testName = testName;
    this.url = url;
    this.timestamp = Date.now();
  }

  toString() {
    return `ExecutionContext[${this.testName}] @ ${this.url}`;
  }
}

/**
 * Stack for managing execution contexts
 */
class ExecutionContextStack {
  constructor() {
    this.stack = [];
  }

  /**
   * Push context onto stack
   */
  push(context) {
    this.stack.push(context);
    Logger.info(`Context pushed: ${context.testName} (depth: ${this.stack.length})`);
  }

  /**
   * Pop context from stack
   */
  pop() {
    if (this.isEmpty()) {
      Logger.warn('Attempted to pop from empty context stack');
      return null;
    }
    
    const context = this.stack.pop();
    Logger.info(`Context popped: ${context.testName} (depth: ${this.stack.length})`);
    return context;
  }

  /**
   * Peek at top context without removing
   */
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.stack[this.stack.length - 1];
  }

  /**
   * Check if stack is empty
   */
  isEmpty() {
    return this.stack.length === 0;
  }

  /**
   * Get current depth
   */
  depth() {
    return this.stack.length;
  }

  /**
   * Clear the stack
   */
  clear() {
    this.stack = [];
  }

  /**
   * Get all contexts (for debugging)
   */
  getAll() {
    return [...this.stack];
  }
}

export { ExecutionContext, ExecutionContextStack };
