# Git Push Commands

Follow these steps to push your code to GitHub.

## Step 1: Initialize Git (if not already done)

```bash
git init
```

## Step 2: Add Remote Repository

```bash
git remote add origin https://github.com/arsbux/atomic-labs.git
```

If you get an error that remote already exists, remove it first:
```bash
git remote remove origin
git remote add origin https://github.com/arsbux/atomic-labs.git
```

## Step 3: Add All Files

```bash
git add .
```

## Step 4: Commit Changes

```bash
git commit -m "Initial commit: Atomic Labs website with tracking and admin dashboard"
```

## Step 5: Push to GitHub

If this is the first push:
```bash
git branch -M main
git push -u origin main
```

If the repository already exists and you want to force push:
```bash
git push -f origin main
```

## Step 6: Verify

Go to https://github.com/arsbux/atomic-labs and verify your files are there.

---

## Alternative: Push with Detailed Commit Message

```bash
git add .
git commit -m "feat: Complete Atomic Labs website

- Add home page with hero, programs, and CTAs
- Add program pages (Vibe Coding, Maker Robotics, Product Launch Lab)
- Implement visitor tracking with Supabase
- Add admin dashboard with Google Trends-like charts
- Add responsive design for all devices
- Include comprehensive documentation
- Add troubleshooting guides and setup instructions"

git push -u origin main
```

---

## Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/arsbux/atomic-labs.git
```

### Error: "failed to push some refs"
```bash
git pull origin main --rebase
git push origin main
```

Or force push (⚠️ this will overwrite remote):
```bash
git push -f origin main
```

### Error: "Permission denied"
Make sure you're authenticated with GitHub:
```bash
# Using HTTPS (will prompt for credentials)
git remote set-url origin https://github.com/arsbux/atomic-labs.git

# Or using SSH (if you have SSH keys set up)
git remote set-url origin git@github.com:arsbux/atomic-labs.git
```

---

## Quick Commands (Copy & Paste)

```bash
# Initialize and push
git init
git remote add origin https://github.com/arsbux/atomic-labs.git
git add .
git commit -m "Initial commit: Atomic Labs website"
git branch -M main
git push -u origin main
```

---

## After Pushing

1. ✅ Go to https://github.com/arsbux/atomic-labs
2. ✅ Verify all files are there
3. ✅ Check that README.md displays correctly
4. ✅ Set up GitHub Pages (optional):
   - Go to Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save
5. ✅ Your site will be live at: https://arsbux.github.io/atomic-labs/

---

## Future Updates

To push future changes:

```bash
git add .
git commit -m "Description of changes"
git push origin main
```
