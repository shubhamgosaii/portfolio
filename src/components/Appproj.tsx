import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

interface Project {
  title: string;
  description?: string;
  img?: string;
  images?: string[];
  link?: string;
}

interface appprojectsData {
  title: string;
  items: Project[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  hoverTextColor?: string;
  hoverColors?: string[];
}

const ImageSlider: React.FC<{ images: string[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!images.length) return;

    const startSlider = () => {
      intervalRef.current = setInterval(
        () => setIndex((prev) => (prev + 1) % images.length),
        1500
      );
    };

    if (!paused) startSlider();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [images, paused]);

  if (!images.length) return null;

  return (
    <div
      className="w-full aspect-video relative rounded-lg overflow-hidden shadow-md min-h-[200px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index]}
          alt="project"
          className="absolute inset-0 w-full h-full object-cover rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>
    </div>
  );
};

export default function appprojects() {
  const [data, setData] = useState<appprojectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const defaultHoverColors = ['#06b6d4', '#3b82f6', '#f43f5e', '#facc15'];
  const randomColor = () => {
    const colors = data?.hoverColors || defaultHoverColors;
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderWordByWord = (text: string) =>
    text.split(' ').map((word, idx) => (
      <motion.span
        key={idx}
        className="inline-block mr-1 cursor-pointer"
        style={{ color: isDark ? data?.darkTextColor || '#fff' : data?.textColor || '#000' }}
        whileHover={{ color: randomColor(), scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        {word}
      </motion.span>
    ));

  useEffect(() => {
    const projectsRef = ref(db, 'appprojects'); // ✅ pull from appprojects
    const unsubscribe = onValue(projectsRef, (s) => {
      if (s.exists()) setData(s.val());
      setLoading(false);
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

  if (loading) return <section id="appprojects" className="section py-16 md:py-20"></section>;

  return (
    <motion.section
      id="appprojects"
      className="section py-16 md:py-20 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
        color: isDark ? data?.darkTextColor : data?.textColor,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      <div className="mx-auto px-8 md:px-12 lg:px-16 max-w-8xl relative">
        <h2 className="text-3xl font-bold mb-10 text-center">{data?.title || 'Web Projects'}</h2>

        <div className="flex flex-col gap-16 overflow-visible no-scrollbar">
          {data?.items.map((p, i) => (
            <motion.div
              key={i}
              className="relative flex flex-col md:flex-row items-center gap-6 px-4 md:px-6 overflow-visible"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Image Card */}
              <motion.div
                className="flex-1 relative cursor-pointer z-20 rounded-xl overflow-visible max-w-full"
                style={{ perspective: 1200 }}
                whileHover={{
                  rotateY: 12,
                  rotateX: 6,
                  scale: 1.08,
                  boxShadow: '0 0 25px rgba(0, 123, 255, 0.7), 0 25px 50px rgba(0,0,0,0.35)',
                  transition: { duration: 0.4 },
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => setSelectedProject(p)}
              >
                <ImageSlider images={p.images || (p.img ? [p.img] : [])} />
              </motion.div>

              {/* Text Card */}
              <motion.div
                className="-ml-0 md:-ml-16 flex-1 rounded-xl z-10 relative cursor-pointer transition-all duration-300 overflow-visible"
                style={{
                  backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
                  color: isDark ? data?.darkTextColor : data?.textColor,
                  perspective: 1200,
                }}
                whileHover={{
                  rotateY: -12,
                  rotateX: -6,
                  scale: 1.08,
                  boxShadow: '0 0 25px rgba(0, 123, 255, 0.7), 0 25px 50px rgba(0,0,0,0.35)',
                  transition: { duration: 0.4 },
                  transformStyle: 'preserve-3d',
                }}
                onClick={() => setSelectedProject(p)}
              >
                <div className="pl-8 md:pl-12 lg:pl-16">
                  <h3 className="text-xl font-semibold">{renderWordByWord(p.title)}</h3>
                  {p.description && <p className="mt-2">{renderWordByWord(p.description)}</p>}
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
                </div>
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

              <div
                className="mb-4 cursor-pointer"
                onClick={() => {
                  if (selectedProject.link) window.open(selectedProject.link, '_blank');
                  setSelectedProject(null);
                }}
              >
                <ImageSlider images={selectedProject.images || (selectedProject.img ? [selectedProject.img] : [])} />
              </div>

              <h3 className="text-xl font-bold mb-2">{renderWordByWord(selectedProject.title)}</h3>
              {selectedProject.description && <p className="mb-4">{renderWordByWord(selectedProject.description)}</p>}
            </motion.div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
