from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse
import time
import logging

from app.core.config import settings
from app.core.response import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi import HTTPException

from app.api.routes import health as health_routes
from app.api.routes import scenarios as scenarios_routes
from app.api.routes import auth as auth_routes
from app.api.routes import realtime as realtime_routes
from app.api.routes import maps as maps_routes
from app.api.routes import maps as maps_routes


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version=settings.VERSION, default_response_class=ORJSONResponse)

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # Compression
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # Structured request logging (basic JSON to stdout) using custom logger
    logger = logging.getLogger("app.requests")

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s",
            {
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": round(duration_ms, 2),
            },
        )
        return response

    # Routers
    api = FastAPI(
        title=f"{settings.APP_NAME} API",
        version=settings.VERSION,
        default_response_class=ORJSONResponse,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )
    # Apply CORS on mounted API app as well (for dev frontends on 127.0.0.1)
    api.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Register exception handlers on the mounted API app as well
    api.add_exception_handler(HTTPException, http_exception_handler)
    api.add_exception_handler(RequestValidationError, validation_exception_handler)
    api.add_exception_handler(Exception, unhandled_exception_handler)
    # CORS on API app
    api.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.mount(settings.API_PREFIX, api)

    api.include_router(health_routes.router)
    api.include_router(scenarios_routes.router)
    api.include_router(auth_routes.router)
    api.include_router(realtime_routes.router)
    api.include_router(maps_routes.router)
    api.include_router(maps_routes.router)

    return app


app = create_app()


