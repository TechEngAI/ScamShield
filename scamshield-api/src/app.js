const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');

const app = express();

// Trust proxy for ngrok in development
app.set('trust proxy', 1);

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = new Set([...(config.ALLOWED_ORIGINS || []), 'http://localhost:3000']);

    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '64kb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  return res.json({
    status: 'ok',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
