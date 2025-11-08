# Schedule Board

A scheduling application built with React, Vite, Firebase, and Tailwind CSS.

## Features

- Weekly schedule view with day-by-day columns
- Add, edit, and delete shifts
- Color coding for shifts
- Comments and notes
- Firebase real-time synchronization
- User authentication with access codes

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Firebase project

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to GitHub Pages.

**Quick Setup:**
1. Set up GitHub Secrets with your Firebase environment variables
2. Enable GitHub Pages with GitHub Actions as the source
3. Push to the `main` branch - deployment happens automatically

## Technologies

- React 19
- Vite
- Firebase (Firestore, Auth)
- Tailwind CSS
- ESLint
