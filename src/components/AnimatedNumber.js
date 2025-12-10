"use client";
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedNumber({ value, formatter, className = "", ...props }) {
  const prevValueRef = useRef(value);
  const [animationKey, setAnimationKey] = useState(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevValueRef.current = value;
      return;
    }

    // Check if value has actually changed
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      // Increment key to force animation restart
      setAnimationKey(prev => prev + 1);
    }
  }, [value]);

  const formattedValue = formatter ? formatter(value) : value;

  return (
    <motion.span
      key={`anim-${animationKey}`}
      className={`inline-block ${className}`}
      initial={animationKey > 0 ? { scale: 1, opacity: 1 } : false}
      animate={animationKey > 0 ? {
        scale: [1, 1.08, 1],
        opacity: [1, 0.7, 1]
      } : undefined}
      transition={{
        duration: 0.6,
        ease: "easeInOut"
      }}
      {...props}
    >
      {formattedValue}
    </motion.span>
  );
}