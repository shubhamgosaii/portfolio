import React, { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";

interface NavbarProps {
  dark: boolean;
  setDark: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavbarLink {
  id: string;
  label: string;
  children?: NavbarLink[];
}

interface NavbarData {
  font?: string;
  textColor?: string;
  darkTextColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;
  links?: NavbarLink[];
  hoverColors?: string[];
}

export default function Navbar({ dark, setDark }: NavbarProps) {
  const [nav, setNav] = useState<NavbarData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const xSpring = useSpring(rotateX, { stiffness: 100, damping: 15 });
  const ySpring = useSpring(rotateY, { stiffness: 100, damping: 15 });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const navRef = ref(db, "navbar");
    const unsubscribe = onValue(navRef, (snapshot) => {
      if (snapshot.exists()) setNav(snapshot.val());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const bgColor = dark ? nav?.darkBackgroundColor || "#111" : nav?.backgroundColor || "#fff";
  const textColor = dark ? nav?.darkTextColor || "#fff" : nav?.textColor || "#111";
  const links = nav?.links || [];
  const hoverColors = nav?.hoverColors || ["#06b6d4", "#3b82f6", "#f43f5e", "#facc15"];
  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  const HoverLink = ({ label }: { label: string }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <motion.span
        style={{
          rotateX: xSpring,
          rotateY: ySpring,
          display: "inline-block",
          cursor: "pointer",
          color: hovered ? randomColor() : textColor,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{
          scale: 1.15,
          rotateX: Math.random() * 20 - 10,
          rotateY: Math.random() * 20 - 10,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="transition-colors duration-300"
      >
        {label}
      </motion.span>
    );
  };

  return (
    <>
      {/* Header */}
      <motion.header
        className="fixed w-full top-0 left-0 z-50 flex justify-end items-center px-6 py-4 transition-colors duration-300"
        style={{ fontFamily: nav?.font || "inherit", backgroundColor: bgColor }}
      >
        {/* Desktop Navbar (right side) */}
        {!isMobile && (
          <nav className="flex gap-8 items-center justify-end">
            {links.map((l) => {
              if (l.children && l.children.length > 0) {
                return (
                  <div key={l.id} className="relative group">
                    <span
                      className="px-2 py-1 font-semibold capitalize cursor-pointer flex items-center gap-1"
                      style={{ color: textColor }}
                    >
                      <HoverLink label={l.label} />
                      <ChevronDown size={16} />
                    </span>
                    <motion.div
                      className="absolute right-0 mt-2 flex flex-col bg-white dark:bg-gray-900 shadow-lg rounded-lg"
                      initial={{ opacity: 0, y: -10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {l.children.map((child) => (
                        <a
                          key={child.id}
                          href={"#" + child.id}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          style={{ color: textColor }}
                        >
                          <HoverLink label={child.label} />
                        </a>
                      ))}
                    </motion.div>
                  </div>
                );
              }
              return (
                <a
                  key={l.id}
                  href={"#" + l.id}
                  className="px-2 py-1 font-semibold capitalize"
                  style={{ color: textColor }}
                >
                  <HoverLink label={l.label} />
                </a>
              );
            })}
            <button
              onClick={() => setDark(!dark)}
              className="ml-6 p-2 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {dark ? <Moon size={22} /> : <Sun size={22} />}
            </button>
          </nav>
        )}

        {/* Mobile Menu Button (right corner) */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
            style={{ color: textColor }}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        )}
      </motion.header>

      {/* Mobile Sidebar (slide from right) */}
      {menuOpen && isMobile && (
        <motion.div
          ref={menuRef}
          className="fixed top-0 right-0 h-full w-64 backdrop-blur-lg shadow-xl z-50 p-6 flex flex-col transition-colors duration-300"
          style={{ backgroundColor: bgColor, color: textColor }}
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex flex-col gap-6 mt-4">
            {links.map((l) => {
              if (l.children && l.children.length > 0) {
                return (
                  <div key={l.id} className="flex flex-col">
                    <button
                      className="text-lg font-medium flex justify-between items-center"
                      style={{ color: textColor }}
                      onClick={() => setOpenDropdown(openDropdown === l.id ? null : l.id)}
                    >
                      {l.label} <ChevronDown size={18} />
                    </button>
                    {openDropdown === l.id && (
                      <motion.div
                        className="ml-4 mt-2 flex flex-col gap-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {l.children.map((child) => (
                          <a
                            key={child.id}
                            href={"#" + child.id}
                            onClick={() => setMenuOpen(false)}
                            className="text-md font-medium"
                            style={{ color: textColor }}
                          >
                            <HoverLink label={child.label} />
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              }
              return (
                <a
                  key={l.id}
                  href={"#" + l.id}
                  onClick={() => setMenuOpen(false)}
                  className="text-lg font-medium transition-colors duration-300"
                  style={{ color: textColor }}
                >
                  <HoverLink label={l.label} />
                </a>
              );
            })}
            <button
              onClick={() => setDark(!dark)}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {dark ? <Moon size={20} /> : <Sun size={20} />}
              {dark ? "Dark Mode" : "Light Mode"}
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
