# DB에 data 저장 및 조회
from sqlalchemy.orm import Session
from app.db.models import Transaction, Prediction
from app.schemas.prediction import PredictionRequest, PredictionResponse


# Transaction CRUD
def create_transaction(
    db: Session,
    request: PredictionRequest,
    actual_label: int = None
) -> Transaction:
    """
    거래 데이터 저장

    - predict 엔드포인트: actual_label=None
    - simulate 엔드포인트: actual_label=실제 label
    """
    transaction = Transaction(
        time=request.time,
        v1=request.v1,   v2=request.v2,   v3=request.v3,
        v4=request.v4,   v5=request.v5,   v6=request.v6,
        v7=request.v7,   v8=request.v8,   v9=request.v9,
        v10=request.v10, v11=request.v11, v12=request.v12,
        v13=request.v13, v14=request.v14, v15=request.v15,
        v16=request.v16, v17=request.v17, v18=request.v18,
        v19=request.v19, v20=request.v20, v21=request.v21,
        v22=request.v22, v23=request.v23, v24=request.v24,
        v25=request.v25, v26=request.v26, v27=request.v27,
        v28=request.v28,
        amount=request.amount,
        actual_label=actual_label,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def get_transaction(db: Session, transaction_id: int) -> Transaction:
    """
    거래 데이터 단건 조회
    """
    return db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

# Prediction CRUD

def create_prediction(
    db: Session,
    transaction_id: int,
    result: PredictionResponse
) -> Prediction:
    """
    예측 결과 저장
    """
    prediction = Prediction(
        transaction_id=transaction_id,
        fraud_probability=result.fraud_probability,
        predicted_label=result.predicted_label,
        threshold=result.threshold,
        model_mode=result.model_mode,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    return prediction


def get_prediction(db: Session, prediction_id: int) -> Prediction:
    """
    예측 결과 단건 조회
    """
    return db.query(Prediction).filter(
        Prediction.id == prediction_id
    ).first()