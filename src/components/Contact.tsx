import React, { useEffect, useState, useRef } from "react";
import { ref, push, get, onValue, set, onDisconnect } from "firebase/database";
import { db, auth } from "../firebase";
import { MessageCircle, X } from "lucide-react";
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

interface ContactData {
  heading: string;
  placeholders: {
    name: string;
    email: string;
    message: string;
  };
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
  const [status, setStatus] = useState("");    
  const [submitted, setSubmitted] = useState(localStorage.getItem("contactSubmitted") === "true");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("chatUserId"));    
  const [user, setUser] = useState<User | null>(null);
  const [typing, setTyping] = useState(false); 
  const [adminTyping, setAdminTyping] = useState(false);
  const [iconShake, setIconShake] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // Unread message count
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setUser(u);
      else setUser((await signInAnonymously(auth)).user);
    });
    return () => unsub();
  }, []);

  // Fetch contact data
  useEffect(() => {
    const contactRef = ref(db, "contact");     
    return onValue(contactRef, (snapshot) => { 
      if (snapshot.exists()) setData(snapshot.val());
    });
  }, []);

  // Listen for messages
  useEffect(() => {
    if (!userId) return;
    const userMessagesRef = ref(db, `messages/${userId}`);
    return onValue(userMessagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const msgs: Message[] = Object.keys(snapshot.val()).map((id) => ({
          id,
          ...snapshot.val()[id],
        }));
        setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));

        // Update unread count
        if (!inboxOpen) {
          const unreadMessages = msgs.filter((msg) => msg.createdAt > (localStorage.getItem("lastRead") || 0));
          setUnreadCount(unreadMessages.length);
        } else {
          setUnreadCount(0); // Reset when inbox is open
        }
      } else setMessages([]);
    });
  }, [userId, inboxOpen]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, inboxOpen]);

  // Typing indicator (user)
  useEffect(() => {
    if (!userId) return;
    const typingRef = ref(db, `typing/${userId}/user`);
    if (formMessage.trim()) {
      set(typingRef, true);
      setTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        set(typingRef, false);
        setTyping(false);
      }, 1500);
    } else {
      set(typingRef, false);
      setTyping(false);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [formMessage, userId]);

  // Listen for admin typing
  useEffect(() => {
    if (!userId) return;
    const adminTypingRef = ref(db, `typing/${userId}/admin`);
    return onValue(adminTypingRef, (snapshot) => {
      setAdminTyping(snapshot.val() || false); 
    });
  }, [userId]);

  // Check if already submitted
  useEffect(() => {
    if (localStorage.getItem("chatEmail") && localStorage.getItem("chatUserId")) {
      setSubmitted(true);
    }
  }, []);

  const isValidEmail = (mail: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  // Initial form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !formMessage) return setStatus("Please fill all fields.");
    if (!isValidEmail(email)) return setStatus("Please enter a valid email.");
    if (!user) return setStatus("Initializing user... please wait.");

    try {
      const allMessagesRef = ref(db, "messages");
      const snapshot = await get(allMessagesRef);
      let existingUserId: string | null = null;

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const msgs = child.val();
          Object.values(msgs).forEach((msg: any) => {
            if (msg.email === email) existingUserId = msg.userId;
          });
        });
      }

      const finalUserId = existingUserId || user.uid;
      if (!existingUserId) {
        await push(ref(db, `messages/${finalUserId}`), {
          userId: finalUserId,
          name,
          email,
          message: formMessage,
          createdAt: Date.now(),
          sender: "user",
        });
      }

      localStorage.setItem("contactSubmitted", "true");
      localStorage.setItem("chatName", name);  
      localStorage.setItem("chatEmail", email);
      localStorage.setItem("chatUserId", finalUserId);
      setUserId(finalUserId);
      setSubmitted(true);
      setFormMessage("");
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message.");    
    }
  };

  // Chat submit
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim() || !userId) return;
    try {
      await push(ref(db, `messages/${userId}`), {
        userId,
        name: localStorage.getItem("chatName") || "Guest",
        email: localStorage.getItem("chatEmail") || "unknown",
        message: formMessage.trim(),
        createdAt: Date.now(),
        sender: "user",
      });
      setFormMessage("");
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message.");    
    }
  };

  // Typing indicator UI
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
        .dots span:nth-child(1) {
          animation-delay: 0s;
        }
        .dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 20%, 50%, 80%, 100% { opacity: 0; }
          10%, 30%, 60%, 90% { opacity: 1; }   
        }
      `}</style>
    </div>
  );

  const textColor = dark ? "#fff" : "#000";    

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
  }, []);

  useEffect(() => {
    if (!inboxOpen && messages.length > 0) {   
      const latest = messages[messages.length - 1];
      if (latest.sender === "admin" && Notification.permission === "granted") {
        new Notification("New message from Admin", {
          body: latest.message,
          icon: "/path-to-your-icon.png", // Ensure the icon path is correct
        });
      }
    }
  }, [messages, inboxOpen]);

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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: textColor }}>
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
                  {status && <p className="text-center mt-2" style={{ color: textColor }}>{status}</p>}
                </form>
              ) : (
                <p className="text-center text-xl sm:text-2xl mt-4" style={{ color: textColor }}>
                  Thank you for your message!  😊
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Chat Icon */}
      {submitted && (
        <motion.button
  onClick={() => {
    setInboxOpen(!inboxOpen);
    if (!inboxOpen) {
      // Reset unread count when the inbox is opened
      setUnreadCount(0);
      // You can also set a timestamp for last read
      localStorage.setItem("lastRead", Date.now().toString());
    }
  }}
  animate={iconShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
  transition={{ duration: 0.6 }}
  className="fixed right-4 p-4 rounded-full shadow-lg"
  style={{
    bottom: `${124}px`,
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
      {inboxOpen && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 w-[90vw] sm:w-[320px] max-h-[70vh] shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50"
          style={{ backgroundColor: dark ? "#111" : "#fff", color: textColor }}
        >
          <div className="flex justify-between items-center p-3" style={{ backgroundColor: "#14b8a6", color: "#fff" }}>
            <h3 className="font-semibold">Chat</h3>
            <button onClick={() => setInboxOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-start" : "justify-end"}`}>
                <div
                  className="p-2 rounded-lg max-w-[70%] text-sm sm:text-base"
                  style={{
                    backgroundColor: m.sender === "admin" ? dark ? "#333" : "#e5e7eb" : "#14b8a6",
                    color: m.sender === "admin" ? textColor : "#fff",
                  }}
                >
                  <strong>{m.name}</strong>    
                  <p>{m.message}</p>
                  <span className="text-[10px] block mt-1 opacity-70">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {/* Admin Typing Indicator */}     
            {adminTyping && <TypingIndicator name="Admin" />}
            <div ref={scrollRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Type a message..."  
              className="flex-1 border p-2 rounded"
              style={{ color: textColor, backgroundColor: dark ? "#222" : "#fff" }}
            />
            <button type="submit" className="px-4 py-2 rounded bg-teal-600 text-white">       
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
