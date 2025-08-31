import React, { useEffect, useState, useRef } from 'react';
import { ref, onValue } from 'firebase/database';   // ✅ use onValue instead of get
import { db } from '../firebase';
import { motion } from 'framer-motion';

interface Certificate {
  title: string;
  img: string;
  link?: string;
}

interface CertificationsData {
  title: string;
  font?: string;
  textColor?: string;
  backgroundColor?: string;
  darkBackgroundColor?: string;
  darkTextColor?: string;
  items: Certificate[];
}

export default function Certifications() {
  const [data, setData] = useState<CertificationsData | null>(null);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [selected, setSelected] = useState<Certificate | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 🔹 Real-time Firebase subscription
    const certRef = ref(db, 'certifications');
    const unsubscribe = onValue(certRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      } else {
        setData(null);
      }
    });

    // 🔹 Watch for dark mode toggle
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      unsubscribe(); // ✅ remove Firebase listener
      observer.disconnect(); // ✅ stop observer
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount =
      direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
    scrollRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!data) return null;

  return (
    <section
      id="certifications"
      className="section py-16 transition-colors duration-300"
      style={{
        fontFamily: data.font || 'inherit',
        backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
        color: isDark ? data.darkTextColor : data.textColor,
      }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-10 text-center">{data.title}</h2>

        <div className="relative">
          {/* Left Scroll */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={() => scroll('left')}
          >
            &#8592;
          </button>

          {/* Scrollable Certificates */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4"
          >
            {data.items.map((cert, i) => (
              <motion.div
                key={i}
                className="flex-shrink-0 w-64 sm:w-72 md:w-80 cursor-pointer rounded-xl shadow-md transition-transform duration-300"
                style={{ perspective: 1000 }}
                whileHover={{
                  rotateY: 10,
                  rotateX: 5,
                  scale: 1.05,
                  boxShadow:
                    '0 0 20px rgba(0, 255, 255, 0.6), 0 20px 40px rgba(0,0,0,0.3)',
                }}
                onClick={() => setSelected(cert)}
              >
                <img
                  src={cert.img}
                  alt={cert.title}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg"
                />
                <h3 className="mt-2 text-center font-semibold">{cert.title}</h3>
              </motion.div>
            ))}
          </div>

          {/* Right Scroll */}
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 dark:bg-black/80 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={() => scroll('right')}
          >
            &#8594;
          </button>
        </div>

        {/* Pop-up Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div
              className="p-6 rounded shadow-xl max-w-lg w-full relative transition-colors duration-300"
              style={{
                backgroundColor: isDark ? data.darkBackgroundColor : data.backgroundColor,
                color: isDark ? data.darkTextColor : data.textColor,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <button
                className="absolute top-2 right-2 text-2xl font-bold"
                onClick={() => setSelected(null)}
              >
                &times;
              </button>
              <img
                src={selected.img}
                alt={selected.title}
                className="w-full h-64 object-cover rounded mb-4 cursor-pointer"
                onClick={() => {
                  if (selected.link) window.open(selected.link, '_blank');
                  setSelected(null);
                }}
              />
              <h3 className="text-xl font-bold mb-2">{selected.title}</h3>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
