from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from main_db_dependency import engine, Base, SessionLocal
from api import bills, agent
from services.congress_service import CongressService
from services.rag_service import RAGService
from models.database import Bill

# Create tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database with bills
    db = SessionLocal()
    congress_service = CongressService()
    rag_service = RAGService()
    
    print("Seeding Congress.gov data...")
    congress_service.seed_database(db)
    
    print("Seeding RAG embeddings...")
    all_bills = db.query(Bill).all()
    rag_service.seed_embeddings(all_bills)
    
    db.close()
    print("Startup complete. System ready.")
    yield
    # Shutdown setup if needed

app = FastAPI(title="PolicyWatch API", lifespan=lifespan)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    # Allow local frontend dev server
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(bills.router, prefix="/api/bills", tags=["bills"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
