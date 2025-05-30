// src/pages/GamePage.tsx

import { useState } from 'react'

export let selectedDifficulty: number = 0

export default function HomePage() {
  const [difficulty, setDifficulty] = useState<number>(0)

  const handleSetDifficulty = (level: number) => {
    setDifficulty(level)
    selectedDifficulty = level
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Título do jogo */}
      <h1 className="text-5xl font-extrabold mb-4 text-center text-indigo-700 drop-shadow">
        Teste sua escrita
      </h1>

      {/* Subtítulo de dificuldade */}
      <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-center">
        Selecione a Dificuldade
      </h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleSetDifficulty(0.4)}
          className={`px-6 py-3 rounded-2xl font-medium shadow transition duration-300 ${
            difficulty === 1
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-100'
          }`}
        >
          Fácil
        </button>

        <button
          onClick={() => handleSetDifficulty(0.6)}
          className={`px-6 py-3 rounded-2xl font-medium shadow transition duration-300 ${
            difficulty === 2
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-yellow-500 border border-yellow-500 hover:bg-yellow-100'
          }`}
        >
          Médio
        </button>

        <button
          onClick={() => handleSetDifficulty(0.8)}
          className={`px-6 py-3 rounded-2xl font-medium shadow transition duration-300 ${
            difficulty === 3
              ? 'bg-red-600 text-white'
              : 'bg-white text-red-600 border border-red-600 hover:bg-red-100'
          }`}
        >
          Difícil
        </button>
      </div>

      <button
        onClick={() => alert(`Iniciando jogo na dificuldade ${difficulty}`)}
        className="mt-4 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-semibold shadow transition duration-300"
      >
        Iniciar Jogo
      </button>
    </div>
  )
}
