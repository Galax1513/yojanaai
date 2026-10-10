import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exception_handlers import http_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("yojanaai")

app = FastAPI(
    title="YojanaAI API",
    description=(
        "Profile, scheme catalog and eligibility API for YojanaAI. Matches "
        "are produced by a deterministic rules engine "
        "(app/services/eligibility_engine.py) and are potential matches only — "
        "never a guarantee of eligibility."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def known_http_exception_handler(request: Request, exc: HTTPException):
    # Pass through intentional, well-formed errors (404s, validation, etc.)
    return await http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Never leak a stack trace or database error detail to the client —
    # log it server-side and return a generic message instead.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )


app.include_router(api_router)


@app.get("/")
def root() -> dict:
    return {"service": "yojanaai-api", "docs": "/docs"}
