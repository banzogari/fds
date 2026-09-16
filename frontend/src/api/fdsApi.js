import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. 서버 상태 확인
export const health = async () => {
  const response = await api.get('/health');
  return response.data;
};

// 2. 단건 예측
export const predict = async (requestData) => {
  const response = await api.post('/predict', requestData);
  return response.data;
};

// 3. 시뮬레이션
export const simulate = async (rowIndex) => {
  const response = await api.post('/simulate', { row_index: rowIndex });
  return response.data;
};