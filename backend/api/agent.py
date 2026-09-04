from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.schemas import BriefRequest, BriefResponse, PipelineTraceSchema
from main_db_dependency import get_db
# These services would normally be injected or initialized at app startup
from services.agent_service import AgentService
from services.congress_service import CongressService
from services.rag_service import RAGService

router = APIRouter()

congress_service = CongressService()
rag_service = RAGService()
agent_service = AgentService(congress_service, rag_service)

@router.post("/generate-brief", response_model=BriefResponse)
def generate_brief(request: BriefRequest, db: Session = Depends(get_db)):
    result_state = agent_service.generate_brief(request.query, getattr(request, "db_session", db))
    
    traces = []
    for t in result_state.get("pipeline_trace", []):
        traces.append(PipelineTraceSchema(
            step=t.get("step"),
            action=t.get("action"),
            details=t.get("details"),
            duration_ms=t.get("duration_ms")
        ))
        
    return BriefResponse(
        brief=result_state.get("brief", ""),
        trust_score=result_state.get("trust_score", 0.0),
        pipeline_trace=traces,
        brief_id=1,
        bills_cited=[b.get("id") for b in result_state.get("bills_found", [])][:3]
    )
