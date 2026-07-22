import os
import glob
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# ---------------------------------------------------------
# 1. Configuración Inicial
# ---------------------------------------------------------
API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("CRÍTICO: La variable de entorno GEMINI_API_KEY no está configurada.")

genai.configure(api_key=API_KEY)

# Ruta donde se alojan los PDFs
DOCS_DIR = "./docs" 

SYSTEM_PROMPT = (
    'Eres el Asistente Virtual Oficial del ITEC. Responde con máxima prioridad '
    'basándote en los documentos adjuntos. Si la respuesta no está en los documentos, '
    'recurre al conocimiento general/búsqueda web pero aclara obligatoriamente: '
    '"Esta información no figura en la documentación oficial del ITEC, pero...". '
    'Sé breve, profesional y responde en español.'
)

# Estado global para mantener la referencia a los archivos y el modelo
app_state = {
    "uploaded_files": [],
    "model": None
}

# ---------------------------------------------------------
# 2. Ciclo de Vida (Lifespan) - Carga de Archivos
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Se ejecuta al arrancar el servidor. Busca, sube y valida 
    los PDFs usando la File API de Google.
    """
    print("[INIT] Iniciando servidor y buscando documentos PDF...")
    pdf_files = glob.glob(os.path.join(DOCS_DIR, "*.pdf"))
    
    if not pdf_files:
        print(f"[WARN] No se encontraron archivos PDF en el directorio: {DOCS_DIR}")
    
    uploaded_files = []
    for pdf_path in pdf_files:
        try:
            print(f"-> Subiendo {pdf_path} a Gemini...")
            uploaded_file = genai.upload_file(path=pdf_path, display_name=os.path.basename(pdf_path))
            
            while uploaded_file.state.name == "PROCESSING":
                print(".", end="", flush=True)
                time.sleep(2)
                uploaded_file = genai.get_file(uploaded_file.name)
                
            if uploaded_file.state.name == "FAILED":
                print(f"\n[ERROR] Falló el procesamiento del archivo: {pdf_path}")
                continue
                
            uploaded_files.append(uploaded_file)
            print(f"\n[OK] Listo para usar: {uploaded_file.uri}")
            
        except Exception as e:
            print(f"\n[ERROR] Excepción subiendo {pdf_path}: {e}")

    app_state["uploaded_files"] = uploaded_files

    app_state["model"] = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT
    )
    
    yield
    
    print("[SHUTDOWN] Apagando servidor...")

# ---------------------------------------------------------
# 3. Inicialización de FastAPI y Middlewares
# ---------------------------------------------------------
app = FastAPI(title="API Asistente ITEC", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# 4. Modelos de Pydantic
# ---------------------------------------------------------
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# ---------------------------------------------------------
# 5. Endpoints
# ---------------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    try:
        model = app_state["model"]
        contents = app_state["uploaded_files"] + [request.message]
        response = model.generate_content(contents)
        
        return ChatResponse(response=response.text)
    
    except Exception as e:
        print(f"[ERROR POST /chat] Falló la comunicación con Gemini: {e}")
        raise HTTPException(status_code=500, detail="Error interno al generar la respuesta.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
