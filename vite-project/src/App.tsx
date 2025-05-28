import { useEffect, useRef, useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { WhiteboardHandle } from './components/whiteboard';
import Whiteboard from './components/whiteboard';
import listaDePalavras from './data/palavras.json';
import { analyzeImageWithVision } from './services/visionService';


export default function App() {
  const [randomWord, setRandomWord] = useState('');
  const [imagemSalva, setImagemSalva] = useState<string | null>(null);
  const [textoDetectado, setTextoDetectado] = useState<string | null>(null); // Novo estado para o texto da API
  const [isLoadingAPI, setIsLoadingAPI] = useState(false); // Novo estado para feedback de carregamento
  const [apiError, setApiError] = useState<string | null>(null); // Novo estado para erros da API

  const whiteboardRef = useRef<WhiteboardHandle>(null);

  // Função para obter uma palavra aleatória da lista
  const getRandomWord = () => {
    const words = listaDePalavras;
    let newWord = randomWord;
    while (newWord === randomWord) {
      const index = Math.floor(Math.random() * words.length);
      newWord = words[index];
    }
    setRandomWord(newWord);
  };

  useEffect(() => {    
    getRandomWord();
  }, []);

  const handleProximaPalavra = () => {
    getRandomWord();
    setImagemSalva(null);
    setTextoDetectado(null);
    setApiError(null);
    setIsLoadingAPI(false);
    whiteboardRef.current?.clear();
};

  const salvarEscrita = async () => {
    const imageDataUrl = whiteboardRef.current?.exportAsImage();
    console.log("Dados da imagem exportada:", imageDataUrl); //teste
    if (!imageDataUrl) {
      setApiError('Não foi possível capturar a imagem do quadro.');
      return;
    }

    setImagemSalva(imageDataUrl);
    setIsLoadingAPI(true);
    setApiError(null);
    setTextoDetectado(null);

    try {
      // Chama a função do nosso serviço
      const detectedText = await analyzeImageWithVision(imageDataUrl);
      setTextoDetectado(detectedText);
    } catch (error) {
      // O catch vai pegar qualquer erro lançado pela nossa função de serviço
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Ocorreu um erro desconhecido.');
      }
    } finally {
      // Garante que o loading seja desativado no final
      setIsLoadingAPI(false);
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

        <div className="flex justify-center mt-6 gap-4">
          <button
            onClick={salvarEscrita}
            disabled={isLoadingAPI} // Desabilita o botão durante o carregamento
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoadingAPI ? 'Enviando...' : 'Enviar Escrita'}
          </button>
            <button
              onClick={handleProximaPalavra}
              className="px-4 py-2 bg-yellow-400 text-white rounded-xl hover:bg-yellow-600"
            >
              Próxima Palavra
            </button>
        </div>

        {/* MOSTRA A IMAGEM SALVA */}
        {imagemSalva && !isLoadingAPI && !apiError && ( // Só mostra se não estiver carregando e não houver erro na API
          <div className="mt-8 text-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Sua Escrita:</h2>
            <img
              src={imagemSalva}
              alt="Escrita salva"
              className="mx-auto max-w-xs md:max-w-sm border rounded-xl shadow" // Ajustei o tamanho máximo
            />
          </div>
        )}

        {/* MOSTRA O RESULTADO DA API */}
        {isLoadingAPI && (
          <div className="mt-4 text-center text-blue-700">
            <p>Analisando sua escrita...</p>
          </div>
        )}

        {apiError && (
          <div className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">
            <p><strong>Erro na Análise:</strong> {apiError}</p>
          </div>
        )}

        {textoDetectado && !isLoadingAPI && (
          <div className="mt-4 text-center text-green-700 bg-green-100 p-3 rounded-lg">
            <p><strong>Texto Detectado pela API:</strong> {textoDetectado}</p>
          </div>
        )}
      </div>
    </div>
  );
}
