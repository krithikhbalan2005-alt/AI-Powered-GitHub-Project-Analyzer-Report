import app from './app';
import { config } from './config';

// Only start listening when not running as a Vercel serverless function
if (process.env.VERCEL !== '1') {
  const server = app.listen(config.PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Server running in [${config.NODE_ENV}] mode`);
    console.log(`🔊 Listening on port: ${config.PORT}`);
    console.log(`🔗 Local endpoint: http://localhost:${config.PORT}`);
    console.log(`========================================`);
  });

  // Handle graceful shutdowns
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down gracefully...');
    server.close(() => {
      console.log('Http server closed.');
      process.exit(0);
    });
  });
}

// Export the Express app for Vercel serverless function handler
export default app;
