import React from "react";

const CONFETTI_PARTICLES = [
  { id: 1, top: "12%", left: "15%", size: "w-3 h-3", color: "bg-red-400 animate-bounce", delay: "delay-100" },
  { id: 2, top: "18%", left: "75%", size: "w-2 h-4", color: "bg-yellow-400 rotate-12", delay: "delay-300" },
  { id: 3, top: "35%", left: "5%", size: "w-3 h-2", color: "bg-teal-500 rotate-45", delay: "delay-200" },
  { id: 4, top: "25%", left: "85%", size: "w-4 h-4", color: "bg-orange-400 rounded-full", delay: "delay-500" },
  { id: 5, top: "45%", left: "90%", size: "w-2.5 h-2.5", color: "bg-pink-400", delay: "delay-75" },
  { id: 6, top: "50%", left: "10%", size: "w-3 h-3", color: "bg-blue-400 rotate-12", delay: "delay-1000" },
  { id: 7, top: "68%", left: "80%", size: "w-2.5 h-3", color: "bg-purple-400 -rotate-12", delay: "delay-150" },
  { id: 8, top: "82%", left: "20%", size: "w-4 h-2", color: "bg-emerald-400 rotate-45", delay: "delay-500" },
  { id: 9, top: "88%", left: "70%", size: "w-3 h-3", color: "bg-indigo-400 rounded-full", delay: "delay-300" },
];

export const ConfettiOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {CONFETTI_PARTICLES.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.size} ${particle.color} ${particle.delay} rounded-sm transition-transform duration-1000`}
          style={{ top: particle.top, left: particle.left }}
        />
      ))}
    </div>
  );
};
