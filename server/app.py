from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.schemas import RefineRequest, PipelineResponse, SetApiKeyRequest, ApiKeyStatusResponse
from server.pipeline import run_pipeline, make_custom_client
from server.session_keys import set_api_key, get_api_key, remove_api_key, has_api_key, cleanup_expired
import os
import traceback
import asyncio

app = FastAPI(title="Executive Communication AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def periodic_cleanup():
    while True:
        await asyncio.sleep(3600)
        removed = cleanup_expired()
        if removed:
            print(f"[Session Cleanup] Removed {removed} expired API key(s)")


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_cleanup())


@app.post("/api/refine", response_model=PipelineResponse)
async def refine_communication(request: RefineRequest):
    try:
        client = None
        if request.session_id:
            custom_key = get_api_key(request.session_id)
            if custom_key:
                client = make_custom_client(custom_key)
        result = run_pipeline(request.bullet_points, request.tone, client)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/keys/set")
async def set_key(request: SetApiKeyRequest):
    set_api_key(request.session_id, request.api_key)
    return {"success": True, "session_id": request.session_id}


@app.get("/api/keys/status/{session_id}", response_model=ApiKeyStatusResponse)
async def key_status(session_id: str):
    active = has_api_key(session_id)
    return ApiKeyStatusResponse(
        active=active,
        session_id=session_id,
        using_custom_key=active,
    )


@app.delete("/api/keys/{session_id}")
async def remove_key(session_id: str):
    removed = remove_api_key(session_id)
    return {"success": True, "removed": removed}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


dist_path = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
