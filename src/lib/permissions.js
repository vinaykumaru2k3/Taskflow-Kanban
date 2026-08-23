import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../utils/constants';

// Re-export roles
export { ROLES, ROLE_LABELS, ROLE_COLORS };

// Helper functions for roles
export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || 'Unknown';
};

export const getRoleColor = (role) => {
  return ROLE_COLORS[role] || ROLE_COLORS.viewer;
};

// Permission helpers for collaboration feature

export const canEditTask = (task, user, userRole) => {
  // Owners and admins can edit any task
  if (userRole === ROLES.OWNER || userRole === ROLES.ADMIN) return true;
  
  // Editors can edit tasks they created or are assigned to
  if (userRole === ROLES.EDITOR) {
    return task.createdBy === user.uid || task.assigneeId === user.uid; // [fix] was 'assignedTo', field is 'assigneeId'
  }
  
  // Viewers cannot edit tasks
  return false;
};

export const canCreateTasks = (userRole) => {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN || userRole === ROLES.EDITOR;
};

export const canAssignTasks = (userRole) => {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN;
};

export const canAddComments = (userRole) => {
  return userRole !== ROLES.VIEWER;
};

export const canShareBoard = (userRole) => {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN;
};

export const canDeleteBoard = (userRole) => {
  return userRole === ROLES.OWNER;
};

export const canManageCollaborators = (userRole) => {
  return userRole === ROLES.OWNER || userRole === ROLES.ADMIN;
};

/**
 * Returns the role a user holds on a given board.
 * teamMembers comes from useCollaboration's real-time listener (boards/{boardId}/members).
 * Falls back to null if the user is not a member.
 *
 * @param {string} userId
 * @param {Array<{uid:string, role:string}>} teamMembers - from useCollaboration
 * @returns {string|null}
 */
export const getUserBoardRole = (userId, teamMembers = []) => {
  if (!userId || !teamMembers.length) return null;
  const member = teamMembers.find(m => m.uid === userId);
  return member ? member.role : null;
};

/**
 * Returns true if userId is the owner of the board.
 * For owned boards (in user's own subcollection) ownerId is not set — ownership
 * is implied by the board living under that user's path.
 * For shared board stubs (sharedBoards subcollection) ownerId is set to the
 * original owner's uid.
 *
 * @param {string} userId
 * @param {{ownerId?: string}} board - board document
 * @returns {boolean}
 */
export const isBoardOwner = (userId, board) => {
  if (!userId || !board) return false;
  // Shared board stub: ownerId is the original owner
  if (board.ownerId) return board.ownerId === userId;
  // Own board: no ownerId means the board lives under userId's subcollection
  // — caller is always the owner in that context.
  return true;
};
