// src/services/visionService.ts

// COLOQUE SUA CHAVE DA API AQUI
const API_KEY = 'AIzaSyDwmq79ALhhutUf7s2L5rjapxZ4ewyO47A';
const API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

/**
 * Analisa uma imagem com a Google Vision API e retorna o texto detectado.
 * @param base64ImageData A imagem em formato Data URL (base64).
 * @returns Uma Promise que resolve para o texto detectado.
 * @throws Um erro se a análise falhar.
 */

export const analyzeImageWithVision = async (base64ImageData: string): Promise<string> => {
  // Extrai apenas os dados base64 da string da imagem
  const pureBase64 = base64ImageData.split(',')[1];

  // 2. Monta o corpo da requisição
  const requestBody = {
    requests: [
      {
        image: {
          content: pureBase64,
        },
        features: [{ type: 'TEXT_DETECTION' }],
        imageContext: {
          languageHints: ['pt-BR'],
        },
      },
    ],
  };

  // 3. Faz a chamada à API
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  // 4. Trata a resposta
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro da API Vision:', errorData);
    throw new Error(errorData.error?.message || 'Falha ao comunicar com a API Vision.');
  }

  const data = await response.json();
  console.log('Resposta da API Vision:', data);

  // 5. Extrai e retorna o texto, ou lança um erro se não houver texto
  const textAnnotation = data.responses?.[0]?.fullTextAnnotation?.text;
  if (textAnnotation) {
    return textAnnotation;
  }

  // Fallback para textAnnotations se fullTextAnnotation não estiver disponível
  const fallbackText = data.responses?.[0]?.textAnnotations?.[0]?.description;
  if (fallbackText) {
    return fallbackText;
  }

  throw new Error('Nenhum texto foi detectado na imagem.');
};