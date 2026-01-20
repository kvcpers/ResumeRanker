# Heroku Deployment Guide

## Prerequisites

1. Heroku CLI installed
2. Git repository initialized
3. Heroku account

## Deployment Steps

### 1. Create Heroku App
```bash
heroku create your-app-name
```

### 2. Set Environment Variables
Set all required environment variables in Heroku:
```bash
heroku config:set DATABASE_URL="your-postgresql-connection-string"
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set BUILT_IN_FORGE_API_URL="https://openrouter.ai/api/v1"
heroku config:set BUILT_IN_FORGE_API_KEY="your-openrouter-api-key"
```

### 3. Configure Buildpacks
Heroku needs to know to use Node.js and pnpm:
```bash
heroku buildpacks:add heroku/nodejs
```

### 4. Deploy
```bash
git push heroku main
```

Or if your default branch is `master`:
```bash
git push heroku master
```

## Important Notes

1. **File Storage**: Heroku's filesystem is ephemeral. Files uploaded to `uploads/` will be lost when dynos restart. For production, consider using:
   - AWS S3 (configure `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` for S3-compatible storage)
   - Cloudinary
   - Or another persistent storage solution

2. **Database**: Make sure your PostgreSQL database (Supabase) allows connections from Heroku's IP ranges.

3. **Build Process**: The `build` script in `package.json` will automatically run during deployment, which:
   - Builds the client with Vite
   - Bundles the server with esbuild

4. **Port**: The server automatically uses Heroku's `PORT` environment variable.

5. **Logs**: View logs with:
   ```bash
   heroku logs --tail
   ```

## Troubleshooting

- **App crashes on startup**: Check logs with `heroku logs --tail`
- **Build fails**: Ensure all dependencies are in `dependencies` (not `devDependencies`)
- **Database connection fails**: Verify `DATABASE_URL` is set correctly
- **Static files not loading**: Ensure the build completed successfully (`dist/public` exists)
