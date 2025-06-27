// Example backend integration for our authentication system

// Frontend API call (our implementation already handles this)
const loginUser = async (credentials) => {
  try {
    const response = await ApiService.post('/api/auth/login', credentials);
    return response;
  } catch (error) {
    throw error;
  }
};


// Enhanced Backend Implementation (Node.js + Express)
// This is what the backend should look like to work with our frontend

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const app = express();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced login endpoint that works with our frontend
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Input validation
    if (!email || !password) {
      await logAuditEvent({
        userId: 'anonymous',
        action: 'LOGIN_FAILED',
        details: { email, reason: 'Missing credentials' },
        ipAddress,
        userAgent,
      });
      
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      await logAuditEvent({
        userId: 'anonymous',
        action: 'LOGIN_FAILED',
        details: { email, reason: 'User not found' },
        ipAddress,
        userAgent,
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      await logAuditEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        details: { email, reason: 'Account locked' },
        ipAddress,
        userAgent,
      });
      
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed attempts'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment failed login attempts
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }
      
      await user.save();
      
      await logAuditEvent({
        userId: user._id,
        action: 'LOGIN_FAILED',
        details: { 
          email, 
          reason: 'Invalid password',
          failedAttempts: user.failedLoginAttempts 
        },
        ipAddress,
        userAgent,
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens (matching our frontend expectations)
    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      process.env.JWT_SECRET
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      },
      process.env.JWT_REFRESH_SECRET
    );

    // Store refresh token in database (for security)
    user.refreshToken = refreshToken;
    await user.save();

    // Log successful login
    await logAuditEvent({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      details: { email },
      ipAddress,
      userAgent,
    });

    // Return response in format our frontend expects
    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        status: user.status,
        // Don't send sensitive fields like password
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    await logAuditEvent({
      userId: 'system',
      action: 'SECURITY_ALERT',
      details: { 
        error: error.message,
        endpoint: '/api/auth/login',
        ip: req.ip 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      },
      process.env.JWT_SECRET
    );

    res.json({
      success: true,
      token: newAccessToken
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      // Invalidate refresh token
      user.refreshToken = null;
      await user.save();
      
      // Log logout
      await logAuditEvent({
        userId: user._id,
        action: 'LOGOUT',
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Audit logging function
async function logAuditEvent(eventData) {
  try {
    const auditLog = new AuditLog({
      userId: eventData.userId,
      action: eventData.action,
      details: eventData.details,
      timestamp: new Date(),
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
    });
    
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    req.user = user;
    next();
  });
}
