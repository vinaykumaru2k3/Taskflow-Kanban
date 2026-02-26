
---

# Contributing to Taskflow-Kanban

First off, thank you for taking the time to contribute! 🎉

**Taskflow-Kanban** is a performance-first, responsive Kanban board designed to streamline task management. We aim for a seamless user experience with robust drag-and-drop capabilities across **To Do**, **In Progress**, **Review**, and **Done** columns.

---

## 📑 Table of Contents

* [Code of Conduct](https://www.google.com/search?q=%23-code-of-conduct)
* [Getting Started](https://www.google.com/search?q=%23-getting-started)
* [Development Workflow](https://www.google.com/search?q=%23-development-workflow)
* [Tech Stack](https://www.google.com/search?q=%23-tech-stack)
* [Contribution Guidelines](https://www.google.com/search?q=%23-contribution-guidelines)
* [Pull Request Process](https://www.google.com/search?q=%23-pull-request-process)

---

## 🤝 Code of Conduct

We are committed to fostering a welcoming environment. By participating in this project, you agree to:

* Use welcoming and inclusive language.
* Be respectful of differing viewpoints and experiences.
* Gracefully accept constructive criticism.
* Focus on what is best for the community.

---

## 🚀 Getting Started

### 1. Find an Issue

Check the [Issues](https://www.google.com/search?q=https://github.com/vinaykumaru2k3/Taskflow-Kanban/issues) tab. If you are a first-time contributor, look for the `good first issue` label.

### 2. Fork & Clone

1. Fork the repository to your own GitHub account.
2. Clone the fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/Taskflow-Kanban.git

```



### 3. Branching

Create a branch for your work using a descriptive name:

* `feature/your-feature-name`
* `fix/bug-description`
* `docs/update-info`

---

## 🛠 Development Workflow

### Prerequisites

* **Node.js**: 18.x or higher
* **npm** or **pnpm**

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to see your changes in real-time.

### Testing

Before submitting a PR, ensure all tests pass:

```bash
npm test

```

---

## 💻 Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Drag & Drop** | @dnd-kit/core |
| **State Management** | Zustand |
| **Icons** | Lucide React / React Icons |

---

## 📝 Contribution Guidelines

### Our Philosophy

* **Mobile-First:** Touch targets for drag-and-drop must be intuitive.
* **Performance:** Zero "jank" during transitions; instant board loading.
* **Clean Code:** Follow the existing React/TypeScript patterns.

### Commit Messages

We use the [Conventional Commits](https://www.google.com/search?q=https://www.conventionalcommits.org/) format:

* `feat:` for new features.
* `fix:` for bug fixes.
* `docs:` for documentation changes.
* `style:` for formatting (no logic changes).

> **Example:** `feat: add subtask checklist to TaskCard`

---

## 📤 Pull Request Process

1. **Sync:** Ensure your fork is up to date with the `main` branch.
2. **Quality Check:** * No console logs or debuggers left in code.
* Responsive design verified (320px to Desktop).
* TypeScript types are explicitly defined (avoid `any`).


3. **Description:** Explain *what* you changed and *why*. Include screenshots if you modified the UI.
4. **Review:** At least one maintainer must approve the PR before merging.

---

## 🤖 AI-Assisted Contributions

We welcome contributions assisted by AI (GitHub Copilot, ChatGPT, etc.). However:

* **Verify:** You are responsible for the logic. Ensure the AI hasn't introduced security flaws or "hallucinated" libraries.
* **Explain:** Be prepared to explain how the code works during the PR review.

---

