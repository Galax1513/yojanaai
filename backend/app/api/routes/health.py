from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict:
    """Liveness/readiness check. Verifies the API process is up and that
    it can reach the database."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
