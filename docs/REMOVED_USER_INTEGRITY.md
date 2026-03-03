# Removed User Data Integrity - Implementation Guide

## Overview

This document describes the comprehensive solution for handling removed team members across the TaskFlow application, ensuring data integrity and preventing ghost references.

## Problem Statement

When a team member is removed from a board:
- Tasks assigned to them still showed their profile picture and name
- Comments mentioning them could break rendering
- Notifications continued to be sent
- No cleanup of stale data occurred

## Solution Architecture

### 1. Task Reassignment on User Removal

**Location:** `src/hooks/useCollaboration.js` - `removeCollaborator()`

**Strategies:**
- **Unassign (default):** Sets `assigneeId`, `assigneeName`, `assigneeAvatar` to `null`
- **Reassign to Owner:** Transfers all tasks to the board owner

**Implementation:**
```javascript
// Atomic batch operation ensures all-or-nothing updates
const batch = writeBatch(db);

// Query all tasks assigned to removed user
const tasksQuery = query(
  collection(db, 'users', taskOwnerId, 'tasks'),
  where('boardId', '==', boardId),
  where('assigneeId', '==', collaboratorUid)
);

// Apply strategy
if (strategy === 'owner') {
  batch.update(taskRef, {
    assigneeId: ownerId,
    assigneeName: ownerName,
    assigneeAvatar: ownerAvatar,
    reassignedFrom: collaboratorUid,
    reassignedAt: serverTimestamp()
  });
} else {
  batch.update(taskRef, {
    assigneeId: null,
    assigneeName: null,
    assigneeAvatar: null,
    previousAssignee: collaboratorUid,
    unassignedAt: serverTimestamp()
  });
}

// Commit all changes atomically
await batch.commit();
```

### 2. Assignment Validation

**Location:** `src/hooks/useTasks.js` - `createTask()` and `updateTask()`

**Validation:**
- Before creating/updating a task with an assignee
- Check if assignee exists in `boards/{boardId}/members`
- Throw error if not a team member

### 3. Comment Mention Handling

**Location:** `src/components/comments/CommentSection.jsx` - `renderCommentContent()`

**Behavior:**
- Active members: Blue highlight with normal styling
- Removed members: Gray with strikethrough and "Former member" tooltip

### 4. Notification Cleanup

**Location:** `src/hooks/useCollaboration.js` - `removeCollaborator()`

**Cleanup:**
- Delete all pending notifications for the removed user related to this board
- Prevents ghost notifications

### 5. UI Graceful Degradation

**Location:** `src/components/TaskCard.jsx`

**Features:**
- Avatar error handling with fallback
- Tooltip shows "Assigned (member removed)" for invalid assignees
- No broken images

### 6. Database-Level Validation

**Location:** `firestore.rules`

**Enforcement:**
- Firestore rules validate assigneeId exists in team members
- Prevents invalid assignments at database level

## User Experience Flow

### Removing a Team Member

1. **Owner/Admin clicks remove button** on team member
2. **Confirmation modal appears** with reassignment options:
   - Unassign tasks (default)
   - Reassign to board owner
3. **User confirms removal**
4. **Atomic batch operation executes:**
   - Updates all assigned tasks
   - Removes from `sharedBoards`
   - Removes from `boards/{boardId}/members`
   - Deletes pending notifications
5. **Real-time updates propagate** to all connected clients
6. **UI reflects changes immediately:**
   - Tasks show "Unassigned" or new assignee
   - Team panel updates
   - Comments show former member styling

## Testing Strategy

### Unit Tests
- `useCollaboration.test.jsx` - Removal strategies
- `useTasksValidation.test.jsx` - Assignment validation

### Integration Tests
- `removed-user-integrity.spec.js` - E2E flows

### Test Coverage
- ✅ Unassign strategy
- ✅ Reassign to owner strategy
- ✅ Prevent assigning to non-members
- ✅ Comment mention rendering
- ✅ Notification cleanup
- ✅ Avatar error handling
- ✅ Prevent removing board owner

## Edge Cases Handled

1. ✅ **Removed user still assigned to tasks** - Handled via reassignment strategies
2. ✅ **Broken avatar images** - Error handling with fallback
3. ✅ **Mentions of removed users** - Visual distinction with strikethrough
4. ✅ **Assigning to removed users** - Validation prevents this
5. ✅ **Pending notifications** - Cleaned up on removal
6. ✅ **Real-time sync** - Batch operations ensure consistency
7. ✅ **Board owner removal** - Explicitly prevented
8. ✅ **Concurrent removals** - Firestore transactions handle this

## Security Considerations

- **Firestore Rules:** Validate team membership at database level
- **Client Validation:** Prevent invalid operations before submission
- **Audit Trail:** Track reassignments with timestamps
- **Permission Checks:** Only owners/admins can remove members
