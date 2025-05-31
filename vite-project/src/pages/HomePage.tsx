import { useState } from 'react';
import { ButtonDifficulty } from '../components/ButtonDifficulty';


// Definindo o tipo das props que HomePage receberá
interface HomePageProps {
  onStartGame: (difficulty: number) => void;
}

export default function HomePage({ onStartGame }: HomePageProps) { // Adiciona a prop
  const [difficulty, setDifficulty] = useState<number | null>(null);

  const DIFICULDADE_FACIL = 0.4;
  const DIFICULDADE_MEDIO = 0.6;
  const DIFICULDADE_DIFICIL = 0.8;

  const handleSetDifficulty = (level: number) => {
    setDifficulty(level);

  };

  const handleIniciarJogoClick = () => {


    if (difficulty === null) {
      alert('Por favor, selecione uma dificuldade primeiro!');
      return;
    }

    onStartGame(difficulty); // Esta é a chamada para a função em App.tsx
    };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-blue-500 p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 md:p-12 w-full max-w-2xl text-center">
        <h1 className="text-6xl md:text-7xl font-bold mb-8 text-indigo-700 drop-shadow-lg font-pacifico">
          Teste sua escrita
        </h1>
        <h2 className="text-3xl font-semibold mb-10 text-gray-700">
          Selecione a Dificuldade
        </h2>

        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-12">
          <ButtonDifficulty
            title="Fácil"
            difficulty={difficulty}
            value={DIFICULDADE_FACIL}
            color="blue"
            onClick={() => handleSetDifficulty(DIFICULDADE_FACIL)}
          />
          <ButtonDifficulty
            title="Médio"
            difficulty={difficulty}
            value={DIFICULDADE_MEDIO}
            color="yellow"
            onClick={() => handleSetDifficulty(DIFICULDADE_MEDIO)}
          />
          <ButtonDifficulty
            title="Difícil"
            difficulty={difficulty}
            value={DIFICULDADE_DIFICIL}
            color="red"
            onClick={() => handleSetDifficulty(DIFICULDADE_DIFICIL)}
          />
        </div>


        <button
          onClick={handleIniciarJogoClick} // Alterado para chamar a nova função
          disabled={difficulty === null}
          className="mt-8 bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl rounded-2xl font-bold shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed"
        >
          Iniciar Jogo
        </button>
      </div>
    </div>
  );
}