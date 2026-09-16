import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';

export default function App() {
  return (
    <BrowserRouter>
      {/* 네비게이션 */}
      <nav style={{
        padding: '15px 40px',
        backgroundColor: '#1a1a2e',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
      }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
          🛡️ FDS
        </span>
        <Link
          to="/"
          style={{ color: '#90caf9', textDecoration: 'none', fontSize: '15px' }}
        >
          대시보드
        </Link>
        <Link
          to="/simulation"
          style={{ color: '#90caf9', textDecoration: 'none', fontSize: '15px' }}
        >
          시뮬레이션
        </Link>
      </nav>

      {/* 페이지 라우팅 */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/simulation" element={<Simulation />} />
      </Routes>
    </BrowserRouter>
  );
}