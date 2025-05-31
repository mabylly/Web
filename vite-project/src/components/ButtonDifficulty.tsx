import React from "react";

interface ButtonDifficultyProps {
  title: string;
  difficulty: number | null;      // valor atual selecionado
  value: number;           // valor deste botão
  color: "blue" | "yellow" | "red";
  onClick: () => void;
}

export function ButtonDifficulty({ title, difficulty, value, color, onClick }: ButtonDifficultyProps) {
  // Mapeamento das classes para cada cor
  const colors = {
    blue: {
      active: "bg-blue-600 text-white ring-blue-400",
      inactive: "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50",
      ring: "focus:ring-blue-400",
    },
    yellow: {
      active: "bg-yellow-500 text-white ring-yellow-300",
      inactive: "bg-white text-yellow-600 border-2 border-yellow-500 hover:bg-yellow-50",
      ring: "focus:ring-yellow-300",
    },
    red: {
      active: "bg-red-600 text-white ring-red-400",
      inactive: "bg-white text-red-600 border-2 border-red-600 hover:bg-red-50",
      ring: "focus:ring-red-400",
    },
  };

  const isActive = difficulty === value;

  const colorClasses = isActive ? colors[color].active : colors[color].inactive;

  return (
    <button
      onClick={onClick}
      className={`
        px-8 py-4 text-2xl rounded-4xl font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50
        ${colorClasses} 
        ${colors[color].ring}
      `}
    >
      {title}
    </button>
  );
}
