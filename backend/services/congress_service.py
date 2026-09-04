import requests
from datetime import datetime
import json
from sqlalchemy.orm import Session
from models.database import Bill, Sponsor

class CongressService:
    """Wraps Congress.gov API"""
    
    BASE_URL = "https://api.congress.gov/v3"
    API_KEY = "DEMO_KEY"
    
    @classmethod
    def _headers(cls):
        return {"accept": "application/json"}
    
    @classmethod
    def get_bills_by_keyword(cls, keyword: str, limit: int = 20):
        # The true congress API search by keyword can be complicated or require pro features.
        # For this prototype, we will query recent bills and filter locally, or just fetch recent if no keyword.
        # Actually /bill query parameter does not explicitly support simple keyword search in V3 without pro.
        # We will mock the search by returning some seeded bills matching the keyword.
        pass
        
    @classmethod
    def seed_database(cls, db_session: Session):
        """Seed a small batch of recent bills into SQLite for demo purposes."""
        # Check if we already seeded
        if db_session.query(Bill).count() > 0:
            return
            
        try:
            url = f"{cls.BASE_URL}/bill?api_key={cls.API_KEY}&limit=20"
            res = requests.get(url, headers=cls._headers(), timeout=10)
            if res.status_code == 200:
                data = res.json()
                bills_data = data.get("bills", [])
                
                for b in bills_data:
                    bill_id = f"{b.get('congress')}-{b.get('type')}-{b.get('number')}"
                    # Try getting detailed bill for summary
                    title = b.get("title", f"Bill {bill_id}")
                    introduced_date_str = b.get("updateDateIncludingText", "")[:10]
                    introduced_date = None
                    if introduced_date_str:
                        try:
                            introduced_date = datetime.strptime(introduced_date_str, "%Y-%m-%d").date()
                        except:
                            pass
                            
                    db_bill = Bill(
                        id=bill_id,
                        congress=int(b.get("congress", 118)),
                        bill_type=str(b.get("type", "")),
                        bill_number=int(b.get("number", 0)),
                        title=title,
                        summary=title, # mock summary as title
                        introduced_date=introduced_date,
                        status="introduced",
                        url=b.get("url", "")
                    )
                    db_session.add(db_bill)
                    
                    # Add a fake sponsor just for demo visualization
                    sponsor = Sponsor(
                        bill_id=bill_id,
                        member_name="Demo Sponsor",
                        party="I",
                        state="DC",
                        is_lead=1
                    )
                    db_session.add(sponsor)
                    
                db_session.commit()
        except Exception as e:
            print(f"Failed to seed database: {e}")
            db_session.rollback()

    @classmethod
    def get_local_bills_by_keyword(cls, db_session: Session, keyword: str, limit: int = 50):
        if not keyword:
            return db_session.query(Bill).limit(limit).all()
        return db_session.query(Bill).filter(Bill.title.ilike(f"%{keyword}%")).limit(limit).all()

