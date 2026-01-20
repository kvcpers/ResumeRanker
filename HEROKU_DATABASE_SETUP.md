# Heroku Database Setup

Your app is running but the database connection is failing. Follow these steps to fix it:

## Step 1: Set DATABASE_URL on Heroku

Run this command (replace with your actual Supabase connection string):

```bash
heroku config:set DATABASE_URL="postgresql://postgres:UstyNa5d!123@db.rbuivaeulqgsyjuweojr.supabase.co:5432/postgres"
```

Or if you have a different connection string format:

```bash
heroku config:set DATABASE_URL="your-full-postgresql-connection-string"
```

## Step 2: Verify the Configuration

Check that it was set correctly:

```bash
heroku config:get DATABASE_URL
```

## Step 3: Restart the App

After setting the environment variable, restart your Heroku dyno:

```bash
heroku restart
```

## Step 4: Check Logs

Monitor the logs to see if the database connects:

```bash
heroku logs --tail
```

You should see: `[Database] ✅ Connected successfully to PostgreSQL`

## Troubleshooting

### If you still get "Database not available":

1. **Check your Supabase connection string:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the connection string (use the "URI" format)

2. **Verify Supabase allows connections:**
   - Make sure your Supabase project is active
   - Check if there are any IP restrictions
   - Heroku's IP addresses should be allowed (or set to allow all)

3. **Check the connection string format:**
   - Should start with `postgresql://` or `postgres://`
   - Format: `postgresql://user:password@host:port/database`

4. **Test the connection locally:**
   ```bash
   # Set it locally first to test
   export DATABASE_URL="your-connection-string"
   pnpm dev
   ```

## Required Environment Variables

Make sure these are all set on Heroku:

```bash
heroku config:set DATABASE_URL="your-postgresql-connection-string"
heroku config:set JWT_SECRET="your-secret-key"
heroku config:set BUILT_IN_FORGE_API_URL="https://openrouter.ai/api/v1"
heroku config:set BUILT_IN_FORGE_API_KEY="your-openrouter-api-key"
heroku config:set NODE_ENV="production"
```
