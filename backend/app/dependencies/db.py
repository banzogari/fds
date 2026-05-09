"""
요청 들어옴
    ↓
get_db() 호출 → DB 세션 생성
    ↓
API 함수 실행 (예측, 저장 등)
    ↓
요청 완료 → 세션 자동 종료 (finally)
"""
from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal


def get_db() -> Generator:
    """
    DB 세션 의존성 주입 함수

    역할
    - 요청마다 새로운 DB 세션 생성
    - 요청 완료 후 세션 자동 종료
    - FastAPI의 Depends()와 함께 사용

    사용 예시:
    def predict(db: Session = Depends(get_db)):
        ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()