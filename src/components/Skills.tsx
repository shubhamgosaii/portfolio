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

  const hoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];
  const randomColor = () => hoverColors[Math.floor(Math.random() * hoverColors.length)];

  useEffect(() => {
    const skillsRef = ref(db, 'skills');
    const unsubscribe = onValue(skillsRef, (s) => {
      if (s.exists()) setData(s.val());
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

  if (!data) return <section className="py-10"></section>;

  return (
    <section
      id="skills"
      className="py-16 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
        color: isDark ? data.darkTextColor : data.textColor,
      }}
    >
      <div className="mx-auto max-w-8xl px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-6 text-center">{data.title}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {data.items.map((skill, i) => (
            <motion.div
              key={i}
              className="p-6 rounded-xl shadow-md cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
                color: isDark ? data.darkTextColor : data.textColor,
                perspective: 1000,
              }}
              whileHover={{ rotateY: 10, rotateX: 5, scale: 1.05 }}
              onMouseEnter={e => (e.currentTarget.style.color = randomColor())}
              onMouseLeave={e => (e.currentTarget.style.color = isDark ? data.darkTextColor : data.textColor)}
            >
              <h4 className="font-semibold text-lg">{skill.category}</h4>
              <p className="mt-1 text-sm">{skill.list}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
