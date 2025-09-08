// src/components/AdminInbox.tsx
import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, remove, update } from "firebase/database";
import { db, auth } from "../firebase";
import { Menu, X } from "lucide-react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { ADMIN_EMAIL } from "../config";

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ Auth check – prevents flash
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

  // ✅ Fetch messages
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
        userData[userId] = {
          name: firstMsg?.name || "Anonymous",
          email: firstMsg?.email || "guest",
        };
      }

      setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      setUsers(userData);
    });
  }, [admin]);

  // ✅ Group messages by user
  const grouped = messages.reduce<Record<string, Message[]>>((acc, m) => {
    if (!acc[m.userId]) acc[m.userId] = [];
    acc[m.userId].push(m);
    return acc;
  }, {});

  // ✅ Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  // ✅ Mark messages as read
  useEffect(() => {
    if (!selectedUser || !grouped[selectedUser]) return;
    grouped[selectedUser].forEach((m) => {
      if (!m.read && m.sender === "user") {
        update(ref(db, `messages/${selectedUser}/${m.id}`), { read: true });
      }
    });
  }, [selectedUser, grouped]);

  // ✅ Send reply
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
  };

  // ✅ Delete message
  const deleteMessage = async (userId: string, messageId: string) => {
    await remove(ref(db, `messages/${userId}/${messageId}`));
  };

  const logout = () => signOut(auth);

  // 🚫 Prevent flash
  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">Access Denied 🚫</h2>
        <button
          onClick={logout}
          className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Logout
        </button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in as admin</p>
      </div>
    );
  }

  // ✅ Filter users
  const filteredUsers = Object.keys(users).filter((userId) =>
    users[userId].name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-full w-64 bg-gray-100 dark:bg-gray-900 border-r shadow-lg transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg">Users</h2>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-400 outline-none"
          />
        </div>
        <ul className="overflow-y-auto h-[calc(100%-100px)]">
          {filteredUsers.map((userId) => {
            const user = users[userId];
            const unreadCount = grouped[userId]?.filter(
              (m) => !m.read && m.sender === "user"
            ).length;
            return (
              <li
                key={userId}
                onClick={() => {
                  setSelectedUser(userId);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-between items-center ${
                  selectedUser === userId ? "bg-teal-100 dark:bg-teal-700" : ""
                }`}
              >
                <div>
                  {user.name}
                  <span className="text-xs text-gray-500 block">{user.email}</span>
                </div>
                {unreadCount ? (
                  <span className="ml-2 bg-red-500 text-white px-2 rounded-full text-xs">
                    {unreadCount}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-100 dark:bg-gray-700 flex-shrink-0 z-10">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h3 className="font-bold">
            {selectedUser ? `Chat with ${users[selectedUser]?.name}` : "Select a user"}
          </h3>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedUser &&
            grouped[selectedUser]?.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-2 rounded-lg max-w-[70%] text-sm sm:text-base relative ${
                    m.sender === "admin"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                  }`}
                >
                  <strong>{m.name}</strong>
                  <p>{m.message}</p>
                  <span className="text-[10px] block mt-1 opacity-70">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                  {m.sender === "admin" && (
                    <button
                      onClick={() => deleteMessage(selectedUser, m.id)}
                      className="absolute top-1 right-1 text-red-500 text-xs hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="p-3 border-t flex gap-2 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
              placeholder="Type reply..."
              className="flex-1 border p-2 rounded focus:ring-2 focus:ring-teal-400 outline-none"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim()}
              className="bg-teal-500 text-white px-4 py-2 rounded disabled:bg-gray-400 hover:bg-teal-400 transition"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
