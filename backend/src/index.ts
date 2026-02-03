import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { ticketRouter } from './routes/tickets';
import { userRouter } from './routes/users';
import { dashboardRouter } from './routes/dashboard';
import { stepsRouter } from './routes/steps';
import settingsRouter from './routes/settings';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/users', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/steps', stepsRouter);
app.use('/api/settings', settingsRouter);

// Error handler
app.use(errorHandler);

const port = Number(PORT);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Local: http://localhost:${port}`);
  console.log(`Network: http://192.168.88.213:${port}`);
});
