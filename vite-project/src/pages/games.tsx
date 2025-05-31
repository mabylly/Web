import { useEffect, useRef, useState } from 'react';
import { FaPencilAlt } from 'react-icons/fa';
import type { WhiteboardHandle } from '../components/whiteboard'; // Certifique-se que o caminho está correto
import Whiteboard from '../components/whiteboard'; // Certifique-se que o caminho está correto
import listaDePalavras from '../data/palavras.json';
import { analyzeImageWithVision } from '../services/visionService';
import type { VisionCharacter, VisionAnalysisResult } from '../services/visionService';

interface DiffCharacter {
  targetChar: string | null;
  recognizedChar: string | null;
  status: 'correct' | 'incorrect' | 'insertion' | 'deletion';
  boundingPoly?: { vertices: Array<{ x: number; y: number }> };
  originalIndex?: number; // Índice do caractere na lista da API
  confidence?: number;
}

interface GamesProps {
  difficulty: number;
  onGoHome?: () => void; // Função opcional para voltar para a home
}

export default function Games({ difficulty, onGoHome }: GamesProps) {
  const [randomWord, setRandomWord] = useState('');
  const [imagemSalva, setImagemSalva] = useState<string | null>(null);
  const [isLoadingAPI, setIsLoadingAPI] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null);
  const [detailedDiff, setDetailedDiff] = useState<DiffCharacter[] | null>(null);
  const [classificacaoPalavra, setClassificacaoPalavra] = useState<"Muito bom, vamos tentar a proxima" | "Quase lá, vamos tentar de novo" | "Hmm, que tal tentar de novo" | null>(null);
  const [caligrafiaFeedback, setCaligrafiaFeedback] = useState<string | null>(null);

  const whiteboardRef = useRef<WhiteboardHandle>(null);
  const imageRef = useRef<HTMLImageElement>(null);


   useEffect(() => {        
    // Busca a primeira palavra aleatória para o jogo
    getRandomWord(); 
  }, [difficulty]); // O array de dependências faz com que este efeito rode se 'difficulty' mudar.

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
  ): "Muito bom, vamos tentar a proxima" | "Quase lá, vamos tentar de novo" | "Hmm, que tal tentar de novo" => {

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

    if (palavraAlvoLower.length <= 4 && contagemErros > 0) return "Hmm, que tal tentar de novo";
    if (contagemErros > 2) return "Hmm, que tal tentar de novo";

    if (!resultadoApi.characters || resultadoApi.characters.length === 0) {
      return (textoReconhecidoLower === palavraAlvoLower && contagemErros === 0) ? "Quase lá, vamos tentar de novo" : "Hmm, que tal tentar de novo";
    }

    let somaConfiancas = 0;
    let caracteresRelevantesContagem = 0;
    const caracteresParaConfianca = (diffDetalhado?.length)
      ? resultadoApi.characters.filter((_, index) =>
          diffDetalhado.some(d => d.originalIndex === index && (d.status === 'correct' || d.status === 'incorrect'))
        )
      : resultadoApi.characters;

    if (caracteresParaConfianca.length === 0) {
      return (contagemErros === 0 && textoReconhecidoLower === palavraAlvoLower) ? "Quase lá, vamos tentar de novo" : "Hmm, que tal tentar de novo";
    }

    caracteresParaConfianca.forEach(char => {
      if (char && typeof char.confidence === 'number' && !isNaN(char.confidence)) {
        somaConfiancas += char.confidence;
        caracteresRelevantesContagem++;
      }
    });

    if (caracteresRelevantesContagem === 0) return "Hmm, que tal tentar de novo";
    const mediaConfianca = somaConfiancas / caracteresRelevantesContagem;

    if (contagemErros > 0) {
      return mediaConfianca > 0.80 ? "Quase lá, vamos tentar de novo" : "Hmm, que tal tentar de novo";
    }

    if (mediaConfianca >= 0.90) return "Muito bom, vamos tentar a proxima";
    if (mediaConfianca >= 0.60) return "Quase lá, vamos tentar de novo"; // Ajustado de 0.1 para 0.60 para "médio"
    
    return "Hmm, que tal tentar de novo";
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-200 to-blue-500 flex justify-center items-center p-4">
      <div className="bg-white w-full rounded-3xl shadow-xl p-6 ml-20 mr-20 relative">
        {/* Botão para voltar para Home (Exemplo) */}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="absolute top-4 left-4 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 text-2xl font-medium shadow"
          >
            &larr; Menu
          </button>
        )}
        
        {/* Cabeçalho "HandLetter" */}
        <div className="flex justify-center items-center mt-4 md:mt-0 mb-6"> {/* Ajustado mt-4 por causa do botão Voltar em telas pequenas */}
          <div className="flex items-center gap-3 text-blue-800 font-semibold text-4xl font-pacifico"> {/* Supondo que 'font-pacifico' está configurada */}
            <FaPencilAlt className="text-yellow-500" size={36} /> {/* Ou o ícone que você escolheu */}
            Teste sua escrita
          </div>
        </div>

        {/* Palavra Aleatória a ser escrita */}
        <div className="text-center text-gray-600 mt-6">
          <div className="flex justify-center items-center w-full">
            <span className="px-6 py-1 bg-white border-2 border-blue-500 rounded-full font-[Caveat] text-3xl text-blue-800 shadow">
              {randomWord}
            </span>
          </div>
        </div>
        
        {/* Instrução */}
        <p className="mt-4 text-2xl font-bold text-gray-500 text-center">
          Escreva a palavra acima no quadro.
        </p>

        {/* Container Principal para Whiteboard e Resultados (Layout de Duas Colunas) */}
        <div className="flex w-full flex-row p-3 gap-8 mt-8 justify-between">
          
          {/* COLUNA DA ESQUERDA: Whiteboard e Botões de Ação */}
          <div className=" flex flex-col justify-between  ">
            <div className="w-full"> {/* Container para o whiteboard manter a largura */}
              <Whiteboard ref={whiteboardRef} />
            </div>
            <div className="flex flex-wrap justify-center items-center mt-6 gap-4">
              <button
                onClick={salvarEscrita}
                disabled={isLoadingAPI}
                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 shadow-md transition-colors"
              >
                {isLoadingAPI ? 'Analisando...' : 'Verificar Escrita'}
              </button>
              <button
                onClick={handleProximaPalavra}
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-700 shadow-md transition-colors"
              >
                Próxima Palavra
              </button>
            </div>
          </div>

          {/* COLUNA DA DIREITA: Resultados da Análise */}
          {/* Esta coluna só aparecerá se houver algo para mostrar (imagemSalva, loading, erro, etc.) */}
          {(imagemSalva || isLoadingAPI || apiError || classificacaoPalavra || caligrafiaFeedback || visionResult?.fullText ) && (
            <div className="w-full md:w-1/2 mt-8 md:mt-0 flex flex-col items-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Vamos verificar sua escrita!
              </h2>

              {/* Mensagens de Loading (aparece primeiro se estiver carregando) */}
              {isLoadingAPI && (
                <div className="mt-4 w-full max-w-md text-center text-blue-700">
                  <p>Analisando sua escrita...</p>
                </div>
              )}

              {/* Mensagens de Erro (aparece se houver erro e não estiver carregando) */}
              {apiError && !isLoadingAPI && (
                <div className="mt-4 w-full max-w-md text-center text-red-600 bg-red-100 p-3 rounded-lg">
                  <p><strong>Erro na Análise:</strong> {apiError}</p>
                </div>
              )}
              
              {/* Imagem Analisada e Destaques SVG (só mostra se não estiver carregando e não houver erro) */}
              {imagemSalva && !isLoadingAPI && !apiError && (
                <div className="text-center relative w-full max-w-md mt-4">
                  <img
                    ref={imageRef}
                    src={imagemSalva}
                    alt="Escrita salva"
                    className="mx-auto w-full border rounded-xl shadow"
                    onLoad={() => {
                      // Força a re-renderização do SVG se o detailedDiff já existir quando a imagem carregar,
                      // para garantir que o cálculo de coordenadas do SVG use as dimensões corretas da imagem.
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
                        // Condição para desenhar o destaque SVG
                        if (item.boundingPoly?.vertices && 
                            (item.status === 'incorrect' || 
                             item.status === 'insertion' || 
                             (item.confidence !== undefined && item.confidence < 0.6 && item.recognizedChar) // Limiar de baixa confiança
                            )
                           ) {
                          const scaledVertices = item.boundingPoly.vertices.map(getSvgCoordinates);
                          const pathData = "M" + scaledVertices.map(p => `${p.x},${p.y}`).join(" L") + " Z";
                          
                          let strokeColor = "transparent";
                          let strokeDasharray = ""; 
                          
                          if (item.confidence !== undefined && item.confidence < 0.6 && item.recognizedChar) {
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
                                  strokeWidth="2" // Aumentado para melhor visibilidade
                                  strokeDasharray={strokeDasharray}
                                />
                                {/* Opcional: Mostrar a letra correta sobre o erro, como discutido antes */}
                                {item.status === 'incorrect' && item.targetChar && (
                                  <text
                                    x={scaledVertices[0].x + (scaledVertices[1].x - scaledVertices[0].x) / 2 } // Centro X aproximado
                                    y={scaledVertices[0].y - 5} // Acima da caixa
                                    fill="green"
                                    fontSize="16" // Ajuste conforme necessário
                                    textAnchor="middle"
                                    fontWeight="bold"
                                  >
                                    {item.targetChar}
                                  </text>
                                )}
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

              {/* Classificação da Palavra */}
              {classificacaoPalavra && !isLoadingAPI && !apiError && (
                <div className={`mt-4 w-full max-w-md text-center p-3 rounded-lg font-semibold
                  ${classificacaoPalavra === 'Muito bom, vamos tentar a proxima' ? 'bg-green-100 text-green-700' : ''}
                  ${classificacaoPalavra === 'Quase lá, vamos tentar de novo' ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${classificacaoPalavra === 'Hmm, que tal tentar de novo' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  <p>                    
                    <span className="uppercase">{classificacaoPalavra}</span>
                    {classificacaoPalavra === 'Muito bom, vamos tentar a proxima' && ' 🎉'}
                    {classificacaoPalavra === 'Quase lá, vamos tentar de novo' && ' 👍'}
                    {classificacaoPalavra === 'Hmm, que tal tentar de novo' && ' 😕'}
                  </p>
                </div>
              )}
              
              {/* Feedback de Caligrafia (letras de baixa confiança) */}
              {caligrafiaFeedback && !isLoadingAPI && !apiError && (
                <div className="mt-2 w-full max-w-md text-center p-2 rounded-lg bg-purple-100 text-purple-700 font-medium text-sm">
                  <p>{caligrafiaFeedback}</p>
                </div>
              )}

              {/* Texto Detectado Completo */}
              {visionResult?.fullText && !isLoadingAPI && !apiError && (
                <div className="mt-4 w-full max-w-md text-center text-indigo-700 bg-indigo-100 p-3 rounded-lg">
                  <p><strong>Texto Detectado :</strong> {visionResult.fullText}</p>
                </div>
              )}
            </div>
          )} {/* Fim da condição da coluna da direita */}
        </div> {/* Fim do container flex de duas colunas */}
      </div> {/* Fim do card branco principal */}
    </div> // Fim do container da tela inteira
  );
}