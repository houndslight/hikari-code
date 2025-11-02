"""
Ultra-lightweight FastAPI Coding Chatbot
Optimized for: Ryzen 7 5900x + Radeon 6500 XT (4GB VRAM)
Target: <2GB VRAM usage, low latency responses
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, AsyncGenerator, Union
import httpx
import logging
import time
import os
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed from INFO to DEBUG
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('chatbot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Ultra-Lightweight Coding Chatbot",
    description="Optimized for low VRAM usage and fast responses",
    version="1.0.0"
)

# Add CORS middleware AFTER app is defined
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for dev; narrow down later if you want
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
class Config:
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    VLLM_BASE_URL = os.getenv("VLLM_BASE_URL", "http://localhost:8000")
    DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "phi3:mini")
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "2048"))
    TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
    MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
    REQUEST_TIMEOUT = 120.0

config = Config()

# Global state
current_backend = "ollama"
current_model = config.DEFAULT_MODEL

# Request/Response Models
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    messages: List[Union[ChatMessage, Dict[str, Any]]]
    model: Optional[str] = None
    stream: bool = True
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    
    @field_validator('messages', mode='before')
    @classmethod
    def validate_messages(cls, v):
        """Allow both ChatMessage objects and plain dicts"""
        if not isinstance(v, list):
            raise ValueError("messages must be a list")
        
        normalized = []
        for msg in v:
            if isinstance(msg, dict):
                if 'role' not in msg or 'content' not in msg:
                    raise ValueError("Each message must have 'role' and 'content' fields")
                normalized.append(msg)
            elif isinstance(msg, ChatMessage):
                normalized.append({"role": msg.role, "content": msg.content})
            else:
                normalized.append(msg)
        
        return normalized

class ModelInfo(BaseModel):
    name: str
    backend: str
    status: str

class HealthResponse(BaseModel):
    status: str
    backend: str
    model: str
    ollama_available: bool
    vllm_available: bool
    timestamp: str

# Utility Functions
async def check_ollama_health() -> bool:
    """Check if Ollama is available"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{config.OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception as e:
        logger.warning(f"Ollama health check failed: {e}")
        return False

async def check_vllm_health() -> bool:
    return False


def get_mock_response(prompt: str) -> str:
    """Generate mock response when no backend is available"""
    return f"""# Mock Response (No Backend Available)

I'm a fallback mock assistant. Here's what I would help with:

**Your question:** {prompt[:100]}{'...' if len(prompt) > 100 else ''}

**Mock Capabilities:**
- Code generation and debugging
- Architecture suggestions
- Algorithm explanations
- Best practices advice

**To enable real responses:**
1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Pull a model: `ollama pull codellama:7b-instruct`
3. Or configure vLLM endpoint

**Recommended lightweight models (<2GB VRAM):**
- `deepseek-coder:1.3b-instruct`
- `phi:2.7b`
- `tinyllama:1.1b`
- `qwen:1.8b`
"""

async def stream_ollama(messages: List[Dict], model: str, temperature: float) -> AsyncGenerator[str, None]:
    """Stream responses from Ollama"""
    url = f"{config.OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": model,
        "messages": [{"role": m["role"], "content": m["content"]} for m in messages],
        "stream": True,
        "options": {
            "temperature": temperature,
            "num_predict": config.MAX_TOKENS,
            "num_ctx": 4096  # Context window
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"Ollama error: {error_text}")
                    error_json = json.dumps({"error": f"Ollama error: {response.status_code}"})
                    yield f"data: {error_json}\n\n"
                    return
                
                async for chunk in response.aiter_lines():
                    if chunk:
                        try:
                            # Log raw chunk for debugging
                            logger.debug(f"Raw Ollama chunk: {chunk[:100]}")
                            
                            # Parse the Ollama response
                            data = json.loads(chunk)
                            
                            # Extract content from message
                            if "message" in data and "content" in data["message"]:
                                content = data["message"]["content"]
                                done = data.get("done", False)
                                
                                # Format for frontend
                                response_data = {
                                    "content": content,
                                    "done": done
                                }
                                formatted = f"data: {json.dumps(response_data)}\n\n"
                                logger.debug(f"Sending to frontend: {formatted[:100]}")
                                yield formatted
                            elif "done" in data and data["done"]:
                                # Final done message
                                formatted = f"data: {json.dumps({'done': True})}\n\n"
                                logger.debug(f"Sending final done: {formatted}")
                                yield formatted
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse chunk: {chunk}, error: {e}")
                            continue
    except Exception as e:
        logger.error(f"Ollama streaming error: {e}")
        error_json = json.dumps({"error": f"Connection failed: {str(e)}"})
        yield f"data: {error_json}\n\n"

async def stream_vllm(messages: List[Dict], model: str, temperature: float) -> AsyncGenerator[str, None]:
    """Stream responses from vLLM"""
    url = f"{config.VLLM_BASE_URL}/v1/chat/completions"
    
    # Convert messages to vLLM format
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "temperature": temperature,
        "max_tokens": config.MAX_TOKENS
    }
    
    try:
        async with httpx.AsyncClient(timeout=config.REQUEST_TIMEOUT) as client:
            async with client.stream("POST", url, json=payload) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"vLLM error: {error_text}")
                    yield f"data: {{'error': 'vLLM error: {response.status_code}'}}\n\n"
                    return
                
                async for chunk in response.aiter_lines():
                    if chunk and chunk.startswith("data: "):
                        yield f"{chunk}\n\n"
    except Exception as e:
        logger.error(f"vLLM streaming error: {e}")
        yield f"data: {{'error': 'Connection failed: {str(e)}'}}\n\n"

