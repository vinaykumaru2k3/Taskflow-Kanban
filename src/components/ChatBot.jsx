import { useEffect, useState, useRef } from "react";
import Draggable from "react-draggable";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, X } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { askGemini } from "../gemini";
import {
  collection, addDoc, getDocs, serverTimestamp,
  updateDoc, deleteDoc
} from "firebase/firestore";

export default function ChatBot() {
  const user = auth.currentUser;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [moved, setMoved] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (user) {
      setMessages([{ role: "bot", text: `Hi ${user.displayName?.split(" ")[0]}! 👋 How can I help you today?` }]);
    }
  }, [user]);

  const reply = (text) => setMessages(m => [...m, { role: "bot", text }]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const userText = input.trim();
    setMessages(m => [...m, { role: "user", text: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      const ai = await askGemini(userText);
      await handleAction(ai);
    } catch (err) {
      reply("I'm a bit confused. Could you rephrase that?");
    } finally {
      setIsTyping(false);
    }
  };

  async function handleAction(data) {
    // 1. Handle casual conversation (Hi/Hello)
    if (data.action === "chat") {
      return reply(data.message);
    }

    const tasksRef = collection(db, "users", user.uid, "tasks");
    const boardsRef = collection(db, "users", user.uid, "boards");

    /* -------- CREATE BOARD -------- */
    if (data.action === "create_board") {
      await addDoc(boardsRef, {
        name: data.board,
        createdAt: serverTimestamp()
      });
      return reply(`Created board "${data.board}"! 📂`);
    }

    /* -------- CREATE TASK IN BOARD -------- */
    if (data.action === "create_task") {
      const boardsSnap = await getDocs(boardsRef);
      // Fuzzy match for the board name
      const boardDoc = boardsSnap.docs.find(doc => 
        doc.data().name.toLowerCase().includes(data.board.toLowerCase())
      );

      if (!boardDoc) return reply(`I couldn't find a board named "${data.board}". ❌`);

      await addDoc(tasksRef, {
        title: data.title,
        boardId: boardDoc.id,
        status: "todo",
        priority: data.priority || "medium",
        dueDate: data.dueDate || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return reply(`Task "${data.title}" added to ${boardDoc.data().name} ✅`);
    }

    /* -------- LIST TODAY'S TASKS -------- */
    /* -------- LIST TODAY'S TASKS -------- */
if (data.action === "list_tasks") {
  const todayStr = new Date().toISOString().split('T')[0];
  const [tSnap, bSnap] = await Promise.all([getDocs(tasksRef), getDocs(boardsRef)]);
  
  const boardMap = {};
  bSnap.forEach(doc => boardMap[doc.id] = doc.data().name);

  const todayTasks = tSnap.docs
    .map(doc => doc.data())
    .filter(t => t.dueDate === todayStr);

  if (todayTasks.length === 0) return reply(`No tasks scheduled for today! ☕`);

  let msg = `📋 **Today's Schedule:**\n\n`;
  
  todayTasks.forEach((t, i) => {
    // Determine priority emoji
    const pEmoji = t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢";
    const boardName = boardMap[t.boardId] || "General";

    // Build a structured, separated layout
    msg += `${i + 1}. **${t.title}**\n`; // Task Name in Bold
    msg += `   📂 Board: ${boardName}\n`;   // Board Name separated
    msg += `   ⚡ Priority: ${pEmoji} ${t.priority}\n\n`; // Priority status
  });

  return reply(msg);
}
    
    /* -------- UPDATE TASK -------- */
    /* -------- UPDATE TASK (Inside handleAction) -------- */
if (data.action === "update_task") {
  const snap = await getDocs(tasksRef);
  const search = data.title.toLowerCase().trim();
  
  // Find task: checks exact match, includes, or startsWith
  const taskDoc = snap.docs.find(d => {
    const dbTitle = d.data().title.toLowerCase();
    return dbTitle === search || dbTitle.includes(search) || search.includes(dbTitle);
  });

  if (!taskDoc) return reply(`I couldn't find a task called "${data.title}". ❌`);

  const updates = { ...data, updatedAt: serverTimestamp() };
  delete updates.action;
  delete updates.title; // Keep the original DB title

  await updateDoc(taskDoc.ref, updates);
  
  const detail = data.dueDate ? `due date to ${data.dueDate}` : 
                 data.priority ? `priority to ${data.priority}` : 
                 `status to ${data.status}`;
                 
  return reply(`Updated "${taskDoc.data().title}" ${detail} ✅`);
}
    /* -------- DELETE TASK -------- */
    if (data.action === "delete_task") {
      const snap = await getDocs(tasksRef);
      const task = snap.docs.find(d => d.data().title.toLowerCase().includes(data.title.toLowerCase()));
      if (!task) return reply("Task not found.");
      await deleteDoc(task.ref);
      return reply(`Deleted "${task.data().title}" 🗑️`);
    }
    /* -------- DELETE BOARD -------- */
    if (data.action === "delete_board") {
    const bSnap = await getDocs(boardsRef);
    const searchName = data.board.toLowerCase().trim();

    // Find board by checking if the name matches or is contained within the string
    const boardDoc = bSnap.docs.find(doc => {
      const dbName = doc.data().name.toLowerCase().trim();
      return dbName === searchName || dbName.includes(searchName) || searchName.includes(dbName);
    });

    if (!boardDoc) return reply(`I couldn't find a board named "${data.board}". ❌`);

    try {
      await deleteDoc(boardDoc.ref);
      return reply(`Board "${boardDoc.data().name}" deleted successfully. 🗑️`);
    } catch (err) {
      return reply("Error deleting board. Check your database permissions.");
    }
  }
  }

  return (
    <Draggable handle=".handle" onStart={() => setMoved(false)} onDrag={() => setMoved(true)}>
      <div style={{ position: "fixed", bottom: 25, right: 25, zIndex: 9999 }}>
        
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              style={{
                width: 280,
                height: 380,
                background: "#fff",
                borderRadius: "20px",
                boxShadow: "0 15px 40px rgba(0,0,0,0.12)",
                display: "flex",
                flexDirection: "column",
                border: "1px solid #eee",
                marginBottom: 12,
                overflow: "hidden"
              }}
            >
              <div className="handle" style={{ padding: "12px 15px", background: "#1e293b", color: "#fff", display: "flex", justifyContent: "space-between", cursor: "grab" }}>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>AI Assistant</span>
                <X size={16} onClick={() => setOpen(false)} style={{ cursor: "pointer" }} />
              </div>

              <div ref={scrollRef} style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ 
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    background: m.role === "user" ? "#3b82f6" : "#f1f5f9",
                    color: m.role === "user" ? "#fff" : "#333",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    fontSize: "12.5px",
                    maxWidth: "85%",
                    whiteSpace: "pre-line"
                  }}>
                    {m.text}
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: "flex-start", background: "#f1f5f9", padding: "8px 12px", borderRadius: "12px", fontSize: "12.5px" }}>
                    typing...
                  </div>
                )}
              </div>

              <div style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", background: "#f9f9f9", borderRadius: "10px", padding: "4px 8px", border: "1px solid #eee" }}>
                  <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Message..." 
                    style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: "12px", padding: "6px" }}
                  />
                  <button onClick={handleSend} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          drag
          dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => !moved && setOpen(!open)}
          style={{
            width: 55,
            height: 55,
            borderRadius: "50%",
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            cursor: "pointer",
            position: "relative"
          }}
        >
          {open ? <X size={24} /> : <Bot size={26} />}
          {!open && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid #3b82f6" }}
            />
          )}
        </motion.div>
      </div>
    </Draggable>
  );
}