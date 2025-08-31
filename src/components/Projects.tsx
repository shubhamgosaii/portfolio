import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ref, onValue } from 'firebase/database';  // ✅ changed here
import { db } from '../firebase';

interface Project {
  title: string;
  description?: string;
  img: string;
  link?: string;
}

interface ProjectsData {
  title: string;
  items: Project[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  hoverTextColor?: string; // hover text color for the right-side card
}

export default function Projects() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // ✅ replaced get() with onValue()
    const projectsRef = ref(db, 'projects');
    const unsubscribe = onValue(projectsRef, (s) => {
      if (s.exists()) setData(s.val());
      setLoading(false);
    });

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      unsubscribe(); // ✅ cleanup firebase listener
      observer.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <section
        id="projects"
        className="section py-10"
        style={{
          backgroundColor: data
            ? isDark
              ? data.darkBackgroundColor
              : data.backgroundColor
            : undefined,
          color: data
            ? isDark
              ? data.darkTextColor
              : data.textColor
            : undefined,
        }}
      >
        <div className="mx-auto px-8 md:px-12 lg:px-16 max-w-8xl relative"></div>
      </section>
    );
  }

  return (
    <section
      id="projects"
      className="section py-10 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
        color: isDark ? data?.darkTextColor : data?.textColor,
      }}
    >
      <div className="mx-auto px-8 md:px-12 lg:px-16 max-w-8xl relative">
        <h2 className="text-3xl font-bold mb-10 text-center">{data?.title || 'Projects'}</h2>

        <div className="flex flex-col gap-16 overflow-x-hidden no-scrollbar">
          {data?.items.map((p, i) => (
            <motion.div
              key={i}
              className="relative flex flex-row items-center gap-6 perspective-1000 px-4 md:px-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Image Card */}
              <motion.div
                className="flex-1 relative cursor-pointer z-20 rounded-xl overflow-hidden"
                style={{ perspective: 1000 }}
                whileHover={{
                  rotateY: 10,
                  rotateX: 5,
                  scale: 1.05,
                  boxShadow:
                    '0 0 20px rgba(0, 255, 255, 0.6), 0 20px 40px rgba(0,0,0,0.3)',
                }}
                onClick={() => setSelectedProject(p)}
              >
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                  loading="lazy"
                />
              </motion.div>

              {/* Text Card */}
              <motion.div
                className="-ml-16 flex-1 p-6 rounded-xl z-10 relative cursor-pointer transition-all duration-300"
                style={{
                  backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
                  color: isDark ? data?.darkTextColor : data?.textColor,
                  perspective: 1000,
                }}
                whileHover={{
                  rotateY: -10,
                  rotateX: -5,
                  scale: 1.05,
                  boxShadow:
                    '0 0 20px rgba(0, 255, 255, 0.6), 0 20px 40px rgba(0,0,0,0.3)',
                  color: isDark
                    ? data?.hoverTextColor || '#00ffff'
                    : data?.hoverTextColor || '#006064',
                  transition: { duration: 0.3 }, // smooth color transition
                }}
                onClick={() => setSelectedProject(p)}
              >
                <h3 className="text-xl font-semibold">{p.title}</h3>
                {p.description && <p className="mt-2">{p.description}</p>}
                {p.link && (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 hover:underline"
                  >
                    View Project →
                  </a>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <motion.div
              className="p-6 rounded shadow-xl max-w-lg w-full relative transition-colors duration-300"
              style={{
                backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
                color: isDark ? data?.darkTextColor : data?.textColor,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                className="absolute top-2 right-2 text-2xl font-bold"
                onClick={() => setSelectedProject(null)}
              >
                &times;
              </button>

              <img
                src={selectedProject.img}
                alt={selectedProject.title}
                className="w-full h-64 object-cover rounded mb-4 cursor-pointer"
                onClick={() => {
                  if (selectedProject.link) window.open(selectedProject.link, '_blank');
                  setSelectedProject(null);
                }}
              />
              <h3 className="text-xl font-bold mb-2">{selectedProject.title}</h3>
              {selectedProject.description && <p className="mb-4">{selectedProject.description}</p>}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
