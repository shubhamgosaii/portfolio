import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'framer-motion';

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
}

interface EducationData {
  title: string;
  items: EducationItem[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
}

export default function Education() {
  const [data, setData] = useState<EducationData | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const hoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];
  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  useEffect(() => {
    get(ref(db, 'education')).then((snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!data) return <section className="py-10"></section>;

  return (
    <section
      id="education"
      className="section py-10 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
        color: isDark ? data.darkTextColor : data.textColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-10 text-center">
          {data.title}
        </h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((edu, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300 touch-manipulation"
              style={{
                backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
                color: isDark ? data.darkTextColor : data.textColor,
                perspective: 1000,
              }}
              whileHover={{ rotateY: 10, rotateX: 5, scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = randomColor())
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isDark
                  ? data.darkTextColor || ''
                  : data.textColor || '')
              }
            >
              <h3 className="font-semibold text-lg sm:text-xl md:text-xl">{edu.degree}</h3>
              <p className="mt-1 text-sm sm:text-base">{edu.institution}</p>
              <p className="mt-1 text-xs sm:text-sm opacity-70">{edu.year}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
