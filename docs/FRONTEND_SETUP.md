# Frontend Setup & Run Guide

## ✅ Frontend Created

The React frontend is now set up in `frontend/` directory.

### Structure:
```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── api/             # API integration
│   ├── hooks/           # Custom hooks
│   └── utils/           # Utilities
├── package.json         # Dependencies (configured ✅)
└── .env                 # Environment variables (created ✅)
```

---

## 🚀 How to Run Frontend

### Prerequisites:
You need **Node.js** installed. If not, download from: https://nodejs.org/

### Option 1: Using Batch Script (Windows)

Run this in the project root:
```cmd
START_FRONTEND.bat
```

This script will:
- ✅ Check if Node.js is installed
- ✅ Install npm dependencies (if needed)
- ✅ Create .env file
- ✅ Start development server

### Option 2: Manual Command

Open Command Prompt and run:

```cmd
cd d:\Projects\zynk-play\frontend

npm install

npm start
```

---

## 📍 Access Frontend

Once running, open browser:
```
http://localhost:3000
```

---

## 🔧 Configuration

### .env File
Located at `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

**Change these if needed:**
- `REACT_APP_API_URL` - Points to Django backend
- `REACT_APP_API_TIMEOUT` - Request timeout in ms

---

## 📦 Dependencies

Installed packages:
- **react** (18.2.0) - Core React library
- **react-dom** (18.2.0) - React DOM rendering
- **react-router-dom** (6.11.0) - Client-side routing
- **axios** (1.4.0) - HTTP client for API calls
- **react-scripts** (5.0.1) - Build scripts
- **typescript** (5.0.0) - Type safety

---

## 🔗 Backend Integration

The frontend automatically connects to the backend API at:
```
http://localhost:8000/api/v1/
```

Make sure Django backend is running before starting the frontend!

Check backend status:
```
http://localhost:8000
```

---

## 🛑 Stop Frontend

Press `Ctrl + C` in the terminal where the frontend is running.

---

## 🧹 Cleanup

To remove node_modules and reinstall fresh:

```cmd
cd d:\Projects\zynk-play\frontend
rm -r node_modules package-lock.json
npm install
npm start
```

---

## Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Problem: Port 3000 already in use
**Solution:** 
```cmd
npm start -- --port 3001
```

### Problem: CORS errors when connecting to backend
**Solution:** 
- Make sure Django backend is running
- Check Django CORS_ALLOWED_ORIGINS includes `http://localhost:3000`
- Restart both frontend and backend

### Problem: Dependencies won't install
**Solution:**
```cmd
npm cache clean --force
npm install
```

---

## Build for Production

Create optimized production build:

```cmd
cd d:\Projects\zynk-play\frontend
npm run build
```

Build output will be in `frontend/build/`

---

## Available Scripts

- `npm start` - Start development server (port 3000)
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app (not recommended)

---

## Next Steps

1. ✅ Frontend structure created
2. ✅ package.json configured
3. ✅ .env file created
4. 🔜 Run `npm install` (installs dependencies)
5. 🔜 Run `npm start` (starts development server)
6. 🔜 Open http://localhost:3000 in browser

---

**Last Updated:** 2026-04-07
**Status:** Ready to run
