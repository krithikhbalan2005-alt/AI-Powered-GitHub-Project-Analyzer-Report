import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import analysisRoutes from './routes/analysisRoutes';
import profileRoutes from './routes/profileRoutes';
import adminRoutes from './routes/adminRoutes';
import { config } from './config';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet());

// 2. CORS configurations
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://ai-powered-git-hub-project-analyzer.vercel.app',
  config.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || config.NODE_ENV === 'development') {
        return callback(null, true);
      } else {
        return callback(new Error('CORS Policy violation: Origin not allowed'), false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Rate Limiting (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'security/rate-limit-exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// 4. Request parsing with payload limit (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Routes
app.get('/api/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'AI Powered GitHub Analyzer Engine online',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    },
  });
});

app.use('/api/analyses', analysisRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// 6. 404 Route handler
app.use((_req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'Endpoint route not found',
    code: 'router/route-not-found',
  });
});

// 7. Safe Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server exception:', {
    message: err.message,
    name: err.name,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const statusCode = err.status || err.statusCode || 500;
  
  return res.status(statusCode).json({
    success: false,
    message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: err.code || 'server/internal-error',
    details: err.details || [],
  });
});

export default app;
