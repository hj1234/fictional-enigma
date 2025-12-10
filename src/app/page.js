"use client";
import { useState } from 'react';
import GameHome from '@/components/GameHome';
import GameDashboard from '@/components/GameDashboard';

export default function Page() {
  const [gameStarted, setGameStarted] = useState(false);
  const [firmName, setFirmName] = useState("");

  const handleStart = (name) => {
    setFirmName(name);
    setGameStarted(true);
  };

  return (
    <main>
      {!gameStarted ? (
        <GameHome onStartGame={handleStart} />
      ) : (
        <GameDashboard firmName={firmName} />
      )}
    </main>
  );
}
