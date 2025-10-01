# Deploying StageTimer to Vercel

## Prerequisites
- A Vercel account (https://vercel.com)
- Your Supabase project with the following:
  - Project URL
  - Anon/Public key
  - Database migrations applied

## Step 1: Enable Supabase Realtime

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Enable replication for the `room_state` table
4. The table is already configured for realtime in the migration

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `Astrobubu/StageTimer`
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. Click **"Deploy"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

## Step 3: Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Test login with: `test@example.com` / `test123`
3. Create a room and test timer functionality
4. Open the viewer in a separate tab to test real-time sync

## Architecture

- **Frontend**: Next.js 15 (deployed on Vercel)
- **Backend**: Serverless (Vercel Edge Functions)
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime (Postgres Changes)
- **Authentication**: Supabase Auth

## Features Working on Vercel

✅ Real-time timer synchronization via Supabase Realtime
✅ User authentication
✅ Room management
✅ Timer agenda with auto-advance
✅ Pause/break timers
✅ Message broadcasting
✅ Progress bars with color coding

## Troubleshooting

### Timers not syncing
- Check Supabase Realtime is enabled for `room_state` table
- Verify environment variables are set correctly
- Check browser console for errors

### Authentication not working
- Verify Supabase URL and anon key are correct
- Check Supabase Auth is enabled
- Ensure RLS policies are applied

### Build fails
- Check all dependencies are in package.json
- Verify TypeScript types are correct
- Check Next.js version compatibility

## Production Considerations

1. **Environment Variables**: Never commit `.env.local` to git
2. **Database**: Supabase free tier has limits - monitor usage
3. **RLS Policies**: Already configured for secure access
4. **Rate Limiting**: Consider adding rate limiting for API calls
5. **Monitoring**: Use Vercel Analytics and Supabase logs

## Support

For issues, check:
- Vercel deployment logs
- Supabase logs and dashboard
- Browser console for client errors
