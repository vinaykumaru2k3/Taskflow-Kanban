import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Validates if a user is a member of a board's team
 * @param {string} boardId - The board ID
 * @param {string} userId - The user ID to validate
 * @returns {Promise<boolean>} - True if user is a team member
 */
export const isTeamMember = async (boardId, userId) => {
  if (!boardId || !userId) return false;
  
  try {
    const memberRef = doc(db, 'boards', boardId, 'members', userId);
    const memberSnap = await getDoc(memberRef);
    return memberSnap.exists();
  } catch (error) {
    console.error('Error checking team membership:', error);
    return false;
  }
};

/**
 * Gets active team member IDs for a board
 * @param {string} boardId - The board ID
 * @returns {Promise<string[]>} - Array of active member UIDs
 */
export const getActiveTeamMemberIds = async (boardId) => {
  if (!boardId) return [];
  
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const membersRef = collection(db, 'boards', boardId, 'members');
    const snapshot = await getDocs(membersRef);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

/**
 * Filters assignees to only include active team members
 * @param {Array} assignees - Array of potential assignees
 * @param {string} boardId - The board ID
 * @returns {Promise<Array>} - Filtered array of valid assignees
 */
export const filterValidAssignees = async (assignees, boardId) => {
  if (!assignees || !boardId) return [];
  
  const activeIds = await getActiveTeamMemberIds(boardId);
  return assignees.filter(assignee => activeIds.includes(assignee.uid));
};

/**
 * Checks if an assignee is still a valid team member
 * @param {Object} task - The task object
 * @param {string} boardId - The board ID
 * @returns {Promise<boolean>} - True if assignee is valid or task is unassigned
 */
export const isAssigneeValid = async (task, boardId) => {
  if (!task?.assigneeId) return true; // Unassigned tasks are valid
  return await isTeamMember(boardId, task.assigneeId);
};

/**
 * Sanitizes task data to handle removed assignees
 * @param {Object} task - The task object
 * @param {string} boardId - The board ID
 * @returns {Promise<Object>} - Task with sanitized assignee data
 */
export const sanitizeTaskAssignee = async (task, boardId) => {
  if (!task?.assigneeId) return task;
  
  const isValid = await isTeamMember(boardId, task.assigneeId);
  
  if (!isValid) {
    return {
      ...task,
      assigneeId: null,
      assigneeName: null,
      assigneeAvatar: null,
      _removedAssignee: task.assigneeId, // Keep for audit trail
    };
  }
  
  return task;
};
