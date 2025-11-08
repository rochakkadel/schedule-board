# Step-by-Step Guide: Setting Up GitHub Secrets

## Why We Need This

Your app uses Firebase to store schedule data. Firebase requires configuration values (like API keys) to connect. 

**The Problem:** When you deploy to GitHub Pages, the server doesn't have access to your `.env.local` file (which contains your Firebase config). 

**The Solution:** We store these values as "Secrets" in GitHub, and GitHub Actions uses them when building your app for deployment.

---

## Step 1: Get Your Firebase Configuration Values

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project (or create one if you don't have one)

2. **Find Your Config:**
   - Click the ⚙️ (gear icon) next to "Project Overview" → **Project Settings**
   - Scroll down to the **"Your apps"** section
   - If you don't have a web app yet, click **"Add app"** → Select the **Web icon (</>)** → Register your app
   - You'll see a config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-example-key-12345",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

3. **Copy these values** - you'll need them in the next step!

---

## Step 2: Add Secrets to GitHub (ONE AT A TIME)

1. **Go to your GitHub repository:**
   - Visit: `https://github.com/xxxrkxxxrkxxx-ui/schedule-board`

2. **Navigate to Secrets:**
   - Click **Settings** (top menu)
   - In the left sidebar, click **Secrets and variables** → **Actions**
   - Click **"New repository secret"** button

3. **Add Each Secret Separately:**
   
   **Secret #1:**
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: (paste the `apiKey` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #2:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`
   - Value: (paste the `authDomain` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #3:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_PROJECT_ID`
   - Value: (paste the `projectId` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #4:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_STORAGE_BUCKET`
   - Value: (paste the `storageBucket` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #5:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - Value: (paste the `messagingSenderId` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #6:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_APP_ID`
   - Value: (paste the `appId` value from Firebase)
   - Click **"Add secret"**
   
   **Secret #7:**
   - Click **"New repository secret"** again
   - Name: `VITE_FIREBASE_MEASUREMENT_ID`
   - Value: (paste the `measurementId` value from Firebase)
   - Click **"Add secret"**

**Important:** You must add them **ONE AT A TIME**. GitHub doesn't let you add multiple secrets in one form.

---

## Step 3: Verify Secrets Are Added

After adding all 7 secrets, you should see them listed on the Secrets page:
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID
- ✅ VITE_FIREBASE_MEASUREMENT_ID

---

## Step 4: Enable GitHub Pages

1. **Go to Settings → Pages:**
   - In your repository, click **Settings**
   - Click **Pages** in the left sidebar

2. **Select Source:**
   - Under **"Source"**, select **"GitHub Actions"** (NOT "Deploy from a branch")
   - This tells GitHub to use our workflow file for deployment

---

## Step 5: Trigger Deployment

After adding all secrets, the deployment will automatically trigger on the next push, OR:

1. Go to the **Actions** tab in your repository
2. Find the **"Build and Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button

---

## Troubleshooting

**"Loading Week Data..." forever?**
- Check that all 7 secrets are added correctly
- Check the Actions tab for build errors
- Verify Firebase project has Firestore enabled

**Build failing?**
- Check the Actions tab logs
- Make sure secret names match exactly (case-sensitive!)
- Make sure Firebase project is active and Firestore is enabled

---

## Visual Guide

Here's what the Firebase config looks like in Firebase Console:

```
Firebase Console → Your Project → Project Settings → General
↓
Scroll to "Your apps" section
↓
Click on your Web app (or create one)
↓
You'll see:

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIza...",           ← Copy this
  authDomain: "...",            ← Copy this
  projectId: "...",             ← Copy this
  storageBucket: "...",         ← Copy this
  messagingSenderId: "...",     ← Copy this
  appId: "...",                 ← Copy this
  measurementId: "G-..."        ← Copy this (if available)
};
```

Copy each value and paste it into the corresponding GitHub Secret!

