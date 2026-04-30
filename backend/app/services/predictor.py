import random
from app.core.config import settings
from app.schemas.prediction import PredictionRequest, PredictionResponse


class Predictor:
    """
    예측 서비스 클래스

    MODEL_MODE에 따라 동작 분기:
    - mock : 랜덤 확률 반환 (테스트용)
    - rf   : RF 단일 모델 추론 (모델 파일 준비 후 활성화)
    """

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
        - 실제 모델 없이 랜덤 확률 반환
        - 구조 검증 및 프론트 연동 테스트용
        """
        threshold = settings.DEFAULT_THRESHOLD
        prob = round(random.uniform(0, 1), 4)
        label = int(prob >= threshold)

        return PredictionResponse(
            transaction_id=0,       # DB 미구현 → 임시값
            prediction_id=0,        # DB 미구현 → 임시값
            fraud_probability=prob,
            predicted_label=label,
            threshold=threshold,
            model_mode="mock",
            message="Fraud detected" if label == 1 else "Normal transaction",
        )

    def _rf_predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        RF 모델 추론
        - rf.pkl 파일 준비 후 활성화
        - 현재는 NotImplementedError 발생
        """
        # TODO: joblib으로 rf.pkl 로드 후 추론 구현
        raise NotImplementedError("RF model is not loaded yet")


# 싱글톤 인스턴스
predictor = Predictor()