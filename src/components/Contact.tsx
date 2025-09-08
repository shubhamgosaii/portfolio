import React, { useEffect, useState, useRef } from "react";
import { ref, onValue, push, get } from "firebase/database";
import { db, auth } from "../firebase";
import { MessageCircle, X } from "lucide-react";
import { onAuthStateChanged, signInAnonymously, User } from "firebase/auth";

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
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState(localStorage.getItem("contactSubmitted") === "true");
  const [inboxOpen, setInboxOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("chatUserId"));
  const [user, setUser] = useState<User | null>(null);
  const [iconBottom, setIconBottom] = useState(24);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Firebase anonymous login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) setUser(u);
      else setUser((await signInAnonymously(auth)).user);
    });
    return () => unsub();
  }, []);

  // Load contact data
  useEffect(() => {
    const contactRef = ref(db, "contact");
    return onValue(contactRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });
  }, []);

  // Load messages for this email-based userId
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
      } else {
        setMessages([]);
      }
    });
  }, [userId]);

  // Auto-scroll chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, inboxOpen]);

  // Adjust floating icon above footer
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector("#footer");
      if (!footer) return;
      const footerRect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      setIconBottom(
        footerRect.top < windowHeight - 80 ? windowHeight - footerRect.top + 24 : 24
      );
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const isValidEmail = (mail: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  // 🚀 If user has localStorage email, auto-load chat (skip form)
  useEffect(() => {
    if (localStorage.getItem("chatEmail") && localStorage.getItem("chatUserId")) {
      setSubmitted(true);
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !formMessage) {
      setStatus("Please fill all fields.");
      return;
    }
    if (!isValidEmail(email)) {
      setStatus("Please enter a valid email.");
      return;
    }
    if (!user) {
      setStatus("Initializing user... please wait a moment.");
      return;
    }

    try {
      // 🔎 1. Check if email already exists in database
      const allMessagesRef = ref(db, "messages");
      const snapshot = await get(allMessagesRef);

      let existingUserId: string | null = null;
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const msgs = child.val();
          Object.values(msgs).forEach((msg: any) => {
            if (msg.email === email) {
              existingUserId = msg.userId;
            }
          });
        });
      }

      let finalUserId = existingUserId || user.uid;

      // If no existing chat, push first message
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

      // ✅ Save to localStorage
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
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message.");
    }
  };

  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        className="section transition-colors duration-300 py-16"
        style={{
          fontFamily: data?.font || "inherit",
          color: dark ? data?.darkTextColor || "#fff" : data?.textColor || "#000",
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
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={data.placeholders.email}
                    className="p-3 rounded focus:ring-2 outline-none transition w-full"
                  />
                  <textarea
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={data.placeholders.message}
                    className="p-3 rounded h-32 sm:h-40 focus:ring-2 outline-none transition w-full resize-none"
                  />
                  <button
                    type="submit"
                    className="btn w-full sm:w-auto px-4 py-2 rounded transition-transform hover:scale-105 active:scale-95 mx-auto touch-manipulation"
                    style={{
                      backgroundColor: data.buttonBgColor || "#14b8a6",
                      color: data.buttonTextColor || "#000",
                    }}
                  >
                    {data.buttonText}
                  </button>
                  {status && <p className="text-center text-slate-400 mt-2">{status}</p>}
                </form>
              ) : (
                <p className="text-center text-xl sm:text-2xl text-teal-500 mt-4">
                  Thank you for your message! 😊
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {/* Floating Chat Icon */}
      {submitted && (
        <button
          onClick={() => setInboxOpen(!inboxOpen)}
          className="fixed right-3 sm:right-4 p-4 rounded-full shadow-lg"
          style={{
            bottom: `${iconBottom + 100}px`,
            zIndex: 50,
            backgroundColor: dark ? "#0f766e" : "#14b8a6",
            color: "#fff",
          }}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Inbox */}
      {inboxOpen && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 w-[90vw] sm:w-[320px] max-h-[70vh] shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50"
          style={{
            backgroundColor: dark ? "#111" : "#fff",
            color: dark ? "#fff" : "#000",
          }}
        >
          <div
            className="flex justify-between items-center p-3"
            style={{ backgroundColor: "#14b8a6", color: "#fff" }}
          >
            <h3 className="font-semibold">Chat</h3>
            <button onClick={() => setInboxOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length > 0 ? (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
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
              <p className="text-center">{dark ? "No messages yet." : "No messages yet."}</p>
            )}
            <div ref={scrollRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border p-2 rounded"
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
