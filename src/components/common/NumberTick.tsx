import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

export default function NumberTick({ value, prefix = '₹', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate(value) {
        setDisplayValue(Math.floor(value));
      }
    });
    return () => controls.stop();
  }, [value]);

  const format = (n: number) => {
    if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('en-IN');
  };

  return (
    <motion.span layout>
      {prefix}{format(displayValue)}{suffix}
    </motion.span>
  );
}
