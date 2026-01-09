"""FastAPI Hello World Application."""
from fastapi import FastAPI, Depends


app = FastAPI(
    title="Dependency Injection Application",
    description="A Simple API showcasing Dependency Injection",
    version="0.1.0",
)

def config():
    return {"app":"fast_api", "storage":"in-memory"}

@app.get("/hello")
def hello(config: dict = Depends(config)):
    return {"message":"All Good", "app-name":config['app']}