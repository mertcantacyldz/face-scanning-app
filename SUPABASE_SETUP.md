# Supabase Setup Guide - Device-Based Authentication

This guide explains how to configure Supabase for anonymous/device-based authentication.

## 🎯 Overview

We're implementing a device-based auth system where:
- Users don't see a login screen on first launch
- Anonymous Supabase users are created automatically
- Device ID is stored securely (iOS Keychain / Android KeyStore)
- Users can upgrade to premium without any authentication
- Optional: OAuth login for cross-device sync (future feature)

---

## 📋 Step-by-Step Instructions

### Step 1: Enable Anonymous Sign-Ins

1. Open your Supabase project dashboard
2. Go to **Authentication** → **Settings**
3. Find "User Signups" section
4. Enable **"Allow anonymous sign-ins"**
5. Click **Save**

**Screenshot location:** Authentication → Settings → User Signups

**Why this is needed:** This allows the app to create anonymous users automatically without email/password.

---

### Step 2: Run Database Migration

1. Open Supabase SQL Editor
2. Navigate to your project's SQL Editor
3. Copy the contents of `supabase/device_users_migration.sql`
4. Paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)

**What this migration does:**
- Makes `profiles.email` nullable (for anonymous users)
- Creates `device_users` table (maps device IDs to users)
- Adds Row Level Security (RLS) policies
- Updates the `handle_new_user()` trigger to support anonymous users

**Expected output:**
```
Success. No rows returned
```

**Verification query:**
```sql
-- Check if device_users table exists
SELECT * FROM public.device_users LIMIT 1;

-- Check if profiles.email is nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'email';
```

---

### Step 3: Verify RLS Policies

Run this query to verify all RLS policies are in place:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('device_users', 'profiles')
ORDER BY tablename, policyname;
```

**Expected policies:**

**device_users table:**
- `Users can view own device records` (SELECT)
- `Users can insert own device records` (INSERT)
- `Users can update own device records` (UPDATE)

**profiles table:**
- `Anonymous users can create profile` (INSERT)
- Existing policies...

---

### Step 4: Test Anonymous Auth (Optional)

You can test anonymous auth directly in Supabase:

```sql
-- After running the app, check for anonymous users
SELECT id, email, is_anonymous, created_at, raw_user_meta_data->>'device_id' as device_id
FROM auth.users
WHERE is_anonymous = true
ORDER BY created_at DESC
LIMIT 5;
```

**Expected result:**
- `is_anonymous`: true
- `email`: NULL
- `device_id`: UUID in metadata

---

### Step 5: Configure Environment Variables

Make sure your `.env` file contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key
EXPO_PUBLIC_REVENUECAT_IOS_KEY=your_revenuecat_ios_key
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=your_revenuecat_android_key
```

**After updating `.env`:**
```bash
npx expo start --clear
```

---

## 🧪 Testing the Implementation

### Test 1: Fresh Install (Anonymous Auth)

1. Delete the app from device/simulator
2. Reinstall and launch
3. Check logs for:
   ```
   No session found, creating anonymous user...
   Anonymous user created: <user_id>
   Device mapping created successfully
   ```
4. Should redirect directly to `/(tabs)` (main app)

### Test 2: Device ID Persistence

1. Close the app
2. Reopen the app
3. Check logs for:
   ```
   Device ID retrieved: <same_id>
   Existing session found: <same_user_id>
   ```
4. Should use the same device ID and session

### Test 3: Database Verification

```sql
-- Check device_users table
SELECT * FROM public.device_users ORDER BY created_at DESC LIMIT 5;

-- Check profiles table (email should be NULL for anonymous)
SELECT user_id, email, full_name, free_analysis_used
FROM public.profiles
WHERE email IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- Check auth.users (is_anonymous should be true)
SELECT id, email, is_anonymous, raw_user_meta_data->>'device_id' as device_id
FROM auth.users
WHERE is_anonymous = true
ORDER BY created_at DESC
LIMIT 5;
```

### Test 4: Premium Purchase (Device-Based)

1. Launch app (anonymous user)
2. Navigate to premium paywall
3. Purchase a subscription
4. Check RevenueCat dashboard for the purchase
5. Verify premium status in app

