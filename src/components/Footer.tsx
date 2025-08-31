import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'framer-motion';

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

  const bgColor = isDark ? data?.darkBackgroundColor : data?.backgroundColor;
  const textColor = isDark ? data?.darkTextColor : data?.textColor;

  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  return (
    <footer
      style={{
        fontFamily: data?.font || 'inherit',
        backgroundColor: bgColor,
        color: textColor,
      }}
      className="py-8 transition-colors duration-300"
    >
      <div className="mx-auto max-w-8xl px-4 md:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <motion.div className="cursor-default" whileHover={{ rotateY: 5, rotateX: 3, scale: 1.02 }}>
          {data?.copyright}
        </motion.div>

        <div className="flex gap-4 flex-wrap">
          {data?.socials?.map((s, i) => (
            <motion.a
              key={i}
              href={s.link}
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-full shadow-md transition-transform duration-300"
              style={{ backgroundColor: isDark ? '#111' : '#fff', color: isDark ? '#fff' : '#111' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = randomColor(); }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? '#fff' : '#111'; }}
              whileHover={{ scale: 1.2, rotateX: 5, rotateY: 5 }}
            >
              <img src={s.icon} className="w-5 h-5" alt="" />
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
