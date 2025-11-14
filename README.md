# Schedule Board

A web-based scheduling application for managing work shifts and team schedules. Built with React and Firebase.

## Features

- **Weekly Calendar View** - See and manage shifts for the entire week in one view
- **Shift Management** - Create, edit, and delete shifts with time ranges and site assignments
- **Color Coding** - Organize shifts with custom colors and preset statuses (Complete, OPS)
- **Comments & Notes** - Add comments to individual shifts or notes for each day
- **Access Control** - View-only by default, editing requires an access code
- **Real-time Sync** - Changes sync instantly across all users
- **Offline Support** - Works offline with local storage caching
- **Leaderboard** - Track who's working the most shifts
- **User Management** - View registered users and manage access levels

## Technologies

- **React 18** - Frontend framework
- **Firebase Firestore** - Real-time database
- **Firebase Auth** - User authentication
- **Vite** - Build tool
- **CSS/Tailwind** - Styling

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rochakkadel/schedule-board.git
cd schedule-board
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. Run the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## How to Use

### First Time Setup

1. Click the **LOGIN** button in the header
2. Enter your first name, last name, and access code (if provided by your administrator)
3. Your profile will be saved for future sessions

### Navigating the Schedule

- Use the **<** and **>** buttons to move between weeks
- Click **This Week** to jump to the current week
- Click the calendar icon to pick a specific date
- Scroll horizontally to see all days of the week

### Creating Shifts

1. Click the **+** button at the bottom of any day column
2. Enter the site name (autocomplete suggestions will appear)
3. Enter start time and end time in 24-hour format (e.g., 0700, 1500)
4. Click **Add Shift**

### Editing Shifts

- **Right-click** any shift to open the context menu:
  - **Complete** - Mark shift as complete (green)
  - **OPS** - Mark as operations shift (blue)
  - **Change Colors** - Customize background and text colors
  - **Comment** - Add comments to the shift
  - **Copy Shift** - Copy shift details to clipboard
  - **Edit Shift** - Modify shift details
  - **Delete Shift** - Remove the shift

- **Double-click** a shift to add or view comments

### Adding Notes

1. Click the **📄** note button at the bottom of any day column
2. Type your note in the modal
3. Notes are visible to all users and include timestamps

### Viewing Users

- Admins can click the gear icon next to their avatar
- This opens a modal showing all registered users with their roles and access levels

## Building for Production

```bash
npm run build
```

This creates a production-ready build in the `dist` folder that can be deployed to any static hosting service.

## License

This software is proprietary and closed-source. For licensing inquiries, contact rochakrajkadel@gmail.com

## Support

For questions or issues, email rochakrajkadel@gmail.com
