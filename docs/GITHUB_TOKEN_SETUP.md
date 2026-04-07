# GitHub Token Setup Guide

## Step 1: Create Personal Access Token on GitHub

### 1.1 Go to GitHub Settings
1. Go to: **https://github.com/settings/tokens/new**
   (Or: GitHub Profile > Settings > Developer settings > Personal access tokens > Tokens (classic) > Generate new token)

### 1.2 Fill in Token Details
- **Note:** `zynk-play-push` (or any name you want)
- **Expiration:** 90 days (or your preference)
- **Select scopes:** Check `repo` ✅
  - This gives full control of private repositories

### 1.3 Generate & Copy Token
- Click **"Generate token"**
- **COPY the token immediately** (you won't see it again!)
- Store it somewhere safe temporarily

**⚠️ IMPORTANT:** This token is like your password - keep it secret!

---

## Step 2: Configure Git to Use Token

### Option A: Store Token in Git Credential Manager (Recommended for Windows)

#### On Windows 10/11:
```cmd
cd d:\Projects\zynk-play
git push origin main
```

When prompted:
- **Username:** Your GitHub username
- **Password:** Paste your token (not your actual password)

Windows will ask to save credentials → Select **"Save"**

#### Next time you push, it will use the saved credentials automatically.

---

### Option B: Update Remote URL with Token (Not Recommended - Less Secure)

⚠️ **Only use this if Option A doesn't work**

```cmd
cd d:\Projects\zynk-play
git remote set-url origin https://YOUR_GITHUB_USERNAME:YOUR_TOKEN@github.com/tech-internal/zynk-play.git
git push origin main
```

**Replace:**
- `YOUR_GITHUB_USERNAME` - Your GitHub username
- `YOUR_TOKEN` - The token you just copied

**Example:**
```cmd
git remote set-url origin https://arunvaish:ghp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7@github.com/tech-internal/zynk-play.git
```

Then push:
```cmd
git push origin main
```

---

### Option C: Use SSH Key (Most Secure - Advanced)

See GitHub docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

## Step 3: Verify Token Works

After setting up token, test the connection:

```cmd
cd d:\Projects\zynk-play

# Test connection
git remote -v

# Try pushing
git push origin main
```

If successful, you'll see:
```
Pushing to https://github.com/tech-internal/zynk-play.git
 * [new branch]      main -> main
```

---

## Troubleshooting

### Error: "remote: Permission denied"
- ❌ Token doesn't have `repo` scope
- ✅ Solution: Create new token with `repo` scope

### Error: "Authentication failed"
- ❌ Token is wrong or expired
- ✅ Solution: Check token spelling, or create new one

### Error: "Not a member of organization"
- ❌ Your account isn't added to `tech-internal` organization
- ✅ Solution: Ask organization owner to add you

### Token stored but still asking for password
- Clear old credentials first:
```cmd
# Windows
rundll32.exe keymgr.dll RunDLL_KeyMgr
# Then remove GitHub credentials

# Or use Git Credential Manager
git config --global credential.helper manager
```

---

## Quick Reference

### Create Token
👉 https://github.com/settings/tokens/new

### Manage Tokens
👉 https://github.com/settings/tokens

### Revoke Token
👉 https://github.com/settings/tokens
- Click "Delete" next to the token

---

## After Pushing Successfully

Delete the temporary token from clipboard:
```cmd
# Clear clipboard on Windows
type nul | clip
```

Then verify push was successful:
```cmd
# Check GitHub repo branches
# Go to: https://github.com/tech-internal/zynk-play

# Or check locally
git log --oneline -5
git branch -v
```

---

## Next Steps

Once token is configured and push succeeds:

1. ✅ Verify branches on GitHub
2. ✅ Set up branch protection rules (optional)
3. ✅ Configure CI/CD (optional)
4. ✅ Share repo link with team

---

## Common Git Commands with Token

```bash
# Check remote
git remote -v

# Change remote URL (if needed)
git remote set-url origin https://github.com/tech-internal/zynk-play.git

# Push all branches
git push origin --all

# Push specific branch
git push origin main
git push origin feature/professional-structure

# Pull latest changes
git pull origin main

# Check status
git status
```

---

**Questions?** Check: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
