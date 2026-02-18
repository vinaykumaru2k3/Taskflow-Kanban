# Deployment Guide

## Setup

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Install dependencies:**
```bash
npm install
```

## Testing

**Run unit tests:**
```bash
npm test
```

**Run E2E tests:**
```bash
npm run test:e2e
```

## Deploy to Firebase

**Manual deployment:**
```bash
npm run deploy
```

## GitHub Actions CI/CD

The workflow automatically:
- Runs tests on every push/PR
- Deploys to Firebase Hosting on main branch

**Setup GitHub Secrets:**
1. Go to repository Settings → Secrets
2. Add `FIREBASE_SERVICE_ACCOUNT`:
   - Run: `firebase login:ci`
   - Copy the token
   - Add as secret

## Firebase Hosting URL
Your app will be live at: `https://taskflow-app-f6474.web.app`
