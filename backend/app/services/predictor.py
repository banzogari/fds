import random
import joblib
import numpy as np
from app.core.config import settings
from app.schemas.prediction import PredictionRequest, PredictionResponse


class Predictor:
    """
    예측 서비스 클래스

    MODEL_MODE에 따라 동작 분기:
    - mock : 랜덤 확률 반환 (테스트용)
    - rf   : RF 단일 모델 추론
    """

    def __init__(self):
        self._rf_model = None

    def _load_rf_model(self):
        """
        RF 모델 지연 로딩 (lazy loading)
        처음 호출 시에만 로드하고 이후 재사용
        """
        if self._rf_model is None:
            self._rf_model = joblib.load(settings.RF_MODEL_PATH)
        return self._rf_model

    def _build_input_vector(self, request: PredictionRequest) -> np.ndarray:
        """
        PredictionRequest → 모델 입력 벡터 변환
        FEATURE_ORDER 기준으로 순서 고정
        """
        row = {
            "Time": request.time,
            "V1": request.v1,   "V2": request.v2,   "V3": request.v3,
            "V4": request.v4,   "V5": request.v5,   "V6": request.v6,
            "V7": request.v7,   "V8": request.v8,   "V9": request.v9,
            "V10": request.v10, "V11": request.v11, "V12": request.v12,
            "V13": request.v13, "V14": request.v14, "V15": request.v15,
            "V16": request.v16, "V17": request.v17, "V18": request.v18,
            "V19": request.v19, "V20": request.v20, "V21": request.v21,
            "V22": request.v22, "V23": request.v23, "V24": request.v24,
            "V25": request.v25, "V26": request.v26, "V27": request.v27,
            "V28": request.v28, "Amount": request.amount,
        }
        # FEATURE_ORDER 순서대로 배열 구성
        vector = [row[feature] for feature in settings.FEATURE_ORDER]
        return np.array(vector).reshape(1, -1)

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        if settings.MODEL_MODE == "mock":
            return self._mock_predict(request)
        elif settings.MODEL_MODE == "rf":
            return self._rf_predict(request)
        else:
            raise NotImplementedError(
                f"MODEL_MODE '{settings.MODEL_MODE}' is not implemented yet"
            )

    def _mock_predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        mock 모드 예측
        실제 모델 없이 랜덤 확률 반환
        """
        threshold = settings.DEFAULT_THRESHOLD
        prob = round(random.uniform(0, 1), 4)
        label = int(prob >= threshold)

        return PredictionResponse(
            transaction_id=0,
            prediction_id=0,
            fraud_probability=prob,
            predicted_label=label,
            threshold=threshold,
            model_mode="mock",
            message="Fraud detected" if label == 1 else "Normal transaction",
        )

    def _rf_predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        RF 모델 추론
        1. 모델 로드 (lazy loading)
        2. 입력 벡터 구성
        3. 확률 추론
        4. threshold 적용 → label 변환
        """
        model = self._load_rf_model()
        threshold = settings.DEFAULT_THRESHOLD

        # 입력 벡터 구성
        X = self._build_input_vector(request)

        # 확률 추론 (fraud 클래스 = index 1)
        prob = round(float(model.predict_proba(X)[0][1]), 4)
        label = int(prob >= threshold)

        return PredictionResponse(
            transaction_id=0,       # DB 미구현 → 임시값
            prediction_id=0,        # DB 미구현 → 임시값
            fraud_probability=prob,
            predicted_label=label,
            threshold=threshold,
            model_mode="rf",
            message="Fraud detected" if label == 1 else "Normal transaction",
        )


# 싱글톤 인스턴스
predictor = Predictor()