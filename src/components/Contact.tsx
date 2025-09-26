import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, get, set, onDisconnect } from "firebase/database";
import { db, auth } from "../firebase";
import { MessageCircle, X } from "lucide-react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

// TypingIndicator Component
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

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [iconShake, setIconShake] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Request FCM permissions and setup notification listener
  useEffect(() => {
    if (Notification.permission !== "granted") {
      console.log("Requesting Notification permission...");
      Notification.requestPermission().then((permission) => {
        console.log("Notification Permission:", permission);
      });
    } else {
      console.log("Notification permission already granted.");
    }

    // Test notification
    if (Notification.permission === "granted") {
      new Notification("Test notification", {
        body: "This is a test notification",
        icon: "/path-to-your-icon.png", // Replace with your icon path
      });
    }
  }, []);

  // Firebase Auth and User Initialization
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

  // Fetching User Messages
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

            // Show notification if it's an admin message and not in inbox
            if (!inboxOpen && Notification.permission === "granted") {
              new Notification("New message from Admin", {
                body: latest.message,
                icon: "/path-to-your-icon.png", // Ensure the icon path is correct
              });
            }
          }
        }
      } else {
        setMessages([]);
      }
    });
  }, [userId, inboxOpen, lastMessageId]);

  // Show notification when a user sends a message
  useEffect(() => {
    if (!user || !messages.length) return;

    const latestMessage = messages[messages.length - 1];
    console.log("Latest message:", latestMessage);

    // Ensure that notifications are shown only if the sender is the user and not the selected user
    if (latestMessage.sender === "user" && latestMessage.userId !== userId) {
      if (Notification.permission === "granted") {
        console.log("Displaying notification for new message...");

        new Notification("New message from " + latestMessage.name, {
          body: latestMessage.message,
          icon: "/path-to-your-icon.png", // Ensure the icon path is correct
        });
      } else {
        console.log("Notification permission not granted.");
      }
    }
  }, [messages, userId]);

  // Handle Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !formMessage) {
      return setFormStatus("Please fill all fields.");
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

  // Handle Chat Submission
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
      setChatStatus("");
    } catch (err) {
      console.error("Error sending chat:", err);
      setChatStatus("Failed to send message.");
    }
  };

  // Scroll to bottom when new message is added
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread count when inbox is opened
  useEffect(() => {
    if (inboxOpen) {
      setUnreadCount(0);
    }
  }, [inboxOpen]);

  // Show UI only after auth is initialized
  if (!authInitialized) {
    return null;
  }

  return (
    <>
      <section
        id="contact"
        className="section transition-colors duration-300 py-16"
        style={{
          fontFamily: data?.font || "inherit",
          color: dark ? "#fff" : "#000",
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
                    style={{ color: dark ? "#fff" : "#000", backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={data.placeholders.email}
                    className="p-3 rounded focus:ring-2 outline-none transition w-full"
                    style={{ color: dark ? "#fff" : "#000", backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={data.placeholders.message}
                    className="p-3 rounded h-32 sm:h-40 focus:ring-2 outline-none transition w-full resize-none"
                    style={{ color: dark ? "#fff" : "#000", backgroundColor: dark ? "#222" : "#fff" }}
                  />
                  <button
                    type="submit"
                    className="btn w-full sm:w-auto px-4 py-2 rounded transition-transform hover:scale-105 active:scale-95 mx-auto touch-manipulation"
                    style={{ backgroundColor: "#14b8a6", color: "#fff" }}
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
            color: "#fff"
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
            style={{ backgroundColor: dark ? "#111" : "#fff", color: dark ? "#fff" : "#000" }}
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
              {messages.length > 0 ? (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "admin" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className="p-2 rounded-lg max-w-[70%] text-sm sm:text-base"
                      style={{
                        backgroundColor: m.sender === "admin" ? "#14b8a6" : dark ? "#333" : "#e5e7eb",
                        color: m.sender === "admin" ? "#fff" : dark ? "#fff" : "#000",
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

              {/* Typing Indicator for Admin */}
              {adminTyping && <TypingIndicator name="Admin" />}
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
                style={{ color: dark ? "#fff" : "#000", backgroundColor: dark ? "#222" : "#fff" }}
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
