/**
 * API Key Authentication Middleware
 * 
 * This middleware validates API keys from standard headers:
 * - X-API-Key (most common)
 * - Authorization: Bearer <token>
 * - API-Key
 * 
 * Standard naming conventions followed:
 * - X-API-Key: Industry standard for API authentication
 * - Authorization: RFC 7235 standard for HTTP authentication
 * - API-Key: Simple alternative header
 */

export const apiKeyAuth = (req, res, next) => {
  // Check for API key in various standard headers
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['api-key'] || 
                 extractBearerToken(req.headers.authorization);

  // If no API key found, return 401 Unauthorized
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Please provide an API key in one of these headers: X-API-Key, API-Key, or Authorization: Bearer <token>',
      requiredHeaders: ['X-API-Key', 'API-Key', 'Authorization: Bearer <token>']
    });
  }

  // Validate API key (you can customize this logic)
  if (!isValidApiKey(apiKey)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key provided'
    });
  }

  // Add API key to request object for use in routes
  req.apiKey = apiKey;
  
  // Log API key usage (optional - remove in production if sensitive)
  console.log(`🔑 API request authenticated with key: ${apiKey.substring(0, 8)}...`);
  
  next();
};

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  
  return null;
}

/**
 * Validate API key
 * @param {string} apiKey - API key to validate
 * @returns {boolean} - Whether the API key is valid
 */
function isValidApiKey(apiKey) {
  // Basic validation - you can customize this
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Check minimum length
  if (apiKey.length < 8) {
    return false;
  }

  // Check against single API key from environment variable
  const validApiKey = process.env.API_KEY;
  
  return apiKey === validApiKey;
}

/**
 * Optional middleware for API key validation with custom validation function
 * @param {Function} validationFn - Custom validation function
 * @returns {Function} - Middleware function
 */
export const customApiKeyAuth = (validationFn) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || 
                   req.headers['api-key'] || 
                   extractBearerToken(req.headers.authorization);

    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required'
      });
    }

    if (!validationFn(apiKey)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid API key'
      });
    }

    req.apiKey = apiKey;
    next();
  };
};

/**
 * Rate limiting middleware (bonus)
 * Simple in-memory rate limiting
 */
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.apiKey || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    if (requestCounts.has(clientId)) {
      const requests = requestCounts.get(clientId).filter(time => time > windowStart);
      requestCounts.set(clientId, requests);
    } else {
      requestCounts.set(clientId, []);
    }

    const requests = requestCounts.get(clientId);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000 / 60} minutes.`,
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      });
    }

    requests.push(now);
    next();
  };
};
