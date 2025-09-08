import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'framer-motion';

interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  description?: string;
}

interface ExperienceData {
  title: string;
  items: ExperienceItem[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
}

export default function Experience() {
  const [data, setData] = useState<ExperienceData | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const hoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];
  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  useEffect(() => {
    const experienceRef = ref(db, 'experience');
    const unsubscribe = onValue(experienceRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, []);

  if (!data) return <section className="py-10"></section>;

  return (
    <section
      id="experience"
      className="section py-10 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
        color: isDark ? data.darkTextColor : data.textColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 text-center">{data.title}</h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map((exp, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300 touch-manipulation"
              style={{
                backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
                color: isDark ? data.darkTextColor : data.textColor,
                perspective: 1000,
              }}
              whileHover={{ rotateY: 10, rotateX: 5, scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = randomColor())}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isDark
                  ? data.darkTextColor || ''
                  : data.textColor || '')
              }
            >
              <h3 className="text-lg sm:text-xl md:text-xl font-semibold">{exp.role}</h3>
              <h4 className="text-sm sm:text-base opacity-80 mt-1">
                {exp.company} • {exp.duration}
              </h4>
              {exp.description && <p className="mt-2 text-sm sm:text-base">{exp.description}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
