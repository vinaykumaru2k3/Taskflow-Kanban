# TaskFlow - Kanban Task Management App

A modern, beautiful Kanban task management application built with React and Firebase. Manage your tasks with drag-and-drop functionality, subtasks, priorities, and real-time synchronization.

![TaskFlow](https://img.shields.io/badge/Version-2.5.0-blue) ![React](https://img.shields.io/badge/React-18.2-green) ![Firebase](https://img.shields.io/badge/Firebase-10.7-orange)

## Features

### Core Functionality
- **Kanban Board** - Four columns: To Do, In Progress, Review, Done
- **Drag & Drop** - Move tasks between columns seamlessly
- **Task Management** - Create, edit, and delete tasks
- **Subtasks** - Break down tasks into checkable subtasks
- **Priority Levels** - Low, Medium, High, Urgent
- **Due Dates** - Set deadlines with date picker
- **Search** - Filter tasks by title or description

### User Experience
- **Dark/Light Mode** - Toggle between themes
- **Real-time Sync** - Data syncs instantly across devices
- **Statistics Dashboard** - View task analytics
- **Google Sign-In** - Secure authentication with Google

### Modern UI
- Beautiful gradient design
- Smooth animations and transitions
- Responsive layout (mobile, tablet, desktop)
- Custom icons from Lucide React

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18.2, Vite 5 |
| Styling | Tailwind CSS 3.3 |
| Backend | Firebase (Auth, Firestore, Hosting) |
| Icons | Lucide React |
| Testing | Vitest, Playwright |
| Build | Vite |

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Account (for Firebase)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/taskflow-kanban.git
   cd taskflow-kanban
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** → Sign-in method → Google
   - Enable **Firestore Database**
   - Copy your Firebase config to `src/App.jsx`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
taskflow-kanban/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD pipeline
├── src/
│   ├── App.jsx                 # Main application component
│   ├── App.test.jsx            # Unit tests
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles
│   └── setupTests.js           # Test setup
├── tests/
│   └── e2e.spec.js             # End-to-end tests
├── index.html                  # HTML template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Vitest configuration
└── playwright.config.js        # Playwright configuration
```

## Firebase Configuration

The app uses the following Firebase services:

### Authentication
- **Provider**: Google Sign-In
- **Session**: Persisted via IndexedDB

### Firestore Database
Tasks are stored with this structure:
```
users/
  {userId}/
    tasks/
      {taskId}/
        title: string
        description: string
        priority: "low" | "medium" | "high" | "urgent"
        status: "todo" | "in-progress" | "review" | "done"
        dueDate: string | null
        subtasks: array
        createdAt: timestamp
        updatedAt: timestamp
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run deploy` | Build and deploy to Firebase |

## Deployment

### Deploy to Firebase Hosting
```bash
npm run deploy
```

The app is automatically deployed via GitHub Actions on push to main branch.

### Live URLs
- https://taskflow-app-f6474.web.app
- https://taskflow-app-f6474.firebaseapp.com

## Development

### Running Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e
```

### Environment Variables
No environment variables required - Firebase config is embedded in the code for client-side Firebase SDK.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and for personal use.

## Acknowledgments

- [Firebase](https://firebase.google.com) - Backend services
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide](https://lucide.dev) - Icons
- [Vite](https://vitejs.dev) - Build tool

---

Built with React & Firebase
