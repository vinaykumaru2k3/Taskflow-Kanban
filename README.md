# TaskFlow - Kanban Task Management App

> A modern, beautiful Kanban task management app built with **React + Firebase**. Features drag-and-drop, full mobile PWA support, collaborative boards, data visualizations, and real-time sync.

## Features

### Core Experience
- **Kanban Board** - 4 columns: To Do → In Progress → Review → Done
- **Drag & Drop** - Smooth reordering on desktop (HTML5) and mobile (Touch-optimized Pointer events)
- **Task CRUD** - Rich task editing with nested subtasks, comments, priorities, and deadlines
- **Views** - Toggle between Kanban Board, Calendar View, and Workflow Tree Visualizations
- **Search & Filter** - Real-time filtering by text, tags, priority, or completion status

### Mobile & PWA
- **Progressive Web App (PWA)** - Installable to home screen on iOS and Android
- **Offline Mode** - View and interaction capabilities even when network is down (caches sync automatically when back online)
- **Touch-Optimized UI** - Swipeable column carousel, custom long-press Drag and Drop, fixed bottom navigation, and mobile sidebar drawer
- **Standalone Experience** - Custom app icons, splash screens, and native-feeling interface

### Collaboration & Real-Time Sync
- **Shared Boards** - Invite team members via email to collaborate on your boards
- **Role-Based Access** - Owner, Editor, and Viewer permissions per board
- **Notifications** - Real-time alerts for board invitations and task assignments
- **Task Comments** - Real-time chat threads inside individual tasks
- **Instant Sync** - Changes pushed instantly to all connected users via Firestore

### Modern UI/UX
- **Dark/Light Mode** - Hand-crafted frosted glassmorphism designs with dynamic responsive gradients
- **Animations** - Micro-interactions powered by CSS and Framer Motion
- **SaaS Polish** - Custom-styled, animated toast notifications, modal dialogs, empty states, and contextual banners
- **Autocomplete Multi-Select** - Searchable tag autocomplete widget for editing task dependencies, replacing legacy select inputs.

### Data Safety & Integrity (New)
- **Cascading Board Deletes** - Safely removes all associated tasks, comments, collaborator members, and sharing references when deleting a board.
- **Dependency Cycle Guard** - Detects and prevents circular dependencies (e.g. Task A blocking Task B and vice-versa) to secure Workflow visualizations.
- **Non-blocking Dialogs** - Replaced all thread-blocking browser `alert()` popups with global UI toast alerts.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18.2, Vite 5.0 |
| PWA support | vite-plugin-pwa (Workbox) |
| Styling | Tailwind CSS 3.3 |
| State | React Context + Hooks |
| Backend | Firebase Auth, Firestore |
| Icons | Lucide React |

## Quick Start for Contributors

### Local Setup

```bash
git clone https://github.com/vinaykumaru2k3/Taskflow-Kanban.git
cd Taskflow-Kanban
npm install
```

### Firebase Setup (Required for Collaboration Features)

1. [Firebase Console](https://console.firebase.google.com/) → New Project
2. **Enable**: Google Auth + Firestore (Test Mode is fine for development)
3. **Copy config** from Project Settings → Your Apps → `</>` (web icon)
4. Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```
5. Run the dev server:
```bash
npm run dev
```

*Note: The PWA features (Service workers, offline caching) are fully functional in production builds (`npm run build && npm run preview`), and available in Dev mode via Vite's virtual module injection.*

## Project Structure

```
taskflow-kanban/
├── public/
│   ├── icons/                       # PWA masks & icons
│   └── manifest.json                # PWA manifest
├── src/
│   ├── components/                  # Reusable UI (Sidebar, KanbanBoard, MobileNav, PWABanners...)
│   │   └── modals/                  # Specific custom modals (TaskModal, BoardModal, DeleteBoardModal)
│   ├── hooks/                       # Custom hooks (useTasks, useAuth, usePWA, useTouchDnd...)
│   ├── lib/                         # Permissions and logic helpers
│   ├── utils/                       # Constants, date formatters
│   ├── App.jsx                      # Main app shell & router
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Tailwind + base styles
├── .env.example                     # Env template
├── tailwind.config.js               # Utility design tokens
├── vite.config.js                   # Build, dev & PWA Plugin config
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (localhost:3000) |
| `npm run build` | Production build |
| `npm run preview` | Local preview of the production build |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix linting issues |

## Security Rules (Firestore)

To deploy to your own Firebase project securely, ensure your Firestore rules are configured correctly to support shared boards:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Main boards
    match /boards/{boardId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && (
        resource.data.ownerId == request.auth.uid ||
        request.auth.uid in resource.data.collaborators
      );
    }
  }
}
```

## 📄 License
This project is licensed under the GNU GPL-3.0 License © 2026 Vinay Kumar

See the [LICENSE](LICENSE) file for details.
