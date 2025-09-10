// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

// Portfolio components
import Navbar from "./components/Navbar";
import Shubham from "./components/Shubham";
import Education from "./components/Education";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import Appproj from "./components/Appproj";
import Webproj from "./components/Webproj";
import Certifications from "./components/Certifications";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

// Admin components
import AdminLogin from "./components/AdminLogin";
import AdminInbox from "./components/AdminInbox";

// Auth Context
import { useAuth } from "./context/AuthContext";
import { ADMIN_EMAIL } from "./config";



function App() {
  const [dark, setDark] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("dark-mode", JSON.stringify(dark));
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("dark-mode");
    if (saved) setDark(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const homeSection = document.getElementById("home");
    if (homeSection) homeSection.scrollIntoView({ behavior: "auto" });
  }, []);

  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const sectionId = target.getAttribute("href")!.slice(1);
        const section = document.getElementById(sectionId);
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }
    };
    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  // Loading GIF while Firebase restores session
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <img
          src="https://i.gifer.com/ZZ5H.gif" // small loading GIF
          alt="Loading..."
          className="w-16 h-16"
        />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Portfolio */}
        <Route
          path="/"
          element={
            <>
              <Navbar dark={dark} setDark={setDark} />
              <Shubham dark={dark} />
              <Education dark={dark} />
              <Experience dark={dark} />
              <Skills dark={dark} />
              <Webproj dark={dark} />
              <Appproj dark={dark} />
              <Certifications dark={dark} />
              <Contact dark={dark} />
              <Footer dark={dark} />
            </>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            user?.email === ADMIN_EMAIL ? (
              <AdminInbox dark={dark} />
            ) : (
              <AdminLogin />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
