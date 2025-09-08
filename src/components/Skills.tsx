import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { motion } from 'framer-motion';

interface SkillsList {
  [key: string]: string[];
}

interface SkillItem {
  category: string;
  list: SkillsList;
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
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

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

  const baseTextColor = isDark
    ? data.darkTextColor || '#ffffff'
    : data.textColor || '#000000';

  const baseBgColor = isDark
    ? data.darkBackgroundColor || '#0b1220'
    : data.backgroundColor || '#ffffff';

  return (
    <section
      id="skills"
      className="py-16 transition-colors duration-500"
      style={{
        backgroundColor: baseBgColor,
        color: baseTextColor,
      }}
    >
      <div className="mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center">
          {data.title}
        </h2>

        {data.items.map((skill, i) => (
          <motion.div
            key={i}
            className="p-8 rounded-2xl shadow-lg transition-all duration-300 w-full"
            style={{
              backgroundColor: baseBgColor,
              color: baseTextColor,
              perspective: 1000,
            }}
            whileHover={{
              rotateY: 5,
              rotateX: 2,
              scale: 1.02,
              boxShadow:
                '0 20px 40px rgba(59, 130, 246, 0.5), 0 0 15px rgba(14, 165, 233, 0.3)',
            }}
          >
            <h3 className="font-bold text-2xl mb-6 text-center">
              {skill.category}
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(skill.list).map(([subCategory, items], idx) => (
                <div key={idx} className="mb-4">
                  <h4 className="font-semibold text-lg mb-2">
                    {subCategory
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())}
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm opacity-90">
                    {items.map((item, j) => (
                      <li key={j}>
                        {item.split(' ').map((word, k) => (
                          <motion.span
                            key={k}
                            className="inline-block mr-1 cursor-pointer"
                            style={{ color: baseTextColor }}
                            whileHover={{
                              color: randomColor(),
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
