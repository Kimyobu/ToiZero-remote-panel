import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import tasksRouter from './routes/tasks';
import pdfRouter from './routes/pdf';
import submitRouter from './routes/submit';
import localRouter from './routes/local';
import devlogRouter from './routes/devlog';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (console)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const methodColor = '\x1b[35m'; // Magenta
    const pathColor = '\x1b[36m';   // Cyan
    
    console.log(
      `${methodColor}${req.method}\x1b[0m ` +
      `${pathColor}${req.originalUrl}\x1b[0m → ` +
      `${statusColor}${res.statusCode}\x1b[0m ` +
      `(${duration}ms)`
    );
  });
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/pdf', pdfRouter);
app.use('/api/submit', submitRouter);
app.use('/api/local', localRouter);
app.use('/api/devlog', devlogRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    localPath: process.env.TOI_LOCAL_PATH || null,
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\x1b[34m[ToiZero Backend] Running on http://localhost:${PORT}\x1b[0m`);
  if (process.env.TOI_LOCAL_PATH) {
    console.log(`\x1b[34m[ToiZero Backend] Local TOI path: ${process.env.TOI_LOCAL_PATH}\x1b[0m`);
  } else {
    console.log('\x1b[33m[ToiZero Backend] TOI_LOCAL_PATH not set — local file features disabled\x1b[0m');
    console.log('\x1b[33m  Set it in backend/.env: TOI_LOCAL_PATH=/path/to/your/TOI\x1b[0m');
  }
});

export default app;
