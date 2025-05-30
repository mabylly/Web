import { useEffect, useRef, useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { WhiteboardHandle } from './components/whiteboard'; // Certifique-se que o caminho está correto
import Whiteboard from './components/whiteboard'; // Certifique-se que o caminho está correto
import listaDePalavras from './data/palavras.json';
import { analyzeImageWithVision } from './services/visionService';
import type { VisionCharacter, VisionAnalysisResult } from './services/visionService';

interface DiffCharacter {
  targetChar: string | null;
  recognizedChar: string | null;
  status: 'correct' | 'incorrect' | 'insertion' | 'deletion';
  boundingPoly?: { vertices: Array<{ x: number; y: number }> };
  originalIndex?: number; // Índice do caractere na lista da API
  confidence?: number;
}

export default function App() {
  const [randomWord, setRandomWord] = useState('');
  const [imagemSalva, setImagemSalva] = useState<string | null>(null);
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null);
  const [detailedDiff, setDetailedDiff] = useState<DiffCharacter[] | null>(null);
  const [classificacaoPalavra, setClassificacaoPalavra] = useState<"bom" | "médio" | "ruim" | null>(null);
  const [caligrafiaFeedback, setCaligrafiaFeedback] = useState<string | null>(null);

  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
    setApiError(null);
    setIsLoadingAPI(false);
    setVisionResult(null);
    setDetailedDiff(null);
    setClassificacaoPalavra(null);
    setCaligrafiaFeedback(null);
    whiteboardRef.current?.clear();
  };

  const compareWords = (target: string, recognizedChars: VisionCharacter[]): DiffCharacter[] => {
    const diff: DiffCharacter[] = [];
    const targetLower = target.toLowerCase();
    let targetIdx = 0;
    let recogIdx = 0;

    while (targetIdx < targetLower.length || recogIdx < recognizedChars.length) {
      if (targetIdx < targetLower.length && recogIdx < recognizedChars.length) {
        const currentRecogChar = recognizedChars[recogIdx];
        if (targetLower[targetIdx] === currentRecogChar.char.toLowerCase()) {
          diff.push({
            targetChar: target[targetIdx],
            recognizedChar: currentRecogChar.char,
            status: 'correct',
            boundingPoly: currentRecogChar.boundingPoly,
            originalIndex: recogIdx,
            confidence: currentRecogChar.confidence,
          });
          targetIdx++;
          recogIdx++;
        } else {
          diff.push({
            targetChar: target[targetIdx],
            recognizedChar: currentRecogChar.char,
            status: 'incorrect',
            boundingPoly: currentRecogChar.boundingPoly,
            originalIndex: recogIdx,
            confidence: currentRecogChar.confidence,
          });
          targetIdx++;
          recogIdx++;
        }
      } else if (targetIdx < targetLower.length) {
        diff.push({ targetChar: target[targetIdx], recognizedChar: null, status: 'deletion', confidence: undefined });
        targetIdx++;
      } else {
        const currentRecogChar = recognizedChars[recogIdx];
        diff.push({
          targetChar: null,
          recognizedChar: currentRecogChar.char,
          status: 'insertion',
          boundingPoly: currentRecogChar.boundingPoly,
          originalIndex: recogIdx,
          confidence: currentRecogChar.confidence,
        });
        recogIdx++;
      }
    }
    return diff;
  };
  
  const classificarQualidadePalavra = (
    palavraAlvo: string,
    resultadoApi: VisionAnalysisResult,
    diffDetalhado: DiffCharacter[] | null
  ): "bom" | "médio" | "ruim" => {
    console.log("--- Iniciando Classificação ---");
    console.log("Palavra Alvo:", palavraAlvo);
    console.log("Resultado API (fullText):", resultadoApi.fullText);
    console.log("Resultado API (characters count):", resultadoApi.characters?.length);
    console.log("Diff Detalhado:", diffDetalhado);

    if (!resultadoApi.fullText && (!resultadoApi.characters || resultadoApi.characters.length === 0)) {
      console.log("RETORNO: Ruim (API não detectou texto algum)");
      return "ruim";
    }

    const textoReconhecidoLower = (resultadoApi.fullText || "").trim().toLowerCase();
    const palavraAlvoLower = palavraAlvo.trim().toLowerCase();
    
    let contagemErros = 0;
    if (diffDetalhado && diffDetalhado.length > 0) {
      contagemErros = diffDetalhado.filter(
        d => d.status === 'incorrect' || d.status === 'insertion' || d.status === 'deletion'
      ).length;
    } else {
      if (textoReconhecidoLower !== palavraAlvoLower) {
        contagemErros = palavraAlvoLower.length; 
      }
    }

    if (palavraAlvoLower.length <= 4 && contagemErros > 0) return "ruim";
    if (contagemErros > 2) return "ruim";

    if (!resultadoApi.characters || resultadoApi.characters.length === 0) {
      return (textoReconhecidoLower === palavraAlvoLower && contagemErros === 0) ? "médio" : "ruim";
    }

    let somaConfiancas = 0;
    let caracteresRelevantesContagem = 0;
    const caracteresParaConfianca = (diffDetalhado?.length)
      ? resultadoApi.characters.filter((_, index) =>
          diffDetalhado.some(d => d.originalIndex === index && (d.status === 'correct' || d.status === 'incorrect'))
        )
      : resultadoApi.characters;

    if (caracteresParaConfianca.length === 0) {
      return (contagemErros === 0 && textoReconhecidoLower === palavraAlvoLower) ? "médio" : "ruim";
    }

    caracteresParaConfianca.forEach(char => {
      if (char && typeof char.confidence === 'number' && !isNaN(char.confidence)) {
        somaConfiancas += char.confidence;
        caracteresRelevantesContagem++;
      }
    });

    if (caracteresRelevantesContagem === 0) return "ruim";
    const mediaConfianca = somaConfiancas / caracteresRelevantesContagem;

    if (contagemErros > 0) {
      return mediaConfianca > 0.80 ? "médio" : "ruim";
    }

    if (mediaConfianca >= 0.90) return "bom";
    if (mediaConfianca >= 0.60) return "médio"; // Ajustado de 0.1 para 0.60 para "médio"
    
    return "ruim";
  };

  const salvarEscrita = async () => {
    const imageDataUrl = whiteboardRef.current?.exportAsImage();
    if (!imageDataUrl) {
      setApiError('Não foi possível capturar a imagem do quadro.');
      return;
    }

    setImagemSalva(imageDataUrl);
    setIsLoadingAPI(true);
    setApiError(null);
    setVisionResult(null);
    setDetailedDiff(null);
    setClassificacaoPalavra(null);
    setCaligrafiaFeedback(null);

    try {
      const result = await analyzeImageWithVision(imageDataUrl);
      setVisionResult(result);

      let diffResults: DiffCharacter[] | null = null;
      if (randomWord && result.characters.length > 0) {
        diffResults = compareWords(randomWord, result.characters);
        setDetailedDiff(diffResults);

        const lowConfidenceLetters: string[] = [];
        diffResults.forEach(item => {
          if (item.recognizedChar && item.confidence !== undefined && item.confidence < 0.6) {
            if (!lowConfidenceLetters.includes(item.recognizedChar)) {
                lowConfidenceLetters.push(item.recognizedChar);
            }
          }
        });

        if (lowConfidenceLetters.length > 0) {
          setCaligrafiaFeedback(`Tente melhorar a escrita da(s) letra(s): ${lowConfidenceLetters.join(', ')}`);
        } else {
          setCaligrafiaFeedback(null);
        }
      }
      
      if (result) {
        const qualidade = classificarQualidadePalavra(randomWord, result, diffResults);
        setClassificacaoPalavra(qualidade);
      }

    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Ocorreu um erro desconhecido.');
      }
    } finally {
      setIsLoadingAPI(false);
    }
  };

  const getSvgCoordinates = (vertex: { x: number; y: number }) => {
    if (!imageRef.current) return vertex;
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;

    if (naturalWidth === 0 || naturalHeight === 0) return vertex;

    const scaleX = displayedWidth / naturalWidth;
    const scaleY = displayedHeight / naturalHeight;

    return {
      x: vertex.x * scaleX,
      y: vertex.y * scaleY,
    };
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

        <div className="flex justify-center items-center mt-6 gap-4">
          <button
            onClick={salvarEscrita}
            disabled={isLoadingAPI}
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 shadow-md"
          >
            {isLoadingAPI ? 'Analisando...' : 'Verificar Escrita'}
          </button>
          <button
            onClick={handleProximaPalavra}
            className="px-6 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-700 shadow-md"
          >
            Próxima Palavra
          </button>
        </div>

        {imagemSalva && !isLoadingAPI && !apiError && (
          <div className="mt-8 text-center relative">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Sua Escrita Analisada:</h2>
            <img
              ref={imageRef}
              src={imagemSalva}
              alt="Escrita salva"
              className="mx-auto max-w-xs md:max-w-sm border rounded-xl shadow"
              onLoad={() => {
                if (detailedDiff) setDetailedDiff([...detailedDiff]);
              }}
            />
            {detailedDiff && imageRef.current && imageRef.current.complete && (
              <svg
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: imageRef.current?.clientWidth,
                  height: imageRef.current?.clientHeight,
                  left: imageRef.current?.offsetLeft,
                  top: imageRef.current?.offsetTop,
                }}
              >
                {detailedDiff.map((item, index) => {
                  if (item.boundingPoly?.vertices && (item.status === 'incorrect' || item.status === 'insertion' || (item.confidence !== undefined && item.confidence <= 0.6 && item.recognizedChar))) {
                    const scaledVertices = item.boundingPoly.vertices.map(getSvgCoordinates);
                    const pathData = "M" + scaledVertices.map(p => `${p.x},${p.y}`).join(" L") + " Z";
                    
                    let strokeColor = "transparent";
                    let strokeDasharray = ""; // Para diferenciar baixa confiança
                    
                    if (item.confidence !== undefined && item.confidence <= 0.6 && item.recognizedChar) {
                      strokeColor = "purple"; // Cor para baixa confiança
                      strokeDasharray = "3,3"; // Linha tracejada para baixa confiança
                    } else if (item.status === 'incorrect') {
                      strokeColor = "red";
                    } else if (item.status === 'insertion') {
                      strokeColor = "orange";
                    }

                    if (strokeColor !== "transparent") {
                      return (
                        <g key={`diff-${index}`}>
                          <path
                            d={pathData}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2"
                            strokeDasharray={strokeDasharray}
                          />
                        </g>
                      );
                    }
                  }
                  return null;
                })}
              </svg>
            )}
          </div>
        )}

        {classificacaoPalavra && !isLoadingAPI && !apiError && (
          <div className={`mt-4 text-center p-3 rounded-lg font-semibold
            ${classificacaoPalavra === 'bom' ? 'bg-green-100 text-green-700' : ''}
            ${classificacaoPalavra === 'médio' ? 'bg-yellow-100 text-yellow-700' : ''}
            ${classificacaoPalavra === 'ruim' ? 'bg-red-100 text-red-700' : ''}
          `}>
            <p>
              Qualidade da Escrita: <span className="uppercase">{classificacaoPalavra}</span>
              {classificacaoPalavra === 'bom' && ' 🎉'}
              {classificacaoPalavra === 'médio' && ' 👍'}
              {classificacaoPalavra === 'ruim' && ' 😕'}
            </p>
          </div>
        )}
        
        {caligrafiaFeedback && !isLoadingAPI && !apiError && (
          <div className="mt-2 text-center p-2 rounded-lg bg-purple-100 text-purple-700 font-medium">
            <p>{caligrafiaFeedback}</p>
          </div>
        )}

        {visionResult?.fullText && !isLoadingAPI && !apiError && (
          <div className="mt-4 text-center text-indigo-700 bg-indigo-100 p-3 rounded-lg">
            <p><strong>Texto Detectado (Completo):</strong> {visionResult.fullText}</p>
          </div>
        )}

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
      </div>
    </div>
  );
}