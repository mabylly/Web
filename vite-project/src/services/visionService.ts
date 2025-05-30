// src/services/visionService.ts

// SUBSTITUA PELA SUA CHAVE REAL
const API_KEY = 'AIzaSyDwmq79ALhhutUf7s2L5rjapxZ4ewyO47A'; 
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

// --- Definições de Tipo para a Resposta da API Vision ---
interface Vertex {
  x: number;
  y: number;
}

interface BoundingPoly {
  vertices: Vertex[];
  normalizedVertices?: Vertex[];
}

interface VisionSymbol {
  text: string;
  confidence?: number;
  boundingBox?: BoundingPoly;
}

interface VisionWord {
  symbols: VisionSymbol[];
  confidence?: number;
  boundingBox?: BoundingPoly;
}

interface VisionParagraph {
  words: VisionWord[];
  confidence?: number;
  boundingBox?: BoundingPoly;
}

interface VisionBlock {
  paragraphs: VisionParagraph[];
  blockType?: string;
  confidence?: number;
  boundingBox?: BoundingPoly;
}

interface VisionPage {
  blocks: VisionBlock[];
  width?: number;
  height?: number;
  confidence?: number;
}

interface FullTextAnnotation {
  text: string;
  pages: VisionPage[];
}

interface TextAnnotation {
  description: string;
  boundingPoly: BoundingPoly;
  locale?: string;
}

interface VisionApiResponse {
  responses: Array<{
    fullTextAnnotation?: FullTextAnnotation;
    textAnnotations?: TextAnnotation[];
  }>;
}
// --- Fim das Definições de Tipo ---

export interface VisionCharacter {
  char: string;
  confidence: number;
  boundingPoly: BoundingPoly;
}

export interface VisionAnalysisResult {
  fullText: string;
  characters: VisionCharacter[];
}

export const analyzeImageWithVision = async (base64ImageData: string): Promise<VisionAnalysisResult> => {
  const pureBase64 = base64ImageData.split(',')[1];

  const requestBody = {
    requests: [
      {
        image: {
          content: pureBase64,
        },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: {
          languageHints: ['pt-BR'],
        },
      },
    ],
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro da API Vision:', errorData);
    throw new Error(errorData.error?.message || 'Falha ao comunicar com a API Vision.');
  }

  const data: VisionApiResponse = await response.json();
  // console.log('Resposta da API Vision (completa):', JSON.stringify(data, null, 2));

  const responseAnnotation = data.responses?.[0];
  const fullTextAnnotation = responseAnnotation?.fullTextAnnotation;
  const textFromApi = fullTextAnnotation?.text || responseAnnotation?.textAnnotations?.[0]?.description || "";

  const detectedCharacters: VisionCharacter[] = [];

  fullTextAnnotation?.pages?.forEach((page: VisionPage) => {
    page.blocks?.forEach((block: VisionBlock) => {
      block.paragraphs?.forEach((paragraph: VisionParagraph) => {
        paragraph.words?.forEach((word: VisionWord) => {
          word.symbols?.forEach((symbol: VisionSymbol) => {
            // Log que você viu:
            console.log(
              `[visionService] Símbolo LIDO: '${symbol.text}', Confiança DIRETA: ${symbol.confidence}`
            );
            
            // --- GARANTA QUE ESTE LOG ESTÁ ATIVO E OLHE PARA ELE ---
            //console.log("[visionService] Objeto SYMBOL COMPLETO da API para o símbolo acima:", JSON.stringify(symbol, null, 2));
            // -----------------------------------------------------
            if (symbol.text && symbol.boundingBox) {
              detectedCharacters.push({
                char: symbol.text,
                confidence: symbol.confidence || 0,
                boundingPoly: symbol.boundingBox,
              });
            }
          });
        });
      });
    });
  });

  if (detectedCharacters.length === 0 && textFromApi && responseAnnotation?.textAnnotations && responseAnnotation.textAnnotations.length > 1) {
    console.warn("Símbolos detalhados não encontrados via fullTextAnnotation.pages. Feedback de caracteres pode não funcionar como esperado.");
  }

  if (!textFromApi && detectedCharacters.length === 0) {
    throw new Error('Nenhum texto foi detectado na imagem.');
  }

  return {
    fullText: textFromApi,
    characters: detectedCharacters,
  };
};