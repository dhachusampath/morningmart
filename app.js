// server.js - COMPLETE CORS SOLUTION
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ ALLOWED ORIGINS (Add all your domains here)
const allowedOrigins = [
  "https://morningmart.netlify.app",     // Production frontend
  "https://morningmart.onrender.com",    // Production backend
  "https://moralmgmat.com",              // Your domain
  "https://moralmgmat.netlify.app",      // Alternative domain
  "http://localhost:5173",               // Vite dev server
  "http://localhost:3000",               // React dev server
  "http://localhost:5000",               // Local backend
];

// ✅ 1. CORS MIDDLEWARE (Primary solution)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow any origin (remove in production)
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
}));

// ✅ 2. HANDLE PREFLIGHT REQUESTS FOR ALL ROUTES
app.options('*', cors());

// ✅ 3. MANUAL CORS HEADERS (Absolute backup)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow if origin is in whitelist or development
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  res.header('Access-Control-Max-Age', '600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ✅ 4. RATE LIMITING (Prevent infinite loops)
const requestTracker = new Map();
setInterval(() => {
  // Clean up old entries every minute
  const now = Date.now();
  for (const [key, data] of requestTracker.entries()) {
    if (now - data.timestamp > 60000) {
      requestTracker.delete(key);
    }
  }
}, 60000);

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const path = req.path;
  const key = `${ip}-${path}`;
  const now = Date.now();

  if (!requestTracker.has(key)) {
    requestTracker.set(key, { count: 1, timestamp: now });
  } else {
    const data = requestTracker.get(key);
    // Reset counter if more than 1 second passed
    if (now - data.timestamp > 1000) {
      data.count = 1;
      data.timestamp = now;
    } else {
      data.count++;
    }
  }

  const currentCount = requestTracker.get(key).count;

  // Block excessive requests (60 requests per minute per endpoint per IP)
  if (currentCount > 60) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down your requests',
      retryAfter: 60
    });
  }

  next();
});

// ✅ 5. BODY PARSERS (After CORS)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ 6. STATIC FILES (With CORS)
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow images from anywhere
  }
}));

// ✅ 7. HEALTH CHECK ENDPOINT (Test CORS)


// ✅ 8. ALL YOUR ROUTES (They will inherit CORS)
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
// ... import other routes

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
// ... use other routes

// ✅ 9. ERROR HANDLING (CORS errors)
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: "CORS Error",
      message: "Request blocked by CORS policy",
      yourOrigin: req.headers.origin,
      allowedOrigins: allowedOrigins,
      solution: "Contact admin to add your domain to allowed origins"
    });
  }
  
  console.error("Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
  });
});

// ✅ 10. MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Error:", err));

// ✅ 11. START SERVER
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Test CORS: https://morningmart.onrender.com/api/health`);
});

module.exports = app;