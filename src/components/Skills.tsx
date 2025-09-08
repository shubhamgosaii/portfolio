import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'framer-motion';

interface SkillItem {
  category: string;
  list: string;
}

interface SkillsData {
  title: string;
  items: SkillItem[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  hoverColors?: string[];
}

export default function Skills() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // Default hover colors
  const defaultHoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];

  const randomColor = () => {
    const colors = data?.hoverColors || defaultHoverColors;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    const skillsRef = ref(db, 'skills');
    const unsubscribe = onValue(skillsRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });

    // Observe dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, []);

  if (!data) return <section className="py-10"></section>;

  return (
    <section
      id="skills"
      className="py-16 transition-colors duration-500"
      style={{
        backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
        color: isDark ? data.darkTextColor : data.textColor,
      }}
    >
      <div className="mx-auto max-w-8xl px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">
          {data.title}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {data.items.map((skill, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
                color: isDark ? data.darkTextColor : data.textColor,
                perspective: 1000,
              }}
              whileHover={{
                rotateY: 10,
                rotateX: 5,
                scale: 1.05,
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = randomColor())}
              onMouseLeave={e => (e.currentTarget.style.color = isDark ? data.darkTextColor || '' : data.textColor || '')}
            >
              <h4 className="font-semibold text-lg mb-2">{skill.category}</h4>
              <p className="text-sm opacity-80">{skill.list}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
