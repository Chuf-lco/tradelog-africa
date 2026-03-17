from fastapi import FastAPI

app = FastAPI(
    title="TradeLog Africa",
    description="Import/export shipment logger and document consolidator",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}