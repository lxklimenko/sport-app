"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.32, 0.72, 0, 1]
      }}
      className="flex-1 flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}