# API Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with backend status"""
    ollama_ok = await check_ollama_health()
    vllm_ok = await check_vllm_health()
    
    return HealthResponse(
        status="healthy" if (ollama_ok or vllm_ok or config.MOCK_MODE) else "degraded",
        backend=current_backend,
        model=current_model,
        ollama_available=ollama_ok,
        vllm_available=vllm_ok,
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/chat")
async def chat(request: Request):
    """Main chat endpoint with streaming support - accepts raw JSON"""
    start_time = time.time()
    
    try:
        # Parse raw JSON body
        body = await request.json()
        logger.info(f"Received chat request body: {json.dumps(body)[:200]}")
        
        # Handle both frontend formats:
        # 1. {"message": "text"} - simple format from frontend
        # 2. {"messages": [{role, content}]} - standard format
        if "message" in body and "messages" not in body:
            # Convert simple format to standard format
            body["messages"] = [{"role": "user", "content": body["message"]}]
            logger.info("Converted simple message format to messages array")
        
        # Validate and parse with Pydantic
        chat_req = ChatRequest(**body)
        
        # Use provided model or default
        model = chat_req.model or current_model
        temperature = chat_req.temperature or config.TEMPERATURE
        
        logger.info(f"Chat request - Backend: {current_backend}, Model: {model}, Messages: {len(chat_req.messages)}")
        
        # Ensure messages are in dict format
        messages = []
        for m in chat_req.messages:
            if isinstance(m, dict):
                messages.append({"role": m["role"], "content": m["content"]})
            else:
                messages.append({"role": m.role, "content": m.content})
        
        # Mock mode fallback
        if config.MOCK_MODE:
            last_user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
            mock_resp = get_mock_response(last_user_msg)
            
            async def mock_stream():
                yield f"data: {{'message': {{'role': 'assistant', 'content': '{mock_resp}'}}, 'done': false}}\n\n"
                yield f"data: {{'done': true}}\n\n"
            
            return StreamingResponse(mock_stream(), media_type="text/event-stream")
        
        # Route to appropriate backend
        if chat_req.stream:
            if current_backend == "ollama":
                return StreamingResponse(
                    stream_ollama(messages, model, temperature),
                    media_type="text/event-stream"
                )
            else:
                return StreamingResponse(
                    stream_vllm(messages, model, temperature),
                    media_type="text/event-stream"
                )
        else:
            # Non-streaming response (less common)
            raise HTTPException(status_code=400, detail="Non-streaming mode not implemented. Use stream=true")
    
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/models/switch")
async def switch_model(model_name: str, backend: Optional[str] = None):
    """Switch the active model and/or backend"""
    global current_model, current_backend
    
    if backend and backend not in ["ollama", "vllm"]:
        raise HTTPException(status_code=400, detail="Backend must be 'ollama' or 'vllm'")
    
    old_model = current_model
    old_backend = current_backend
    
    current_model = model_name
    if backend:
        current_backend = backend
    
    logger.info(f"Model switched: {old_backend}/{old_model} -> {current_backend}/{current_model}")
    
    return {
        "status": "success",
        "previous": {"backend": old_backend, "model": old_model},
        "current": {"backend": current_backend, "model": current_model}
    }

@app.get("/models/list")
async def list_models():
    """List available models from the current backend"""
    try:
        if current_backend == "ollama":
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{config.OLLAMA_BASE_URL}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "backend": "ollama",
                        "models": [m["name"] for m in data.get("models", [])]
                    }
        else:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{config.VLLM_BASE_URL}/v1/models")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "backend": "vllm",
                        "models": [m["id"] for m in data.get("data", [])]
                    }
    except Exception as e:
        logger.error(f"Failed to list models: {e}")
        raise HTTPException(status_code=503, detail=f"Backend unavailable: {str(e)}")

@app.get("/models/current")
async def get_current_model():
    """Get currently active model"""
    return ModelInfo(
        name=current_model,
        backend=current_backend,
        status="active"
    )

@app.get("/logs/recent")
async def get_recent_logs(lines: int = 50):
    """Get recent log entries"""
    try:
        with open('chatbot.log', 'r') as f:
            all_lines = f.readlines()
            return {"logs": all_lines[-lines:]}
    except Exception as e:
        return {"error": str(e), "logs": []}

# Mount static files for web UI
# Mount built frontend (Vite build)
frontend_dir = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
    logger.info("✓ Frontend UI mounted successfully from /frontend/dist")
else:
    logger.warning("Frontend build not found. Run 'npm run build' in the frontend folder.")

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("="*50)
    logger.info("Ultra-Lightweight Coding Chatbot Started")
    logger.info(f"Default Backend: {current_backend}")
    logger.info(f"Default Model: {current_model}")
    logger.info(f"Ollama URL: {config.OLLAMA_BASE_URL}")
    logger.info(f"vLLM URL: {config.VLLM_BASE_URL}")
    logger.info(f"Mock Mode: {config.MOCK_MODE}")
    logger.info("="*50)
    
    # Check backend availability
    ollama_ok = await check_ollama_health()
    vllm_ok = await check_vllm_health()
    
    if not ollama_ok and not vllm_ok and not config.MOCK_MODE:
        logger.warning("⚠️  No backends available! Enable MOCK_MODE or start Ollama/vLLM")
    elif ollama_ok:
        logger.info("✓ Ollama is available")
    elif vllm_ok:
        logger.info("✓ vLLM is available")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        log_level="info",
        reload=False  # Disable in production
    )