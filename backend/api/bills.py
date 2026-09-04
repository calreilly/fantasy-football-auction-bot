from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from models.schemas import BillListResponse, BillDetail
from models.database import Bill
# In a real app we'd inject this via a dependency
from main_db_dependency import get_db

router = APIRouter()

@router.get("/today", response_model=BillListResponse)
def get_bills_today(db: Session = Depends(get_db)):
    bills = db.query(Bill).limit(10).all()
    results = []
    for b in bills:
        results.append(BillDetail(
            id=b.id,
            title=b.title,
            status=b.status,
            introduced_date=b.introduced_date
        ))
    return BillListResponse(bills=results, count=len(results))

@router.get("/search", response_model=BillListResponse)
def search_bills(q: str, db: Session = Depends(get_db)):
    bills = db.query(Bill).filter(Bill.title.ilike(f"%{q}%")).limit(10).all()
    results = []
    for b in bills:
        results.append(BillDetail(
            id=b.id,
            title=b.title,
            status=b.status,
            introduced_date=b.introduced_date
        ))
    return BillListResponse(bills=results, count=len(results))
