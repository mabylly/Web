// Função para chamada da API Vision do Google via backend FastAPI
// Tratamento de erros e tipos de resposta
// Importante: Certifique-se de que o backend FastAPI esteja rodando e acessível na URL especificada


const BACKEND_API_URL = 'http://localhost:8000/api/analyze-image'; // Ajuste a porta se o FastAPI não estiver na 8000

// ---  Definições de Tipo para a Resposta da API ---
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
    
    const requestBody = {
        base64_image: base64ImageData, // Envia a imagem base64 para o backend
    };

    const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro do Backend FastAPI ao chamar a API Vision:', errorData);
        throw new Error(errorData.detail || 'Falha ao processar a imagem via backend.');
    }

     const data: VisionApiResponse = await response.json();

    const responseAnnotation = data.responses?.[0];
    const fullTextAnnotation = responseAnnotation?.fullTextAnnotation;
    const textFromApi = fullTextAnnotation?.text || responseAnnotation?.textAnnotations?.[0]?.description || "";

    const detectedCharacters: VisionCharacter[] = [];

    fullTextAnnotation?.pages?.forEach((page: VisionPage) => {
        page.blocks?.forEach((block: VisionBlock) => {
            block.paragraphs?.forEach((paragraph: VisionParagraph) => {
                paragraph.words?.forEach((word: VisionWord) => {
                    word.symbols?.forEach((symbol: VisionSymbol) => {
                        
                        console.log(
                            `[visionService] Símbolo LIDO: '${symbol.text}', Confiança DIRETA: ${symbol.confidence}`
                        );

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