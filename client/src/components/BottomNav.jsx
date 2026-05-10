import { useLocation, Link } from 'react-router-dom';
import { Camera, BarChart2, Clock } from 'lucide-react';

const NAV = [
  { to: '/', icon: Camera, label: 'Capture' },
  { to: '/dashboard', icon: BarChart2, label: 'Insights' },
  { to: '/history', icon: Clock, label: 'History' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: 'rgba(7,9,14,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
      <div className="flex items-center">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95"
            >
              <div className="relative">
                {active && (
                  <div className="absolute -inset-2 rounded-xl"
                    style={{ background: 'rgba(34,197,94,0.1)' }} />
                )}
                <Icon
                  className={`w-5 h-5 relative transition-colors duration-200 ${active ? 'text-accent' : 'text-slate-600'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-accent' : 'text-slate-600'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
