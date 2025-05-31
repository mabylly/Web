# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # Para validar o corpo da requisição
import httpx # Para fazer requisições HTTP assíncronas

app = FastAPI()

# --- Configuração do CORS  ---
# Aqui voce adiciona o dominio e a porta do frontend 
origins = [
    "http://localhost:3000",  
    "http://127.0.0.1:3000",
    "http://localhost:5173",  
    "http://127.0.0.1:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Definição do Esquema de Entrada ---
class ImageAnalysisRequest(BaseModel):
    base64_image: str

# --- Rota root (nao mexer) ---
@app.get("/")
async def root():
    return {"message": "Olá FastAPI, seu backend está no ar!"}

# ---  Rota para a API  ---
@app.post("/api/analyze-image")
async def analyze_image(request: ImageAnalysisRequest):
    
    GOOGLE_VISION_API_KEY = 'AIzaSyDwmq79ALhhutUf7s2L5rjapxZ4ewyO47A' 

    if not GOOGLE_VISION_API_KEY or GOOGLE_VISION_API_KEY == 'SUA_CHAVE_REAL_AQUI':
        raise HTTPException(status_code=500, detail="Chave da API Google Vision não configurada ou placeholder.")

    API_URL = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_VISION_API_KEY}"

    # Remove o prefixo "data:image/png;base64," se presente na imagem base64
    pure_base64 = request.base64_image.split(',')[1] if ',' in request.base64_image else request.base64_image

    request_body = {
        "requests": [
            {
                "image": {
                    "content": pure_base64,
                },
                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}],
                "imageContext": {
                    "languageHints": ["pt-BR"],
                },
            }
        ],
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(API_URL, json=request_body)
            response.raise_for_status()  # Levanta uma exceção para status de erro (4xx ou 5xx)
            vision_api_data = response.json()
            return vision_api_data # Retorna a resposta completa da API Vision
        except httpx.HTTPStatusError as e:
            # Captura erros HTTP da API Vision
            print(f"Erro da API Vision: {e.response.text}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Erro ao chamar a API Google Vision: {e.response.text}"
            )
        except Exception as e:
            # Captura outros erros inesperados
            print(f"Erro inesperado: {e}")
            raise HTTPException(status_code=500, detail="Erro interno ao processar a imagem.")