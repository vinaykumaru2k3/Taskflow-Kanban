# TaskFlow - Kanban Board

A modern, feature-rich Kanban board application built with React, Firebase, and Tailwind CSS.

## Features

- 🎯 Drag-and-drop task management
- 🔥 Real-time Firebase synchronization
- 🌙 Dark mode support
- 📊 Task statistics and analytics
- ✅ Subtask checklists
- 🔍 Search functionality
- 📅 Due date tracking
- 🎨 Priority levels

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Update the Firebase configuration in `src/App.jsx`
   - Replace `__firebase_config`, `__app_id`, and `__initial_auth_token` with your actual values

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
kanban/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index_new.html       # HTML template
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## Technologies

- React 18
- Firebase (Firestore & Auth)
- Tailwind CSS
- Vite
- Lucide React (icons)
