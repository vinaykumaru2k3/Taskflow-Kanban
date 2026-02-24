# Team Collaboration Feature - Implementation Plan

## 1. Information Gathered

### Current State:
- **Data Model**: User-centric (each user has their own boards/tasks in Firestore)
- **Authentication**: Firebase Auth (Google + Email/Password)
- **Empty directories**: `collaboration/`, `comments/`, `notifications/`, `task/` (ready for new components)
- **Main files to modify**: `App.jsx`, `useBoards.js`, `useTasks.js`, `TaskCard.jsx`, `Sidebar.jsx`, `Header.jsx`

### Key Constraint:
- **DO NOT modify existing data model** - add a sharing layer on top
- Existing users should NOT lose their current data

---

## 2. New Firestore Data Model (Sharing Layer)

```
users/{uid}/
  sharedWithMe/          # Boards shared with this user
    {boardId}: { role, addedAt, addedBy }
  collaborators/         # Users this user has collaborated with
    {collabUserId}: { displayName, photoURL, lastActive }

boards/{boardId}/       # Global board metadata (NEW collection)
  info/
    {boardId}: { 
      ownerId, 
      name, 
      createdAt,
      collaborators: {
        {userId}: { role: 'viewer' | 'editor' | 'admin', addedAt, addedBy }
      }
    }
  invitations/           # Pending invites
    {invitationId}: { email, role, status, sentAt, sentBy }
  comments/              # Task comments
    {commentId}: { taskId, userId, text, mentions[], createdAt }
  activity/              # Activity log
    {activityId}: { type, userId, boardId, taskId?, details, timestamp }
```

---

## 3. Implementation Plan

### Phase 1: Core Infrastructure (New Files)

- [ ] `src/hooks/useCollaboration.js` - Manage board sharing, permissions, collaborators
- [ ] `src/hooks/useComments.js` - Task comments with mentions
- [ ] `src/hooks/useNotifications.js` - In-app notifications for invites/mentions
- [ ] `src/components/collaboration/ShareBoardModal.jsx` - Share board UI
- [ ] `src/components/collaboration/CollaboratorList.jsx` - View collaborators
- [ ] `src/components/collaboration/InviteUserModal.jsx` - Invite via email
- [ ] `src/components/notifications/NotificationPanel.jsx` - In-app notifications dropdown
- [ ] `src/components/task/TaskAssignment.jsx` - Assign collaborator to task
- [ ] `src/components/comments/CommentSection.jsx` - Comments with @mentions

### Phase 2: Modify Existing Files

- [ ] `src/lib/firebase.js` - Add Firestore collections for boards root level
- [ ] `src/hooks/useAuth.js` - Add collaborator profile caching
- [ ] `src/hooks/useBoards.js` - Integrate collaboration data
- [ ] `src/hooks/useTasks.js` - Add assignee field, permission checks
- [ ] `src/components/Sidebar.jsx` - Add "Shared with me" section
- [ ] `src/components/Header.jsx` - Add collaborator avatars, notifications bell
- [ ] `src/components/TaskCard.jsx` - Show creator/assignee avatars
- [ ] `src/App.jsx` - Integrate all collaboration features

### Phase 3: Permission System

- [ ] Implement `canEditTask(task, user)` helper
- Implement `canManageBoard(board, user)` helper
- UI: Disable edit buttons for unauthorized users
- UI: Show "Assigned to" section in task modal

---

## 4. Permission Levels

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| Delete board | ✅ | ❌ | ❌ | ❌ |
| Add/remove collaborators | ✅ | ✅ | ❌ | ❌ |
| Edit board name | ✅ | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ | ✅ | ❌ |
| Edit others' tasks | ✅ | ✅ | ❌ | ❌ |
| Assign tasks | ✅ | ✅ | ✅ | ❌ |
| Add comments | ✅ | ✅ | ✅ | ✅ |
| View board | ✅ | ✅ | ✅ | ✅ |

---

## 5. UI/UX Changes

### Sidebar:
- "My Boards" section (existing)
- "Shared with Me" section (new) - boards shared by others

### Header:
- Collaborator avatars (stack of 2-3 photos)
- Notification bell with badge count

### Task Card:
- Creator avatar (small, bottom-left)
- Assignee avatar (small, bottom-right)
- Lock icon if user can't edit

### Task Modal:
- Assignee dropdown with collaborator list
- Comments section with @mention support

### Share Flow:
1. Click "Share" button on board
2. Enter email, select role
3. Invitation sent → appears in notifications
4. Recipient accepts → board appears in "Shared with Me"

---

## 6. Testing Strategy

### Critical Path:
- [ ] Board sharing flow (owner → invite → accept)
- [ ] Permission enforcement (viewer can't edit)
- [ ] Task assignment display
- [ ] Comment @mentions

---

## 7. Files to Create

```
src/components/collaboration/
  ├── ShareBoardModal.jsx
  ├── CollaboratorList.jsx
  └── InviteUserModal.jsx

src/components/notifications/
  ├── NotificationPanel.jsx
  └── NotificationItem.jsx

src/components/task/
  └── TaskAssignment.jsx

src/components/comments/
  └── CommentSection.jsx

src/hooks/
  ├── useCollaboration.js
  ├── useComments.js
  └── useNotifications.js

src/lib/
  └── permissions.js (helper functions)
```

---

## 8. Follow-up Steps

1. Confirm plan with user
2. Create new hook files for collaboration logic
3. Create UI components
4. Modify existing files to integrate
5. Test the complete flow
6. Deploy to Firebase

---

## 9. Dependencies

No new npm packages needed - using existing:
- Firebase Firestore (existing)
- Lucide React icons (existing)
- Tailwind CSS (existing)
