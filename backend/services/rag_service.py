import chromadb
from typing import List, Optional
from models.database import Bill

class RAGService:
    """ChromaDB RAG pipeline"""
    
    COLLECTION_NAME = "bills"
    
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chromadb_data")
        self.collection = self.get_or_create_collection()
        
    def get_or_create_collection(self):
        try:
            return self.client.get_collection(name=self.COLLECTION_NAME)
        except:
            return self.client.create_collection(
                name=self.COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            
    def seed_embeddings(self, bills: List[Bill]):
        """Embed bills and add to ChromaDB"""
        if not bills:
            return
            
        ids = []
        documents = []
        metadatas = []
        
        for bill in bills:
            text = f"Title: {bill.title}\nStatus: {bill.status}\nSummary: {bill.summary}"
            
            # check if already exists
            existing = self.collection.get(ids=[bill.id])
            if existing and existing['ids'] and len(existing['ids']) > 0:
                continue

            ids.append(bill.id)
            documents.append(text)
            intro_date = bill.introduced_date.isoformat() if bill.introduced_date else ""
            metadatas.append({
                "bill_id": bill.id,
                "title": bill.title or "",
                "status": bill.status or "",
                "introduced_date": intro_date
            })
            
        if ids:
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            
    def retrieve_relevant_bills(self, query: str, top_k: int = 5) -> List[dict]:
        """Search ChromaDB for relevant bills"""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )
            
            # Format results
            retrieved = []
            if results and results.get("metadatas") and len(results["metadatas"]) > 0:
                for meta in results["metadatas"][0]:
                    retrieved.append(meta)
            return retrieved
        except Exception as e:
            print(f"RAG retrieval error: {e}")
            return []
