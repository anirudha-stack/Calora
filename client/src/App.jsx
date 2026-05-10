import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Capture from './pages/Capture.jsx';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-slate-100 select-none">
      <main className="pb-20 min-h-screen">
        <Routes>
          <Route path="/" element={<Capture />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
