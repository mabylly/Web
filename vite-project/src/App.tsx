import React, { useEffect, useRef, useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { WhiteboardHandle } from './components/whiteboard';
import Whiteboard from './components/whiteboard';
import palavra from './data/palavras.json';

const App: React.FC = () => {
  const [randomWord, setRandomWord] = useState('');
  const [imagemSalva, setImagemSalva] = useState<string | null>(null);
  const whiteboardRef = useRef<WhiteboardHandle>(null);

  useEffect(() => {
    const getRandomWord = () => {
      const words = palavra.palavras;
      const index = Math.floor(Math.random() * words.length);
      const word = words[index];
      setRandomWord(word);
      localStorage.setItem('palavraAleatoria', word);
    };
    getRandomWord();

    // Se já existir uma imagem salva, carrega ela
    const imgSalva = localStorage.getItem('escritaSalva');
    if (imgSalva) {
      setImagemSalva(imgSalva);
    }
  }, []);

  const salvarEscrita = () => {
    const imageDataUrl = whiteboardRef.current?.exportAsImage();
    if (imageDataUrl) {
      localStorage.setItem('escritaSalva', imageDataUrl);
      setImagemSalva(imageDataUrl); // Atualiza estado para mostrar no app
      console.log('Imagem salva no localStorage');
    } else {
      console.error('Erro ao exportar canvas');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-200 to-blue-500 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-xl p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-blue-800 font-semibold text-xl">
            <FaPencilAlt className="text-yellow-500" />
            HandLetter
          </div>
        </div>

        <div className="text-center text-gray-600 mt-6">
          <div className="flex justify-center items-center w-full">
            <span className="px-6 py-1 bg-white border-2 border-blue-500 rounded-full font-[Caveat] text-3xl text-blue-800 shadow">
              {randomWord}
            </span>
          </div>
        </div>

        <p className="mt-4 text-lg text-gray-500 text-center">
          Escreva a palavra aleatória no quadro.
        </p>

        <div className="mt-10">
          <Whiteboard ref={whiteboardRef} />
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={salvarEscrita}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Salvar Escrita
          </button>
        </div>

        {/* MOSTRA A IMAGEM SALVA 
        {imagemSalva && (
          <div className="mt-8 text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Escrita Salva:</h2>
            <img
              src={imagemSalva}
              alt="Escrita salva"
              className="mx-auto max-w-full border rounded-xl shadow"
            />
          </div>
        )}*/}
      </div>
    </div>
  );
};

export default App;