### Test 5: Restore Purchases

1. Uninstall app
2. Reinstall app (new device ID, new anonymous user)
3. Navigate to paywall
4. Click "Satın Alımları Geri Yükle"
5. Should restore premium status via RevenueCat

---

## ⚠️ Troubleshooting

### Issue: "Anonymous sign-ins are not enabled"

**Solution:** Go to Supabase Dashboard → Authentication → Settings → Enable "Allow anonymous sign-ins"

### Issue: "Table 'device_users' does not exist"

**Solution:** Run the migration SQL in `supabase/device_users_migration.sql`

### Issue: "Null value in column 'email' violates not-null constraint"

**Solution:** Make sure you ran the migration that makes email nullable:
```sql
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
```

### Issue: Device ID changes every app launch

**Possible causes:**
1. SecureStore error (check logs for "Device ID error")
2. Permissions issue (iOS Keychain / Android KeyStore)
3. Simulator/emulator issue (use real device for testing)

**Solution:** Check logs and verify SecureStore is working. If using temp ID, check for errors in device-id.ts.

### Issue: Anonymous user cannot insert profile

**Solution:** Add RLS policy:
```sql
CREATE POLICY "Anonymous users can create profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🔐 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:
- `device_users`: Users can only access their own device records
- `profiles`: Users can only access their own profile
- `face_analysis`: Users can only access their own analyses
- `region_analysis`: Users can only access their own analyses

### Device ID Storage

- Stored in expo-secure-store (iOS Keychain / Android KeyStore)
- Persists across app reinstalls (on some platforms)
- UUID format (collision probability ~0)

### Anonymous User Limitations

- Cannot login from another device (no email/password)
- Premium tied to device (unless Restore Purchases used)
- Data stays on single device (unless OAuth upgrade)

---

## 🚀 Next Steps (Future Features)

### OAuth Integration (Cross-Device Sync)

To add Google/Apple sign-in later:

1. **Supabase Setup:**
   - Go to Authentication → Providers
   - Enable Google OAuth
   - Enable Apple OAuth
   - Add redirect URLs:
     ```
     https://[PROJECT_ID].supabase.co/auth/v1/callback
     facescanningapp://auth/callback
     ```

2. **External Setup:**
   - Google Cloud Console: Create OAuth 2.0 credentials
   - Apple Developer: Enable Sign In with Apple

3. **Data Migration:**
   - Implement `lib/auth-migration.ts`
   - Migrate anonymous user data to OAuth user
   - Update device_users table with OAuth info

---

## 📊 Database Schema

### device_users table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| device_id | TEXT | Unique device identifier (from SecureStore) |
| supabase_user_id | UUID | References auth.users (ON DELETE CASCADE) |
| oauth_provider | TEXT | NULL or 'google'/'apple' |
| oauth_email | TEXT | NULL or OAuth email |
| created_at | TIMESTAMPTZ | When device was first registered |
| last_seen | TIMESTAMPTZ | Last activity timestamp |

### profiles table (updated)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | NO | Primary key |
| user_id | UUID | NO | References auth.users |
| email | VARCHAR | **YES** | NULL for anonymous users |
| full_name | VARCHAR | YES | Default: 'User' |
| is_premium | BOOLEAN | YES | Premium status |
| free_analysis_used | BOOLEAN | YES | Free tier usage |
| free_analysis_region | TEXT | YES | Which region analyzed for free |

---

## ✅ Checklist

Before deploying to production:

- [ ] Anonymous sign-ins enabled in Supabase
- [ ] Migration SQL executed successfully
- [ ] RLS policies verified
- [ ] Device ID system tested (persistence check)
- [ ] Anonymous auth tested (fresh install)
- [ ] Premium purchase tested (device-based)
- [ ] Restore Purchases tested
- [ ] Database queries verified (device_users, profiles)
- [ ] Logs checked for errors
- [ ] .env file configured correctly

---

## 📞 Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs
2. Check app logs: `npx expo start` terminal output
3. Verify RLS policies are active
4. Test queries in SQL Editor
5. Check authentication settings

---

**Last Updated:** December 9, 2025
**Version:** 1.0.0
