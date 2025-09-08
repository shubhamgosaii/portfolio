import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

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
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const hoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];

  useEffect(() => {
    const unsubscribe = onValue(ref(db, 'footer'), (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, []);

  const bgColor = isDark ? data?.darkBackgroundColor || '#111' : data?.backgroundColor || '#fff';
  const textColor = isDark ? data?.darkTextColor || '#fff' : data?.textColor || '#111';

  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  return (
    <footer
      style={{
        fontFamily: data?.font || 'inherit',
        backgroundColor: bgColor,
        color: textColor,
      }}
      className="py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 transition-colors duration-300"
    >
      <div className="mx-auto max-w-8xl flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Copyright */}
        <motion.div
          className="cursor-default text-sm sm:text-base text-center sm:text-left"
          whileHover={{ rotateY: 5, rotateX: 3, scale: 1.02 }}
        >
          {data?.copyright}
        </motion.div>

        {/* Social Links */}
        <div className="flex gap-3 flex-wrap justify-center sm:justify-start mt-2 sm:mt-0">
          {data?.socials?.map((s, i) => (
            <motion.a
              key={i}
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-md transition-transform duration-300 touch-manipulation"
              style={{
                backgroundColor: isDark ? '#fff' : '#111', // white in dark, black in light
                color: isDark ? '#111' : '#fff',           // icon color opposite background
                padding: '0.25rem',                        // smaller padding
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = randomColor();
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = isDark ? '#111' : '#fff';
              }}
              whileHover={{ scale: 1.2, rotateX: 5, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={s.icon} className="w-4 h-4 sm:w-5 sm:h-5" alt="" />
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
