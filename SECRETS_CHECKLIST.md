# GitHub Secrets Checklist

## Copy This Exact List When Adding Secrets

When adding secrets in GitHub, use these **EXACT names** (copy-paste to avoid typos):

### ✅ Secret Names (Must Match Exactly)

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_PROJECT_ID`
4. `VITE_FIREBASE_STORAGE_BUCKET`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. `VITE_FIREBASE_APP_ID`
7. `VITE_FIREBASE_MEASUREMENT_ID`

---

## Step-by-Step Process

For each secret:

1. **Click "New repository secret"**
2. **Name:** Copy the name from the list above (e.g., `VITE_FIREBASE_API_KEY`)
3. **Value:** Paste the corresponding value from Firebase Console
4. **Click "Add secret"**
5. **Repeat** for all 7 secrets

---

## Firebase Value Mapping

From your Firebase config object:

| Secret Name | Firebase Config Property |
|-------------|-------------------------|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `measurementId` |

---

## Verification

After adding all 7 secrets, check that they appear in your GitHub repository:
- Go to: Settings → Secrets and variables → Actions
- You should see all 7 secrets listed
- ✅ Each name should match exactly (case-sensitive!)

---

## Common Mistakes to Avoid

❌ **Wrong:** `vite_firebase_api_key` (lowercase)  
✅ **Correct:** `VITE_FIREBASE_API_KEY` (uppercase)

❌ **Wrong:** `VITE-FIREBASE-API-KEY` (hyphens)  
✅ **Correct:** `VITE_FIREBASE_API_KEY` (underscores)

❌ **Wrong:** `FIREBASE_API_KEY` (missing VITE_ prefix)  
✅ **Correct:** `VITE_FIREBASE_API_KEY` (with VITE_ prefix)

