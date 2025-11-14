# Schedule Board — Legal & Technical Overview


## Overview

Schedule Board is a web-based scheduling application built with React and Firebase. It enables teams to manage work shifts, assign staff to locations, and coordinate weekly schedules through an interactive calendar interface.

## Ownership

All source code, design elements, and documentation are owned by Rochak Kadel. Third-party libraries and frameworks are used under their respective open-source licenses as specified in package.json.

## Data Handling

The application stores schedule data, user profiles, and comments in Firebase Firestore. User authentication uses Firebase's anonymous authentication by default, though custom authentication can be configured.

Data is encrypted in transit and at rest by Firebase. User profiles are cached locally for offline functionality.

## Features

- Weekly calendar view for shift management
- Color-coded shifts with time ranges and site assignments
- Comments and notes for daily and shift-level communication
- Access control via access codes
- Real-time synchronization across users
- Offline functionality with local storage
- Leaderboard tracking shift assignments

## Technology

- Frontend: React 18
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Build tool: Vite
- Styling: Custom CSS with Tailwind

## Licensing

This software is proprietary and closed-source. Redistribution, public hosting, or commercial use requires written authorization from the owner. Contact rochakrajkadel@gmail.com for licensing inquiries.

## Support

For questions or support requests, contact rochakrajkadel@gmail.com

## Disclaimer

This software is provided "as is" without warranty. The developer is not liable for data loss, downtime, or compliance issues resulting from deployment or configuration. Organizations should not rely solely on this application for safety-critical scheduling without appropriate redundancy and backup systems.
