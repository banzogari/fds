import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
// const BASE_URL = '/api';   // 상대경로: Vite 프록시(vite.config.js) 경유 — 터널/배포 시 사용

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 서버 상태 확인
export const health = async () => {
  const response = await api.get('/health');
  return response.data;
};

// 단건 예측
export const predict = async (requestData) => {
  const response = await api.post('/predict', requestData);
  return response.data;
};

// 시뮬레이션
export const simulate = async (rowIndex) => {
  const response = await api.post('/simulate', { row_index: rowIndex });
  return response.data;
};