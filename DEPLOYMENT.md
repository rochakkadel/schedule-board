# Deployment Guide for GitHub Pages

This app uses Firebase and requires environment variables to be set in GitHub Secrets for deployment.

## Setting up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets (one for each Firebase config value):

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

5. Get these values from your Firebase project console:
   - Go to Firebase Console → Project Settings → General
   - Scroll down to "Your apps" section
   - Copy the values from your Firebase config object

## Enabling GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
3. The GitHub Actions workflow will automatically deploy when you push to the `main` branch

## Local Development

1. Create a `.env.local` file in the root directory
2. Add your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

3. Run `npm run dev` to start the development server

## Troubleshooting

If the app shows "Loading Week Data..." indefinitely:
- Check that all GitHub Secrets are set correctly
- Check the GitHub Actions workflow logs for build errors
- Verify Firebase project settings and Firestore rules allow anonymous access

