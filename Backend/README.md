# Backend Setup Guide

## MongoDB Connection

The backend requires MongoDB to be running. Follow these steps:

### 1. Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection String
# For local MongoDB: 
MONGODB_URI=mongodb://localhost:27017/twitter-clone

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/twitter-clone

# JWT Secret for authentication tokens
JWT_SECRET=your-secret-key-change-this-in-production

# Server Port
PORT=3001

# Optional: Gemini API Key for verification features
# GEMINI_API_KEY=your-gemini-api-key
```

### 2. Install MongoDB locally (if not using Atlas):

**Windows:**
- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Install and start MongoDB service
- Or use MongoDB via Docker: `docker run -d -p 27017:27017 --name mongodb mongo`

**macOS:**
- `brew install mongodb-community`
- `brew services start mongodb-community`

**Linux:**
- Follow MongoDB installation guide for your distribution

### 3. Start the backend server:

```bash
cd backend
npm install
npm run dev  # or npm start
```

### 4. Check MongoDB connection:

The server will automatically connect to MongoDB on startup. You should see:
```
MongoDB Connected: localhost
🚀 Server running on port 3001
```

If you see connection errors, make sure:
- MongoDB is running
- The connection string in `.env` is correct
- The port (default 27017) is not blocked by firewall

### 5. Test the health endpoint:

Visit: `http://localhost:3001/api/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123.45,
  "database": {
    "status": "connected",
    "readyState": 1
  }
}
```

If `database.status` is not "connected", check your MongoDB connection.

## Troubleshooting

### MongoDB Connection Errors

1. **"MongoNetworkError: connect ECONNREFUSED"**
   - MongoDB is not running
   - Start MongoDB service or container

2. **"Authentication failed"**
   - Check MongoDB username/password in connection string
   - For Atlas, ensure IP whitelist includes your IP

3. **"Database connection not available"**
   - Check `mongoose.connection.readyState` in logs
   - Verify `.env` file exists and has correct `MONGODB_URI`

### Check Connection Status

The `/api/health` endpoint shows database connection status:
- `readyState: 0` = disconnected
- `readyState: 1` = connected ✅
- `readyState: 2` = connecting
- `readyState: 3` = disconnecting

