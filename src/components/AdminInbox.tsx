// src/components/AdminInbox.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { ref, onValue, push, remove, update, onDisconnect, set } from "firebase/database";
import { db, auth } from "../firebase";
import { Menu, X } from "lucide-react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { ADMIN_EMAIL } from "../config";

// Typing indicator component
const TypingIndicator = ({ name }: { name: string }) => (
  <div className="text-sm italic text-gray-500 dark:text-gray-300 p-2 flex items-center gap-1">
    <span>{name} is typing</span>
    <span className="dots">
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </span>
    <style jsx>{`
      .dots span {
        animation: blink 1s infinite;
      }
      .dots span:nth-child(1) { animation-delay: 0s; }
      .dots span:nth-child(2) { animation-delay: 0.2s; }
      .dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes blink {
        0%, 20%, 50%, 80%, 100% { opacity: 0; }
        10%, 30%, 60%, 90% { opacity: 1; }
      }
    `}</style>
  </div>
);

interface Message {
  id: string;
  name: string;
  email: string;
  userId: string;
  message: string;
  createdAt: number;
  sender: "user" | "admin";
  read?: boolean;
}

interface UserData {
  name: string;
  email: string;
}

export default function AdminInbox() {
  const [admin, setAdmin] = useState<User | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, { user?: boolean; admin?: boolean }>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email === ADMIN_EMAIL) {
        setAdmin(user);
        setUnauthorized(false);
      } else if (user) {
        setUnauthorized(true);
        setAdmin(null);
      } else {
        setAdmin(null);
      }
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!admin) return;
    const messagesRef = ref(db, "messages");
    return onValue(messagesRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        setUsers({});
        return;
      }
      const data = snapshot.val();
      const msgs: Message[] = [];
      const userData: Record<string, UserData> = {};
      for (const [userId, userMsgs] of Object.entries<any>(data)) {
        for (const [msgId, msg] of Object.entries<any>(userMsgs)) {
          msgs.push({ id: msgId, userId, ...(msg as Message) });
        }
        const firstMsg = Object.values(userMsgs)[0] as any;
        userData[userId] = { name: firstMsg?.name || "Anonymous", email: firstMsg?.email || "guest" };
      }
      setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      setUsers(userData);
    });
  }, [admin]);

  // Listen for user typing and online status
  useEffect(() => {
    if (!admin) return;
    const typingRef = ref(db, "typing");
    const presenceRef = ref(db, "presence");

    const unsubTyping = onValue(typingRef, snapshot => setTypingUsers(snapshot.val() || {}));
    const unsubPresence = onValue(presenceRef, snapshot => setOnlineUsers(snapshot.val() || {}));

    return () => {
      unsubTyping();
      unsubPresence();
    };
  }, [admin]);

  // Group messages by user
  const grouped = useMemo(() => messages.reduce<Record<string, Message[]>>((acc, m) => {
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m);
    return acc;
  }, {}), [messages]);

  // Auto-scroll
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedUser]);

  // Mark messages as read
  useEffect(() => {
    if (!selectedUser || !grouped[selectedUser]) return;
    grouped[selectedUser].forEach((m) => {
      if (!m.read && m.sender === "user") {
        update(ref(db, `messages/${selectedUser}/${m.id}`), { read: true });
      }
    });
  }, [selectedUser, grouped]);

  // Send reply
  const [adminTyping, setAdminTyping] = useState(false);
  const setAdminTypingStatus = (isTyping: boolean) => {
    if (!selectedUser) return;
    set(ref(db, `typing/${selectedUser}/admin`), isTyping);
    setAdminTyping(isTyping);
    onDisconnect(ref(db, `typing/${selectedUser}/admin`)).set(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedUser) return;
    await push(ref(db, `messages/${selectedUser}`), {
      userId: selectedUser,
      name: "Admin",
      email: ADMIN_EMAIL,
      message: replyText.trim(),
      createdAt: Date.now(),
      sender: "admin",
      read: true,
    });
    setReplyText("");
    setAdminTypingStatus(false);
  };

  const deleteMessage = async (userId: string, messageId: string) => await remove(ref(db, `messages/${userId}/${messageId}`));

  const logout = () => signOut(auth);

  // Filter users
  const filteredUsers = Object.keys(users).filter(userId => users[userId].name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Users with unread messages (pulse)
  const usersWithUnread = useMemo(() => {
    const result: Record<string, boolean> = {};
    Object.keys(grouped).forEach(userId => {
      result[userId] = grouped[userId].some(m => !m.read && m.sender === "user");
    });
    return result;
  }, [grouped]);

  // Jump to first unread
  const jumpToFirstUnread = () => {
    if (!selectedUser) return;
    const firstUnread = grouped[selectedUser]?.find(m => !m.read && m.sender === "user");
    if (!firstUnread) return;
    const element = document.getElementById(firstUnread.id);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (initializing) return <div className="flex items-center justify-center h-screen"><p>Loading...</p></div>;
  if (unauthorized) return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h2 className="text-xl font-bold text-red-500 mb-4">Access Denied 🚫</h2>
      <button onClick={logout} className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition">Logout</button>
    </div>
  );
  if (!admin) return <div className="flex items-center justify-center h-screen"><p>Please log in as admin</p></div>;

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`fixed md:relative top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-900 border-r shadow-lg transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Users</h2>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="p-3">
          <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-400 outline-none" />
        </div>
        <ul className="overflow-y-auto h-[calc(100%-100px)]">
          {filteredUsers.map(userId => {
            const user = users[userId];
            const unreadCount = grouped[userId]?.filter(m => !m.read && m.sender === "user").length;
            return (
              <li key={userId} onClick={() => { setSelectedUser(userId); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-between items-center ${selectedUser === userId ? "bg-teal-100 dark:bg-teal-700" : ""} ${usersWithUnread[userId] ? "animate-pulse" : ""}`}>
                <div>
                  {user.name} {onlineUsers[userId] && <span className="text-green-500 text-xs ml-1">●</span>}
                  <span className="text-xs text-gray-500 block">{user.email}</span>
                </div>
                {unreadCount ? (<span className="ml-2 bg-red-500 text-white px-2 rounded-full text-xs">{unreadCount}</span>) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
        <div className="flex items-center justify-between p-3 border-b bg-gray-100 dark:bg-gray-700 flex-shrink-0 z-10">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}><Menu size={24} /></button>
          <h3 className="font-bold">{selectedUser ? `Chat with ${users[selectedUser]?.name}` : "Select a user"}</h3>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>

        {/* Jump to first unread button */}
        {selectedUser && grouped[selectedUser]?.some(m => !m.read && m.sender === "user") && (
          <button onClick={jumpToFirstUnread} className="fixed bottom-24 right-6 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-400 transition animate-bounce z-50">
            Jump to first unread
          </button>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
          {selectedUser && (
            <>
              {grouped[selectedUser]?.map(m => (
                <div key={m.id} id={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`p-2 rounded-lg max-w-[70%] text-sm sm:text-base relative ${m.sender === "admin" ? "bg-teal-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"}`}>
                    <strong>{m.name}</strong>
                    <p>{m.message}</p>
                    <span className="text-[10px] block mt-1 opacity-70">{new Date(m.createdAt).toLocaleString()}</span>
                    {m.sender === "admin" && (<button onClick={() => deleteMessage(selectedUser, m.id)} className="absolute top-1 right-1 text-red-500 text-xs hover:text-red-400">✕</button>)}
                  </div>
                </div>
              ))}
              {/* Typing indicator */}
              {typingUsers[selectedUser]?.user && <TypingIndicator name={users[selectedUser]?.name || "User"} />}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="p-3 border-t flex gap-2 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <input
              type="text"
              value={replyText}
              onChange={(e) => { setReplyText(e.target.value); setAdminTypingStatus(e.target.value.trim().length > 0); }}
              onBlur={() => setAdminTypingStatus(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              placeholder="Type reply..."
              className="flex-1 border p-2 rounded focus:ring-2 focus:ring-teal-400 outline-none"
            />
            <button onClick={sendReply} disabled={!replyText.trim()} className="bg-teal-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-teal-400 transition">Send</button>
          </div>
        )}
      </div>
    </div>
  );
}
