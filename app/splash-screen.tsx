"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-main"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-2"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path
                  d="M10 26 L18 10 L26 26"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 21 H23"
                  stroke="#000"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            <motion.h1
              className="text-4xl font-bold tracking-[-0.04em] text-text-primary uppercase"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              Discipline
            </motion.h1>

            <motion.p
              className="text-sm text-text-muted tracking-[0.12em] uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              Соревнуйся. Расти. Побеждай.
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
