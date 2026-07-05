export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message: string, error?: any, ...args: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else {
        console.error(error);
      }
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...args);
    }
  }
};
