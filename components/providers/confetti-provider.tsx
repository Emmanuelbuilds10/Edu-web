"use client";
import ReactConfetti from "react-confetti";

import { useConfettiStore } from "@/hooks/use-confetti-store";
import { useEffect, useState } from "react";

export const ConfettiProvider = () => {
  const confetti = useConfettiStore();
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  if (!confetti.isOpen) return null;

  return (
    <ReactConfetti
      className="pointer-events-none z-[100]"
      numberOfPieces={1000}
      recycle={false}
      width={windowSize.width}
      height={windowSize.height}
      onConfettiComplete={() => {
        confetti.onClose();
      }}
    />
  );
};
