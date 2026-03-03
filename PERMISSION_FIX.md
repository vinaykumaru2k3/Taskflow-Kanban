# Permission Error Fix - Removing Collaborators

## Problem
When trying to remove a collaborator who had assigned tasks, the operation failed with:
```
FirebaseError: Missing or insufficient permissions.
```

## Root Cause
The original implementation tried to delete documents in the collaborator's subcollections (`users/{uid}/sharedBoards` and `users/{uid}/notifications`) in a single batch operation. However, Firestore security rules only allow users to write to their own subcollections, so the board owner couldn't delete the collaborator's data.

## Solution
Separated the operations into two phases:

### Phase 1: Batch Operations (Guaranteed Permission)
```javascript
const batch = writeBatch(db);

// Update tasks (you own these)
batch.update(taskRef, { assigneeId: null, ... });

// Remove from team members (you own this collection)
batch.delete(memberRef);

await batch.commit();
```

### Phase 2: Individual Operations (May Fail Gracefully)
```javascript
try {
  // Try to delete their sharedBoards entry
  await deleteDoc(sharedRef);
} catch (err) {
  console.warn('Could not delete sharedBoards entry (permission denied)');
  // This is expected - collaborator will still see the board but won't have access
}

try {
  // Try to delete pending notifications
  const notifSnapshot = await getDocs(notificationsQuery);
  const deletePromises = notifSnapshot.docs.map(notifDoc => deleteDoc(notifDoc.ref));
  await Promise.allSettled(deletePromises);
} catch (err) {
  console.warn('Could not delete notifications (permission denied)');
}
```

## Key Changes

**File:** `src/hooks/useCollaboration.js`

1. **Batch operations** only include data you have permission to modify:
   - Task updates (your tasks)
   - Member removal (your team collection)

2. **Separate try-catch blocks** for collaborator's data:
   - Gracefully handle permission errors
   - Log warnings instead of throwing
   - Operation succeeds even if cleanup fails

3. **Result:** Collaborator loses access immediately (removed from team members), even if their personal data isn't deleted

## Why This Works

- ✅ **Board owner can update their own tasks** - No permission issue
- ✅ **Board owner can delete from team members** - Owned collection
- ✅ **Collaborator's data remains** - But they can't access the board
- ✅ **No permission errors** - Graceful degradation
- ✅ **Tasks are reassigned/unassigned** - Main goal achieved

## Testing

Try removing a collaborator with assigned tasks:
1. Create board and invite user
2. Assign tasks to that user
3. Remove user with "Unassign" or "Reassign to owner" option
4. ✅ Should succeed without permission errors
5. ✅ Tasks should be updated
6. ✅ User removed from team panel

## Commit
```
1bea2ed fix: handle Firestore permission errors when removing collaborators
```

## Next Steps
1. Test the fix in your app
2. Deploy updated Firestore rules (if not already done)
3. Monitor for any issues
