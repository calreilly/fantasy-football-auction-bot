import os
import time
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from services.congress_service import CongressService
from services.rag_service import RAGService
from sqlalchemy.orm import Session

class BriefState(TypedDict):
    query: str
    bills_found: List[Any]
    rag_context: str
    reasoning: str
    brief: str
    trust_score: float
    pipeline_trace: List[Dict[str, Any]]
    db_session: Any

class AgentService:
    """LangGraph state machine for brief generation"""
    
    def __init__(self, congress_service: CongressService, rag_service: RAGService):
        self.congress = congress_service
        self.rag = rag_service
        self.graph = self.build_graph()
    
    def build_graph(self):
        graph = StateGraph(BriefState)
        
        graph.add_node("search_congress", self.search_congress_node)
        graph.add_node("retrieve_rag", self.retrieve_rag_node)
        graph.add_node("agent_reasoning", self.agent_reasoning_node)
        graph.add_node("generate_brief", self.generate_brief_node)
        
        graph.set_entry_point("search_congress")
        graph.add_edge("search_congress", "retrieve_rag")
        graph.add_edge("retrieve_rag", "agent_reasoning")
        graph.add_edge("agent_reasoning", "generate_brief")
        graph.add_edge("generate_brief", END)
        
        return graph.compile()
        
    def _call_llm(self, prompt: str, system_prompt: str = "You are a helpful policy analyst.") -> str:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key or api_key == "dummy":
            # Mock LLM for demo purposes if no key provided
            time.sleep(1)
            return "This is a mocked LLM response since no valid OPENAI_API_KEY was provided in the .env. The system has properly ingested your requested RAG context and correctly traversed the LangGraph nodes."
            
        llm = ChatOpenAI(temperature=0.2, model="gpt-3.5-turbo")
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=prompt)
        ]
        return llm.invoke(messages).content

    def search_congress_node(self, state: BriefState):
        start_time = time.time()
        # Query our seeded DB (simulating the Congress API search)
        bills = self.congress.get_local_bills_by_keyword(state["db_session"], state["query"], limit=5)
        
        bills_found = []
        for b in bills:
            bills_found.append({"id": b.id, "title": b.title})
            
        trace = dict(
            step=1, 
            action="congress_search", 
            details=f"Found {len(bills_found)} bills related to query",
            duration_ms=int((time.time() - start_time) * 1000)
        )
        return {"bills_found": bills_found, "pipeline_trace": state.get("pipeline_trace", []) + [trace]}

    def retrieve_rag_node(self, state: BriefState):
        start_time = time.time()
        rag_results = self.rag.retrieve_relevant_bills(state["query"], top_k=3)
        
        rag_context = "\\n".join([
            f"- {r.get('title', 'Unknown')} (ID: {r.get('bill_id', 'Unknown')})"
            for r in rag_results
        ])
        
        trace = dict(
            step=2, 
            action="rag_retrieval", 
            details=f"Retrieved {len(rag_results)} similar bills from ChromaDB",
            duration_ms=int((time.time() - start_time) * 1000)
        )
        return {"rag_context": rag_context, "pipeline_trace": state.get("pipeline_trace", []) + [trace]}

    def agent_reasoning_node(self, state: BriefState):
        start_time = time.time()
        
        prompt = f"""
        Given this user query: "{state['query']}"
        
        Here are relevant bills found from RAG:
        {state['rag_context']}
        
        Write a short CoT (Chain of Thought) analysis about how these bills address the query.
        """
        
        reasoning = self._call_llm(prompt)
        
        trace = dict(
            step=3, 
            action="agent_reasoning", 
            details="CoT analysis complete",
            duration_ms=int((time.time() - start_time) * 1000)
        )
        return {"reasoning": reasoning, "pipeline_trace": state.get("pipeline_trace", []) + [trace]}

    def generate_brief_node(self, state: BriefState):
        start_time = time.time()
        prompt = f"""
        Based on this reasoning:
        {state['reasoning']}
        
        Generate a professional policy brief in markdown format addressing the query: "{state['query']}"
        """
        brief = self._call_llm(prompt, "You are an expert policy briefer.")
        
        trace = dict(
            step=4, 
            action="brief_generation", 
            details="Markdown Brief generated",
            duration_ms=int((time.time() - start_time) * 1000)
        )
        
        return {
            "brief": brief, 
            "trust_score": 0.85, 
            "pipeline_trace": state.get("pipeline_trace", []) + [trace]
        }

    def generate_brief(self, query: str, db_session: Session) -> dict:
        initial_state = {
            "query": query,
            "bills_found": [],
            "rag_context": "",
            "reasoning": "",
            "brief": "",
            "trust_score": 0.0,
            "pipeline_trace": [],
            "db_session": db_session
        }
        final_state = self.graph.invoke(initial_state)
        return final_state
