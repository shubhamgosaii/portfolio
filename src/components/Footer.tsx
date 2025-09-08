import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

interface SocialLink {
  icon: string;
  link: string;
}

interface FooterData {
  font?: string;
  textColor?: string;
  darkTextColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;
  socials?: SocialLink[];
  copyright: string;
}

export default function Footer() {
  const [data, setData] = useState<FooterData | null>(null);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "footer"), (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, []);

  const bgColor = isDark
    ? data?.darkBackgroundColor || "#111"
    : data?.backgroundColor || "#fff";
  const textColor = isDark
    ? data?.darkTextColor || "#fff"
    : data?.textColor || "#111";

  return (
    <footer
      style={{
        fontFamily: data?.font || "inherit",
        backgroundColor: bgColor,
        color: textColor,
      }}
      className="py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 transition-colors duration-300"
    >
      <div className="mx-auto max-w-8xl flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        {/* Copyright (left on desktop, bottom on mobile) */}
        <motion.div
          className="cursor-default text-sm sm:text-base text-center sm:text-left order-2 sm:order-1 w-full sm:w-auto"
          whileHover={{ rotateY: 5, rotateX: 3, scale: 1.02 }}
        >
          {data?.copyright}
        </motion.div>

        {/* Social Links (top on mobile, right on desktop) */}
        <div className="flex gap-3 justify-center sm:justify-end order-1 sm:order-2">
          {data?.socials?.map((s, i) => (
            <motion.a
              key={i}
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="transition-transform duration-300 touch-manipulation"
              whileHover={{ scale: 1.2, rotateX: 5, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={s.icon}
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                alt="social"
                style={{
                  filter: isDark
                    ? "invert(100%) brightness(200%)"
                    : "invert(0%)",
                }}
              />
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
