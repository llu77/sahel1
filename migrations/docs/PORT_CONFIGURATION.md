# Local Development Port Configuration

This project provides multiple ways to run the development server on different ports to avoid conflicts.

## Available Options

### 1. Default Port (3000)
```bash
npm run dev
```
Runs the application on http://localhost:3000

### 2. Fixed Alternative Port (3001)
```bash
npm run dev:3001
```
Runs the application on http://localhost:3001

### 3. Environment Variable Port
```bash
PORT=3002 npm run dev:port
```
Runs the application on the port specified by the PORT environment variable (defaults to 3000 if not set)

### 4. Using .env.local file
Edit the `.env.local` file and uncomment the PORT line:
```
PORT=3001
```
Then run:
```bash
npm run dev:port
```

## Troubleshooting Port Conflicts

If you encounter a "port already in use" error:
1. Use `npm run dev:3001` to run on port 3001
2. Or set a custom port with `PORT=3002 npm run dev:port`
3. Or modify `.env.local` to set a permanent alternative port

## Build and Production

The build process remains unchanged:
```bash
npm run build  # Build the application
npm run start  # Start production server (default port 3000)
```

For production on a different port:
```bash
PORT=3001 npm run start
```