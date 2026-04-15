function baseLog(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  console.log(JSON.stringify(entry));
}

export const logger = {
  info(message, meta) {
    baseLog('info', message, meta);
  },
  warn(message, meta) {
    baseLog('warn', message, meta);
  },
  error(message, meta) {
    baseLog('error', message, meta);
  }
};
