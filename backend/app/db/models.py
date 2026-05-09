from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class Transaction(Base):
    """
    거래 데이터 테이블

    CSV row 데이터를 저장
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    # feature 데이터
    time = Column(Float, nullable=False)
    v1  = Column(Float) 
    v2  = Column(Float)
    v3  = Column(Float)
    v4  = Column(Float)
    v5  = Column(Float)
    v6  = Column(Float)
    v7  = Column(Float)
    v8  = Column(Float)
    v9  = Column(Float)
    v10 = Column(Float)
    v11 = Column(Float)
    v12 = Column(Float)
    v13 = Column(Float)
    v14 = Column(Float)
    v15 = Column(Float)
    v16 = Column(Float)
    v17 = Column(Float)
    v18 = Column(Float)
    v19 = Column(Float)
    v20 = Column(Float)
    v21 = Column(Float)
    v22 = Column(Float)
    v23 = Column(Float)
    v24 = Column(Float)
    v25 = Column(Float)
    v26 = Column(Float)
    v27 = Column(Float)
    v28 = Column(Float)
    amount = Column(Float, nullable=False)

    # 실제 label (시뮬레이션 시에만 존재)
    actual_label = Column(Integer, nullable=True)

    # 생성 시각 자동 기록
    created_at = Column(DateTime, server_default=func.now())


class Prediction(Base):
    """
    예측 결과 테이블

    predictor 결과를 저장
    """
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    # 거래 데이터 참조
    transaction_id = Column(
        Integer,
        ForeignKey("transactions.id"),
        nullable=False
    )

    # 예측 결과
    fraud_probability = Column(Float, nullable=False)
    predicted_label   = Column(Integer, nullable=False)
    threshold         = Column(Float, nullable=False)
    model_mode        = Column(String, nullable=False)

    # 생성 시각 자동 기록
    created_at = Column(DateTime, server_default=func.now())