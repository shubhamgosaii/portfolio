import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, get, set, onDisconnect } from "firebase/database";
import { db, auth } from "../firebase";
import { MessageCircle, X } from "lucide-react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

interface ContactData {
  heading: string;
  placeholders: { name: string; email: string; message: string };
  buttonText: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  font?: string;
  textColor?: string;
  backgroundColor?: string;
  darkTextColor?: string;
  darkBackgroundColor?: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  userId: string;
  message: string;
  createdAt: number;
  sender: "user" | "admin";
}

export default function Contact({ dark }: { dark: boolean }) {
  const [data, setData] = useState<ContactData | null>(null);
  const [name, setName] = useState(localStorage.getItem("chatName") || "");
  const [email, setEmail] = useState(localStorage.getItem("chatEmail") || "");
  const [formMessage, setFormMessage] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [chatStatus, setChatStatus] = useState("");
  const [submitted, setSubmitted] = useState(localStorage.getItem("contactSubmitted") === "true");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("chatUserId"));
  const [user, setUser] = useState<User | null>(null);
  const [iconBottom, setIconBottom] = useState(24);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [iconShake, setIconShake] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false); // NEW state: to handle auth initialization

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        const result = await signInAnonymously(auth);
        setUser(result.user);
      }
      setAuthInitialized(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const contactRef = ref(db, "contact");
    return onValue(contactRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const messagesRef = ref(db, `messages/${userId}`);
    return onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const msgs: Message[] = Object.keys(snapshot.val()).map((id) => ({
          id,
          ...snapshot.val()[id],
        }));
        const sorted = msgs.sort((a, b) => a.createdAt - b.createdAt);
        setMessages(sorted);

        if (sorted.length > 0) {
          const latest = sorted[sorted.length - 1];
          if (latest.sender === "admin" && latest.id !== lastMessageId) {
            if (!inboxOpen) {
              setUnreadCount((c) => c + 1);
              if (navigator.vibrate) navigator.vibrate(200);
              setIconShake(true);
              setTimeout(() => setIconShake(false), 600);
            }
            setLastMessageId(latest.id);
          }
        }
      } else {
        setMessages([]);
      }
    });
  }, [userId, inboxOpen, lastMessageId]);

  useEffect(() => {
    if (!userId) return;
    const typingRef = ref(db, `typing/${userId}/admin`);
    return onValue(typingRef, (snapshot) => {
      const val = snapshot.val();
      setAdminTyping(!!val);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const typingRef = ref(db, `typing/${userId}/user`);
    return onValue(typingRef, (snapshot) => {
      const val = snapshot.val();
      setUserTyping(!!val);
    });
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, inboxOpen]);

  useEffect(() => {
    if (inboxOpen) {
      setUnreadCount(0);
    }
  }, [inboxOpen]);

  const isValidEmail = (mail: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  useEffect(() => {
    if (localStorage.getItem("chatEmail") && localStorage.getItem("chatUserId")) {
      setSubmitted(true);
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !formMessage) {
      return setFormStatus("Please fill all fields.");
    }
    if (!isValidEmail(email)) {
      return setFormStatus("Please enter a valid email.");
    }
    if (!user) {
      return setFormStatus("Please wait, initializing...");
    }
    try {
      const allMessagesRef = ref(db, "messages");
      const snapshot = await get(allMessagesRef);
      let existingUserId: string | null = null;

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const msgs = child.val();
          Object.values(msgs as any).forEach((msg: any) => {
            if (msg.email === email) {
              existingUserId = msg.userId;
            }
          });
        });
      }

      const finalUserId = existingUserId || user.uid;

      await push(ref(db, `messages/${finalUserId}`), {
        userId: finalUserId,
        name,
        email,
        message: formMessage,
        createdAt: Date.now(),
        sender: "user",
      });

      if (!existingUserId) {
        setUserId(finalUserId);
        localStorage.setItem("chatUserId", finalUserId);
      }

      localStorage.setItem("contactSubmitted", "true");
      localStorage.setItem("chatName", name);
      localStorage.setItem("chatEmail", email);
      setSubmitted(true);
      setFormMessage("");
      setFormStatus("");
    } catch (err) {
      console.error("Error sending form:", err);
      setFormStatus("Failed to send message.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !userId) return;
    try {
      await push(ref(db, `messages/${userId}`), {
        userId,
        name: localStorage.getItem("chatName") || "Guest",
        email: localStorage.getItem("chatEmail") || "unknown",
        message: chatMessage.trim(),
        createdAt: Date.now(),
        sender: "user",
      });
      setChatMessage("");
      setTypingStatus(false);
      setChatStatus("");
    } catch (err) {
      console.error("Error sending chat:", err);
      setChatStatus("Failed to send message.");
    }
  };

  const setTypingStatus = (isTyping: boolean) => {
    if (!userId) return;
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    set(ref(db, `typing/${userId}/user`), isTyping);
    onDisconnect(ref(db, `typing/${userId}/user`)).set(false);

    typingTimeout.current = setTimeout(() => {
      set(ref(db, `typing/${userId}/user`), false);
    }, 2000);
  };

  if (!authInitialized) {
    return null; 
  }

  const textColor = dark ? "#fff" : "#000";

  return (
    <>
      <section
        id="contact"
        className="section transition-colors duration-300 py-16"
        style={{
          fontFamily: data?.font || "inherit",
          color: textColor,
          backgroundColor: dark ? data?.darkBackgroundColor || "#111" : data?.backgroundColor || "#fff",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-8 max-w-xl">
          {data && (
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center">
                {data.heading}
              </h2>
              {!submitted ? (
                <form onSubmit={handleFormSubmit} className="grid gap-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={data.placeholders.name}
                    className="p-3 rounded focus:ring-2 outline-none transition w-full"
                    style={{ color: textColor, backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={data.placeholders.email}
                    className="p-3 rounded focus:ring-2 outline-none transition w-full"
                    style={{ color: textColor, backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={data.placeholders.message}
                    className="p-3 rounded h-32 sm:h-40 focus:ring-2 outline-none transition w-full resize-none"
                    style={{ color: textColor, backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <button
                    type="submit"
                    className="btn w-full sm:w-auto px-4 py-2 rounded transition-transform hover:scale-105 active:scale-95 mx-auto touch-manipulation"
                    style={{ backgroundColor: data.buttonBgColor || "#14b8a6", color: data.buttonTextColor || "#fff" }}
                  >
                    {data.buttonText}
                  </button>
                  {formStatus && <p className="text-center mt-2">{formStatus}</p>}
                </form>
              ) : (
                <p className="text-center text-xl sm:text-2xl mt-4">Thank you for your message! 😊</p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Chat Icon */}
      {submitted && (
        <motion.button
          onClick={() => setInboxOpen(!inboxOpen)}
          animate={iconShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.6 }}
          className="fixed right-4 p-4 rounded-full shadow-lg"
          style={{
            bottom: `${iconBottom + 100}px`,
            zIndex: 50,
            backgroundColor: dark ? "#0f766e" : "#14b8a6",
            color: "#fff",
          }}
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Inbox */}
      <AnimatePresence>
        {inboxOpen && userId && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-4 sm:right-6 max-w-[320px] w-[calc(100vw-1rem)] max-h-[70vh] shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50"
            style={{ backgroundColor: dark ? "#111" : "#fff", color: textColor }}
          >
            <div className="flex justify-between items-center p-3" style={{ backgroundColor: "#14b8a6", color: "#fff" }}>
              <h3 className="font-semibold">
                Chat with {localStorage.getItem("chatName") || "User"}
              </h3>
              <button onClick={() => setInboxOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {adminTyping && (
                <div className="flex justify-center">
                  <span className="text-gray-500">Admin is typing...</span>
                </div>
              )}
              {userTyping && (
                <div className="flex justify-center">
                  <span className="text-gray-500">You are typing...</span>
                </div>
              )}
              {messages.length > 0 ? (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="p-2 rounded-lg max-w-[70%] text-sm sm:text-base"
                      style={{
                        backgroundColor: m.sender === "admin" ? "#14b8a6" : dark ? "#333" : "#e5e7eb",
                        color: m.sender === "admin" ? "#fff" : textColor,
                      }}
                    >
                      <strong>{m.name}</strong>
                      <p>{m.message}</p>
                      <span className="text-[10px] block mt-1 opacity-70">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No messages yet.</p>
              )}
              <div ref={scrollRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => {
                  setChatMessage(e.target.value);
                  setTypingStatus(e.target.value.trim().length > 0);
                }}
                placeholder="Type a message..."
                className="flex-1 border p-2 rounded"
                style={{ color: textColor, backgroundColor: dark ? "#222" : "#fff" }}
              />
              <button type="submit" className="px-4 py-2 rounded bg-teal-600 text-white">
                Send
              </button>
            </form>
            {chatStatus && <p className="text-center text-sm text-red-500 mt-1">{chatStatus}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
