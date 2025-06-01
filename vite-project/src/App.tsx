import { useState } from 'react';
import HomePage from './pages/HomePage'; // Ajuste o caminho se necessário
import Games from './pages/games';     // Ajuste o caminho se necessário

export default function App() {
  // Estado para controlar qual página está ativa: 'home' ou 'games'
  const [currentPage, setCurrentPage] = useState<'home' | 'games'>('home');
  // Estado para armazenar a dificuldade selecionada que será passada para Games
  const [gameDifficulty, setGameDifficulty] = useState<number | null>(null);


  console.log("App.tsx: Estado atual de currentPage:", currentPage);
  // Função para iniciar o jogo e passar a dificuldade
  const handleStartGame = (difficulty: number) => {
    setGameDifficulty(difficulty);
    setCurrentPage('games');
  };

  // Função para voltar para a HomePage
  const handleGoHome = () => {
    setCurrentPage('home');
    setGameDifficulty(null); // Reseta a dificuldade
  };

  return (
    <div>
      {currentPage === 'home' && (
        <HomePage onStartGame={handleStartGame} />
      )}
      {currentPage === 'games' && gameDifficulty !== null && (
        // Passa a dificuldade para o componente Games
        // E também a função para voltar para home, se desejar
        <Games difficulty={gameDifficulty} onGoHome={handleGoHome} />
      )}
    </div>
  );
}