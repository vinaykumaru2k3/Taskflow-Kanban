import axios from "axios";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/* ---------------- Helpers ---------------- */

function cleanName(text) {
  if (!text) return "";
  // Removes "a", "the", "called", "task", "board", "of" to get the pure name
  return text.replace(/^(a|the|called|task|board|of)\s+/i, "").replace(/\s+(board|task)$/i, "").trim();
}

function normalizeStatus(status) {
  if (!status) return null;
  const s = status.toLowerCase().trim();
  const map = {
    "todo": "todo", "to-do": "todo", "open": "todo",
    "in progress": "in-progress", "progress": "in-progress", "doing": "in-progress", "in-progress": "in-progress",
    "review": "review", "testing": "review",
    "done": "done", "completed": "done", "finished": "done"
  };
  return map[s] || s;
}

/* ---------------- Local Fallback NLP ---------------- */

function localParse(text) {
  const lower = text.toLowerCase().trim();
  let m;

  // 1. CREATE BOARD: "create board called Accounts" or "add board Work"
  m = lower.match(/(?:add|create)\s+(?:a\s+)?board\s+(?:called\s+)?(.+)/i);
  if (m) return { action: "create_board", board: cleanName(m[1]) };

  // 2. CREATE TASK IN BOARD: "add task Open Bank in Accounts board"
  m = lower.match(/(?:add|create|adda)\s+(?:a\s+)?task\s+(.+?)\s+(?:in|to)\s+(.+?)(?:\s+board)?$/i);
  if (m) {
    return { 
      action: "create_task", 
      title: m[1].trim(), 
      board: cleanName(m[2]) 
    };
  }
  // 3. UPDATE DUE DATE: "update task Open Bank due date to 2024-12-31"
  m = lower.match(/(?:update|set|change|make)\s+(?:due date|deadline|due)\s+(?:of\s+)?(?:task\s+)?(.+?)\s+to\s+(\d{4}-\d{2}-\d{2})/i);
  if (m) return { 
    action: "update_task", 
    title: cleanName(m[1]), 
    dueDate: m[2] 
  };
// 3. UPDATE PRIORITY: "update task Open Bank priority to high"
  m = lower.match(/(?:update|set|change|make)\s+(?:task\s+)?(.+?)\s+priority\s+(?:to\s+)?(high|medium|low)/i);
  if (m) return { action: "update_task", title: cleanName(m[1]), priority: m[2] };

  // 3. UPDATE STATUS
  m = lower.match(/(?:move|change|set|update|make)\s+(?:task\s+)?(.+?)\s+to\s+(todo|in-progress|review|done|completed|progress|doing)/i);
  if (m) return { action: "update_task", title: cleanName(m[1]), status: normalizeStatus(m[2]) };

  // 4. LIST TODAY'S TASKS
  if (lower.includes("today") || (lower.includes("scheduled") && lower.includes("task"))) {
    return { action: "list_tasks", filter: "today" };
  }

  // 5. UPDATE DUE DATE / DEADLINE
  m = lower.match(/(?:update|set|change|make)\s+(?:task\s+)?(.+?)\s+(?:due date|deadline|due)\s+to\s+(\d{4}-\d{2}-\d{2})/i);
  if (m) return { action: "update_task", title: cleanName(m[1]), dueDate: m[2] };

  // 6. DELETE TASK
  m = lower.match(/delete\s+(?:the\s+)?task\s+(.+)/i);
  if (m) return { action: "delete_task", title: cleanName(m[1]) };

  m = lower.match(/delete\s+(?:the\s+)?(?:board\s+)?(?:called\s+)?(.+?)(?:\s+board)?$/i);
  if (m && lower.includes("delete")) {
    return { action: "delete_board", board: cleanName(m[1]) };
  }

  return null;
}

/* ---------------- Gemini Call ---------------- */

async function callGemini(message) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      contents: [{
        parts: [{
          text: `Return ONLY JSON. 
          Actions: create_board, delete_board, create_task, update_task, delete_task, list_tasks.
          Fields: 
          - title (task name)
          - board (board name)
          - status (todo|in-progress|review|done)
          - priority (low|medium|high)
          - dueDate (YYYY-MM-DD)
          - filter (today)

          Examples:
          "Create a board called Marketing" -> {"action":"create_board","board":"Marketing"}
          "Add task Send Email in Marketing board" -> {"action":"create_task","title":"Send Email","board":"Marketing"}
          "Update task Tax status to done" -> {"action":"update_task","title":"Tax","status":"done"}

          User: ${message}`
        }]
      }]
    }
  );

  const raw = res.data.candidates[0].content.parts[0].text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON");
  return JSON.parse(jsonMatch[0]);
}

export async function askGemini(message) {
  try {
    return await callGemini(message);
  } catch (e) {
    const local = localParse(message);
    if (local) return local;
    throw new Error("Unable to parse command");
  }
}