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
    return task.createdBy === user.uid || task.assignedTo === user.uid;
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

export const getUserBoardRole = (userId, board) => {
  if (!board || !board.collaborators) return null;
  
  const collaborator = board.collaborators.find(c => c.uid === userId);
  return collaborator ? collaborator.role : null;
};

export const isBoardOwner = (userId, board) => {
  if (!board || !board.ownerId) return false;
  return board.ownerId === userId;
};
