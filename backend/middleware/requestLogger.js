const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Listen for the response to finish to calculate duration
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
    console.log(logMessage);
  });

  next();
};

module.exports = requestLogger;
