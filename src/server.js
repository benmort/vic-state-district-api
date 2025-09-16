import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postcodeRoutes from './routes/postcode.js';
import { apiKeyAuth, rateLimit } from './middleware/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'VIC State District API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public HTML page (no authentication required)
app.get('/mps', async (req, res) => {
  const postcodeRoutes = await import('./routes/postcode.js');
  const router = postcodeRoutes.default;
  
  // Create a mock request/response for the router
  const mockReq = { ...req, path: '/mps_table_html' };
  const mockRes = {
    ...res,
    send: (html) => res.send(html)
  };
  
  router.handle(mockReq, mockRes);
});

// Public data endpoint for MPs table (no authentication required)
app.get('/mps/data', async (req, res) => {
  const postcodeRoutes = await import('./routes/postcode.js');
  const router = postcodeRoutes.default;
  
  // Create a mock request/response for the router
  const mockReq = { ...req, path: '/mps_table' };
  const mockRes = {
    ...res,
    json: (data) => res.json(data)
  };
  
  router.handle(mockReq, mockRes);
});

// API Authentication & Rate Limiting
app.use('/api', apiKeyAuth);
app.use('/api', rateLimit(5000, 15 * 60 * 1000)); // 5000 requests per 15 minutes

// API routes
app.use('/api', postcodeRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to VIC State District API',
    authentication: {
      required: true,
      headers: ['X-API-Key', 'API-Key', 'Authorization: Bearer <token>'],
      example: 'X-API-Key: demo-api-key-12345'
    },
    rateLimit: {
      requests: 5000,
      window: '15 minutes'
    },
    endpoints: {
      health: '/health',
      mps_directory: '/mps (public HTML page)',
      mps_data: '/mps/data (public JSON data)',
      postcode_lookup: {
        post: '/api/postcode_lookup',
        get: '/api/postcode_lookup/:postcode'
      }
    },
    documentation: {
      postcode_lookup: {
        description: 'Lookup district information by postcode',
        methods: ['POST', 'GET'],
        post: {
          url: '/api/postcode_lookup',
          headers: { 'X-API-Key': 'demo-api-key-12345' },
          body: { postcode: 'string (4 digits)' },
          example: { postcode: '3000' }
        },
        get: {
          url: '/api/postcode_lookup/:postcode',
          example: '/api/postcode_lookup/3000'
        },
        response: {
          success: true,
          data: {
            postcode: 'number',
            districts: [
              {
                name: 'string',
                id: 'number',
                mp: {
                  name: 'string',
                  party: 'string',
                  phoneNumber: 'string'
                }
              }
            ]
          }
        }
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /mps (public HTML page)',
      'GET /mps/data (public JSON data)',
      'POST /api/postcode_lookup',
      'GET /api/postcode_lookup/:postcode'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VIC State District API running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
