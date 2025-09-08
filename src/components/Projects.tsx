import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

interface Project {
  title: string;
  description?: string;
  img?: string;          // keep old support
  images?: string[];     // ✅ new array of images
  link?: string;
}

interface ProjectsData {
  title: string;
  items: Project[];
  backgroundColor?: string;
  textColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  hoverTextColor?: string;
}

// ✅ Local Image Slider Component
const ImageSlider: React.FC<{ images: string[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images.length) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="w-full aspect-video relative rounded-lg overflow-hidden shadow-md min-h-[200px]">
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



export default function Projects() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
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
      unsubscribe();
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
              className="relative flex flex-col md:flex-row items-center gap-6 perspective-1000 px-4 md:px-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >


              {/* Image Card with Slider */}
              <motion.div
                className="flex-1 relative cursor-pointer z-20 rounded-xl overflow-hidden"
                style={{ perspective: 1200 }}
                whileHover={{
                  rotateY: 12,           // stronger tilt
                  rotateX: 6,
                  scale: 1.08,           // slightly bigger
                  boxShadow: '0 0 25px rgba(0, 255, 255, 0.7), 0 25px 50px rgba(0,0,0,0.35)',
                  transition: { duration: 0.4 },
                }}
                onClick={() => setSelectedProject(p)}
              >
                <ImageSlider images={p.images || (p.img ? [p.img] : [])} />
              </motion.div>

              {/* Text Card */}
              <motion.div
                className="-ml-0 md:-ml-16 flex-1 p-6 rounded-xl z-10 relative cursor-pointer transition-all duration-300"
                style={{
                  backgroundColor: isDark ? data?.darkBackgroundColor : data?.backgroundColor,
                  color: isDark ? data?.darkTextColor : data?.textColor,
                  perspective: 1200,
                }}
                whileHover={{
                  rotateY: -12,
                  rotateX: -6,
                  scale: 1.08,
                  boxShadow: '0 0 25px rgba(0, 255, 255, 0.7), 0 25px 50px rgba(0,0,0,0.35)',
                  color: isDark ? data?.hoverTextColor || '#00ffff' : data?.hoverTextColor || '#006064',
                  transition: { duration: 0.4 },
                }}
                onClick={() => setSelectedProject(p)}
              >
                <div className="pl-4 md:pl-6 lg:pl-8">
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

              {/* ✅ Modal shows full responsive image */}
              <img
                src={selectedProject.images ? selectedProject.images[0] : selectedProject.img}
                alt={selectedProject.title}
                className="w-full max-h-[70vh] object-contain rounded mb-4 cursor-pointer"
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
