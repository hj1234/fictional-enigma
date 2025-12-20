"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Major world cities coordinates (matching world.svg viewBox: 0 0 2000 857)
// Coordinates converted from lat/long to SVG coordinates
const WORLD_LOCATIONS = [
  { name: 'New York', x: 500, y: 343 },        // ~40.7°N, 74°W
  { name: 'London', x: 960, y: 257 },         // ~51.5°N, 0°W
  { name: 'Tokyo', x: 1700, y: 386 },         // ~35.7°N, 139.8°E
  { name: 'Hong Kong', x: 1600, y: 429 },     // ~22.3°N, 114.2°E
  { name: 'Singapore', x: 1560, y: 515 },     // ~1.3°N, 103.8°E
  { name: 'Dubai', x: 1200, y: 429 },         // ~25.3°N, 55.3°E
  { name: 'Zurich', x: 1000, y: 300 },        // ~47.4°N, 8.5°E
  { name: 'Sydney', x: 1760, y: 643 },        // ~33.9°S, 151.2°E
  { name: 'San Francisco', x: 300, y: 360 },  // ~37.8°N, 122.4°W
  { name: 'Chicago', x: 440, y: 343 },        // ~41.9°N, 87.6°W
  { name: 'Frankfurt', x: 1000, y: 274 },     // ~50.1°N, 8.7°E
  { name: 'Paris', x: 960, y: 274 },          // ~48.9°N, 2.4°E
  { name: 'Shanghai', x: 1560, y: 386 },      // ~31.2°N, 121.5°E
  { name: 'Mumbai', x: 1360, y: 446 },        // ~19.1°N, 72.9°E
  { name: 'São Paulo', x: 640, y: 600 },      // ~23.6°S, 46.6°W
  { name: 'Toronto', x: 480, y: 326 },        // ~43.7°N, 79.4°W
  { name: 'Seoul', x: 1640, y: 360 },         // ~37.6°N, 127°E
  { name: 'Moscow', x: 1160, y: 240 },        // ~55.8°N, 37.6°E
  { name: 'Buenos Aires', x: 600, y: 686 },   // ~34.6°S, 58.4°W
  { name: 'Johannesburg', x: 1100, y: 669 },  // ~26.2°S, 28°E
];

export default function WorldMap() {
  const [flashes, setFlashes] = useState([]);

  useEffect(() => {
    // Generate initial flashes
    const generateFlash = () => {
      const location = WORLD_LOCATIONS[Math.floor(Math.random() * WORLD_LOCATIONS.length)];
      const id = Date.now() + Math.random();
      return {
        id,
        ...location,
      };
    };

    // Create initial flashes
    const initialFlashes = Array.from({ length: 8 }, generateFlash);
    setFlashes(initialFlashes);

    // Add new flashes periodically
    const interval = setInterval(() => {
      setFlashes((prev) => {
        // Remove old flashes (keep last 15 to prevent too many DOM elements)
        const filtered = prev.slice(-15);
        // Add 1-2 new flashes randomly
        const newFlashes = Array.from({ length: Math.random() > 0.5 ? 1 : 2 }, generateFlash);
        return [...filtered, ...newFlashes];
      });
    }, 1200); // New flash every 1.2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      <div 
        className="absolute inset-0 w-full h-full opacity-20"
        style={{
          backgroundImage: 'url(/world.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.2) sepia(1) hue-rotate(15deg) saturate(0.3)',
        }}
      />
      <svg
        viewBox="0 0 2000 857"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >

        {/* Fund launch flashes */}
        {flashes.map((flash) => (
          <g key={flash.id} transform={`translate(${flash.x}, ${flash.y})`}>
            {/* Expanding pulse ring - outer */}
            <motion.circle
              cx="0"
              cy="0"
              r="8"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{
                duration: 2.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
            {/* Expanding pulse ring - inner */}
            <motion.circle
              cx="0"
              cy="0"
              r="6"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{
                duration: 2.5,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.1,
              }}
            />
            {/* Inner bright flash */}
            <motion.circle
              cx="0"
              cy="0"
              r="4"
              fill="#f59e0b"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 2.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
            {/* Core glow */}
            <motion.circle
              cx="0"
              cy="0"
              r="6"
              fill="#f59e0b"
              style={{ filter: 'blur(2px)' }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 2.5,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
