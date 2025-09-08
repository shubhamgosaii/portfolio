import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

interface ShubhamData {
  name: string;
  subtitle: string;
  image?: string;
  backgroundImage?: string;
  font?: string;
  textColor?: string;
  overlayColor?: string;
  hoverColors?: string[];
}

export default function Shubham({ dark }: { dark: boolean }) {
  const [shubham, setShubham] = useState<ShubhamData | null>(null);
  const [loading, setLoading] = useState(true);

  // 3D rotation for content
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const xSpring = useSpring(rotateX, { stiffness: 100, damping: 15 });
  const ySpring = useSpring(rotateY, { stiffness: 100, damping: 15 });

  // Background motion
  const bgX = useMotionValue(50);
  const bgY = useMotionValue(50);
  const bgXSmooth = useSpring(bgX, { stiffness: 50, damping: 20 });
  const bgYSmooth = useSpring(bgY, { stiffness: 50, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 15;
    const y = -(e.clientY / innerHeight - 0.5) * 15;
    rotateX.set(y);
    rotateY.set(x);

    bgX.set((e.clientX / innerWidth) * 100);
    bgY.set((e.clientY / innerHeight) * 100);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    bgX.set(50);
    bgY.set(50);
  };

  // Firebase real-time listener
  useEffect(() => {
    const shubhamRef = ref(db, "shubham");
    const unsubscribe = onValue(shubhamRef, (snapshot) => {
      if (snapshot.exists()) setShubham(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <section className="section min-h-screen flex items-center justify-center">
        <img
          src="https://i.gifer.com/ZZ5H.gif"
          alt="loading"
          className="w-16 h-16 sm:w-12 sm:h-12"
        />
      </section>
    );

  const colors = shubham?.hoverColors || (dark ? ["#fff"] : ["#111"]);
  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  const renderHoverWords = (text: string) =>
    text.split(" ").map((word, i) => (
      <motion.span
        key={i}
        className="inline-block mr-2 cursor-pointer"
        style={{ color: shubham?.textColor || (dark ? "#FFFFFF" : "#111827") }}
        onMouseEnter={(e) => (e.currentTarget.style.color = randomColor())}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color =
            shubham?.textColor || (dark ? "#FFFFFF" : "#111827"))
        }
        whileHover={{
          scale: 1.3,
          rotateX: Math.random() * 30 - 15,
          rotateY: Math.random() * 30 - 15,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        {word}
      </motion.span>
    ));

  return (
    <motion.section
      id="home"
      className="section min-h-screen flex items-center relative transition-colors duration-500 overflow-hidden px-4 sm:px-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        backgroundImage: shubham?.backgroundImage
          ? `url(${shubham.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: shubham?.font || "inherit",
      }}
      animate={{
        scale: [1, 1.03, 1],
        backgroundPosition: [
          `${bgXSmooth.get()}% ${bgYSmooth.get()}%`,
          `${bgXSmooth.get() + 2}% ${bgYSmooth.get() + 2}%`,
          `${bgXSmooth.get()}% ${bgYSmooth.get()}%`,
        ],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor:
            shubham?.overlayColor || (dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)"),
        }}
      ></div>

      <div className="container grid md:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        {/* Image */}
        <motion.div
          className="flex justify-center md:justify-start"
          style={{
            rotateX: xSpring,
            rotateY: ySpring,
            transformStyle: "preserve-3d",
          }}
        >
          {shubham?.image ? (
            <div className="relative w-36 h-48 sm:w-44 sm:h-56 md:w-64 md:h-80 lg:w-72 lg:h-96 bg-white rounded-lg shadow-2xl flex items-center justify-center">
              <motion.img
                src={shubham.image}
                alt="Shubham"
                className="w-full h-full object-cover rounded-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
              />
            </div>
          ) : (
            <div className="w-36 h-48 sm:w-44 sm:h-56 md:w-64 md:h-80 lg:w-72 lg:h-96 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              Image not found
            </div>
          )}
        </motion.div>

        {/* Text */}
        <div className="flex flex-col gap-4 sm:gap-6 text-center md:text-left">
          {shubham?.name && (
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold"
              style={{
                rotateX: xSpring,
                rotateY: ySpring,
                transformStyle: "preserve-3d",
              }}
            >
              {renderHoverWords(shubham.name)}
            </motion.h1>
          )}
          {shubham?.subtitle && (
            <motion.p
              className="text-lg sm:text-xl md:text-2xl font-medium max-w-xl mx-auto md:mx-0"
              style={{
                rotateX: xSpring,
                rotateY: ySpring,
                transformStyle: "preserve-3d",
              }}
            >
              {renderHoverWords(shubham.subtitle)}
            </motion.p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
