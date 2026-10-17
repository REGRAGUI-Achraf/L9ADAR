from fastapi import FastAPI

# uvicorn looks for this object: "app.main:app" means module app/main.py, variable app.
app = FastAPI(title="L9aDar AI service")


@app.get("/health")
def health():
    return {"status": "ok"}

