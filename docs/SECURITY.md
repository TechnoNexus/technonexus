# TechnoNexus Security Configuration

## Supabase Row-Level Security (RLS)

### Current Status
⚠️ **CRITICAL**: RLS policies are NOT enabled by default. All user data is publicly accessible.

### Enable RLS on `user_games` Table

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on user_games table
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own games
CREATE POLICY "Users can view their own games"
ON user_games FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own games
CREATE POLICY "Users can insert their own games"
ON user_games FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own games
CREATE POLICY "Users can update their own games"
ON user_games FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own games
CREATE POLICY "Users can delete their own games"
ON user_games FOR DELETE
USING (auth.uid() = user_id);
```

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to your project's SQL Editor

2. **Copy the SQL above** and execute it

3. **Verify RLS is enabled**
   - Go to Authentication → Policies
   - You should see 4 policies for `user_games` table

4. **Test in your app**
   - Invite another user to create their own vault
   - Verify they cannot see games from other users

### Future: Create `leaderboard` Table with RLS

```sql
-- Create leaderboard table (for global rankings)
CREATE TABLE leaderboard (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  total_wins INT DEFAULT 0,
  total_games INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Public can read leaderboard
CREATE POLICY "Leaderboard is public"
ON leaderboard FOR SELECT
USING (true);

-- Users can only update their own entry
CREATE POLICY "Users can update their own leaderboard entry"
ON leaderboard FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can insert their own entry
CREATE POLICY "Users can insert their own leaderboard entry"
ON leaderboard FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## API Security

### Current Protections
✅ Supabase Auth tokens checked on all protected operations  
✅ `user_id` validated in Zustand store  

### Recommended Additions
- [ ] Rate limiting on `/api/evaluate-batch` endpoint
- [ ] API key validation for Gemini calls
- [ ] CORS configuration for production domains
- [ ] Signed URLs for game share links

## Environment Variables

Ensure these are stored securely:
- `GOOGLE_GENERATIVE_AI_API_KEY` - Never expose in client code
- `NEXT_PUBLIC_SUPABASE_URL` - OK to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - OK to expose (limited scoped key)

## Audit Checklist

- [ ] RLS enabled on `user_games` table
- [ ] RLS policies tested with multiple users
- [ ] Environment variables configured in Cloudflare/deployment
- [ ] API routes validate auth tokens
- [ ] No sensitive data logged to console
- [ ] Vault operations check user ownership
