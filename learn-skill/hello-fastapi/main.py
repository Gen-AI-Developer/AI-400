"""FastAPI Hello World Application."""

from fastapi import FastAPI

app = FastAPI(
    title="Hello FastAPI",
    description="A simple hello world FastAPI application",
    version="0.1.0",
)


@app.get("/")
def root() -> dict[str, str]:
    """Root endpoint returning a hello world message."""
    return {"message": "Hello, World!"}


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
