# TaskFlow - Kanban Task Management App

<div align="center">
  <img src="https://github.com/user-attachments/assets/7ef17f9f-690b-433c-8001-29aa5db4326f" alt="TaskFlow Kanban Board" width="800"/>
  <br><br>
  <img src="https://github.com/user-attachments/assets/473c6465-5ea5-446f-9a29-bb4c6118b4a2" alt="TaskFlow Dashboard" width="800"/>
</div>

> A modern, beautiful Kanban task management app built with **React + Firebase**. Features drag-and-drop, subtasks, priorities, and real-time sync.
> 
## ✨ [Live Demo](#live-demo) | [Quick Start](#quick-start) | [Contributing](#contributing)

## 🚀 Live Demo

| Environment | URL |
|-------------|-----|
| **Production** | [ |
| **Staging** | [ |

## ✨ Features

### 🎯 Core Functionality
- **Kanban Board** - 4 columns: To Do → In Progress → Review → Done
- **Drag & Drop** - Smooth reordering powered by [dnd-kit](https://dndkit.com)
- **Task CRUD** - Create, edit, delete with inline editing
- **Subtasks** - Nested checklists with progress tracking
- **Priorities** - Low/Medium/High/Urgent color-coded
- **Due Dates** - Date picker with overdue highlighting
- **Search** - Real-time filtering by title/description

### 🎨 User Experience
- **Dark/Light Mode** - Auto-detect + manual toggle
- **Real-time Sync** - Instant updates across devices
- **Statistics** - Completion rates, productivity trends
- **Google Auth** - Secure OAuth2 login

### 📱 Modern UI/UX
- Gradient glassmorphism design
- Framer Motion animations
- Fully responsive (mobile-first)
- Lucide React icons

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18.2, Vite 5.0 |
| Styling | Tailwind CSS 3.3 |
| State | React Context + Hooks |
| Drag & Drop | [dnd-kit](https://dndkit.com) 6.0 |
| Backend | Firebase Auth/Firestore/Hosting |
| Icons | [Lucide React](https://lucide.dev) |
| Testing | Vitest + Playwright |
| Deployment | Firebase Hosting + GitHub Actions |

## 🏁 Quick Start for Contributors

### Option 1: UI/UX Only (No Firebase needed - 2 minutes) ⭐ **RECOMMENDED**

Perfect for design, components, animations, bug fixes.

```bash
git clone https://github.com/vinaykumaru2k3/Taskflow-Kanban.git
cd Taskflow-Kanban
npm install
cp .env.example .env
echo "VITE_USE_MOCK_DATA=true" >> .env
npm run dev
```

✅ **Mock data loads instantly. No accounts needed!**

### Option 2: Full Firebase Setup (Backend features)

For auth, database, real-time sync contributions.

1. Complete **Option 1 steps 1-2**
2. [Firebase Console](https://console.firebase.google.com/) → New Project → "TaskFlow-Dev-[YourName]"
3. **Enable**: Google Auth + Firestore (test mode, closest region)
4. **Copy config** from Project Settings → Your Apps → `</>` (web icon):
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
VITE_USE_MOCK_DATA=false
```
5. `npm run dev`

## 📁 Project Structure

```
taskflow-kanban/
├── .github/workflows/deploy.yml     # CI/CD pipeline
├── src/
│   ├── components/                  # Reusable UI components
│   ├── contexts/                    # AuthContext, ThemeContext
│   ├── hooks/                       # useTasks, useAuth, useDrag
│   ├── services/                    # firebase.js, mockData.js, auth.js
│   ├── utils/                       # date utils, validation
│   ├── App.jsx                      # Main app
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── tests/e2e.spec.js                # Playwright E2E tests
├── .env.example                     # Env template
├── tailwind.config.js
├── vite.config.js
├── package.json
└── playwright.config.js
```

## 🔥 Firebase Schema

```
users/{userId}/
├── profile/                    # displayName, email, photoURL, createdAt
└── tasks/{taskId}/
    ├── title, description
    ├── priority: "low|medium|high|urgent"
    ├── status: "todo|in-progress|review|done"
    ├── dueDate: timestamp|null
    ├── subtasks[]: {text, completed}
    ├── tags[], createdAt, updatedAt
```

**Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing

```bash
# Unit tests (Vitest)
npm test
npm run test:coverage
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e
npm run test:e2e -- tests/e2e/auth.spec.js  # Specific file
```

**Mock Mode** (`VITE_USE_MOCK_DATA=true`): No network requests, deterministic, fast.

## 🚀 Deployment

**Automatic**: Push to `main` → GitHub Actions deploys to Firebase Hosting

**Manual**:
```bash
npm run build
npm run deploy
```

## 🤝 Contributing

⭐ **Star this repo** if you find it helpful!

### 🎯 Good First Issues
- [
- [

### Contribution Workflow
```bash
git checkout -b feat/add-task-analytics  # or fix/bug-description
# Make changes
npm test && npm run test:e2e
git commit -m "feat: add task analytics dashboard"
git push origin feat/add-task-analytics
```

**PR Requirements**:
- [ ] Tests pass
- [ ] `npm run lint` clean
- [ ] Screenshots for UI changes
- [ ] References issue: `Fixes #123`

### Code Standards
```
✅ DO:
- Tailwind utility classes only
- Functional components + hooks
- Conventional Commits (feat:, fix:, docs:)
- >70% test coverage for new features

❌ DON'T:
- Custom CSS (use Tailwind)
- Console.logs in commits
- Breaking changes without tests
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (localhost:5173) |
| `npm run build` | Production build |
| `npm run preview` | Local preview of production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix linting |
| `npm run format` | Prettier format |
| `npm run deploy` | Build + Firebase deploy |

## ❓ FAQ / Troubleshooting

| Issue | Solution |
|-------|----------|
| `Firebase config not found` | `.env` vars must start with `VITE_`, restart dev server |
| `Permission denied` (Firestore) | Enable test mode rules + Google login |
| Mock data not loading | `VITE_USE_MOCK_DATA=true` + `Ctrl+F5` hard refresh |
| E2E tests fail | `npx playwright install` |
| `npm run dev` slow | Disable browser extensions, check `vite.config.js` |

## 🔒 Security
- ✅ `.env` in `.gitignore`
- ✅ Firebase client keys safe for web apps
- 🔒 Report vulnerabilities privately to maintainers

## 📄 License
[

## 🙏 Acknowledgments
- [Firebase](https://firebase.google.com) - Backend services
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [dnd-kit](https://dndkit.com) - Drag & drop
- [Lucide React](https://lucide.dev) - Icons
- [Vite](https://vitejs.dev) - Build tool

<div align="center">
Built with ❤️ by <a href="https://github.com/vinaykumaru2k3"><b>Vinay Kumar U</b></a><br>
<img src="https://img.shields.io/badge/Happy_Contributing%21-FF6B6B?style=for-the-badge&logo=heart" alt="Happy Contributing">
</div>

***

## 📎 Required Setup Files

### 1. `.env.example`
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

# Development Mode
VITE_USE_MOCK_DATA=true
```

### 2. `src/services/mockData.js`
```javascript
// Mock data for UI contributors (no Firebase needed)
export const mockUser = {
  uid: 'demo-user-123',
  displayName: 'Demo Contributor',
  email: 'demo@example.com',
  photoURL: 'https://ui-avatars.com/api/?name=Demo+Contributor&background=random'
};

export const mockTasks = [
  {
    id: 'task-1',
    title: 'Welcome to TaskFlow! 🎉',
    description: 'Try dragging this task between columns',
    priority: 'high',
    status: 'todo',
    subtasks: [
      { text: 'Explore the board', completed: true },
      { text: 'Try dark mode toggle', completed: false }
    ]
  },
  {
    id: 'task-2',
    title: 'Make your first contribution',
    description: 'Check "good first issue" label',
    priority: 'medium',
    status: 'in-progress'
  }
];

// Mock Firebase services for UI development
export const mockAuth = { /* full implementation */ };
export const mockFirestore = { /* full implementation */ };
```

### 3. `.gitignore` (essential additions)
```
# Environment
.env
.env.local
.env.*.local

# Firebase
.firebase/
*.log

# Testing
coverage/
test-results/
playwright-report/

# Build
dist/
```

***

**Ready for contributors!** 🚀 **Start with Option 1** - works instantly!
