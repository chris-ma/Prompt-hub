type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (!context || Object.keys(context).length === 0) return base;
  return `${base} ${JSON.stringify(context)}`;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, context));
    }
  },
  info(message: string, context?: LogContext): void {
    console.info(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext): void {
    console.error(formatLog("error", message, context));
  },
};
