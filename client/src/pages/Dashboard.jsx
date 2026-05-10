import { useEffect, useState } from 'react';
import { getTodayStats, getWeeklyStats, getSummary } from '../api.js';
import MacroRing from '../components/MacroRing.jsx';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const GOALS = {
  calories: 2000,
  protein_g: 150,
  carbohydrates_g: 250,
  fat_g: 65,
  fiber_g: 25,
};

function pct(val, goal) { return Math.min(Math.round(((val || 0) / goal) * 100), 100); }

function MacroBar({ label, value, goal, colorClass, hex }) {
  const p = pct(value, goal);
  const over = (value || 0) > goal;
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-slate-400 w-16 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${over ? 'opacity-70' : ''}`}
          style={{ width: `${p}%`, background: hex }}
        />
      </div>
      <div className="text-right shrink-0 w-20">
        <span className={`text-xs font-semibold ${colorClass}`}>{Math.round(value || 0)}</span>
        <span className="text-xs text-slate-600"> / {goal}{label === 'Calories' ? '' : 'g'}</span>
      </div>
    </div>
  );
}

const CustomCalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-light px-3 py-2 rounded-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="font-semibold text-accent">{Math.round(payload[0]?.value || 0)} kcal</p>
    </div>
  );
};

const CustomMacroTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-light px-3 py-2 rounded-xl text-xs space-y-1">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name}: {Math.round(p.value || 0)}g
        </p>
      ))}
    </div>
  );
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [today, setToday] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTodayStats(), getWeeklyStats(), getSummary()])
      .then(([t, w, s]) => {
        setToday(t);
        setWeekly(w);
        setSummary(s);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const t = today?.totals || {};
  const dateStr = new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-14 pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">{greeting()} 🌿</h1>
        <p className="text-sm text-slate-500 mt-0.5">{dateStr}</p>
      </div>

      {/* Stats row */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="card p-4">
            <p className="text-3xl font-bold text-white">{summary.totalMeals}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total meals logged</p>
          </div>
          <div className="card p-4">
            <p className="text-3xl font-bold text-accent">{summary.activeDays}</p>
            <p className="text-xs text-slate-500 mt-0.5">Active days this week</p>
          </div>
        </div>
      )}

      {/* Today section */}
      <div className="card p-5 mb-4">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-4">Today's intake</p>

        {today?.meal_count === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-slate-400 text-sm">No meals logged today yet</p>
            <p className="text-slate-600 text-xs mt-1">Capture a meal to start tracking</p>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <MacroRing nutrition={t} size={130} />
            <div className="flex-1 space-y-3">
              <MacroBar label="Calories" value={t.calories} goal={GOALS.calories} colorClass="text-accent" hex="#22C55E" />
              <MacroBar label="Protein" value={t.protein_g} goal={GOALS.protein_g} colorClass="text-macro-protein" hex="#60A5FA" />
              <MacroBar label="Carbs" value={t.carbohydrates_g} goal={GOALS.carbohydrates_g} colorClass="text-macro-carbs" hex="#FBBF24" />
              <MacroBar label="Fat" value={t.fat_g} goal={GOALS.fat_g} colorClass="text-macro-fat" hex="#F87171" />
              <MacroBar label="Fiber" value={t.fiber_g} goal={GOALS.fiber_g} colorClass="text-macro-fiber" hex="#C084FC" />
            </div>
          </div>
        )}
      </div>

      {/* Weekly calories */}
      {weekly.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Weekly calories</p>
          <p className="text-xs text-slate-600 mb-4">Last 7 days</p>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={weekly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomCalTooltip />} cursor={{ stroke: 'rgba(34,197,94,0.2)', strokeWidth: 1 }} />
              <Area
                type="monotone" dataKey="calories"
                stroke="#22C55E" strokeWidth={2}
                fill="url(#calGrad)" dot={false}
                activeDot={{ r: 4, fill: '#22C55E', stroke: 'rgba(34,197,94,0.4)', strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly macros bar chart */}
      {weekly.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Macro breakdown</p>
          <p className="text-xs text-slate-600 mb-4">Protein · Carbs · Fat per day (g)</p>
          <div className="flex items-center gap-4 mb-3">
            {[['Protein', '#60A5FA'], ['Carbs', '#FBBF24'], ['Fat', '#F87171']].map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[10px] text-slate-500">{name}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={weekly} barSize={6} barGap={1} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomMacroTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="protein_g" name="Protein" fill="#60A5FA" radius={[3, 3, 0, 0]} />
              <Bar dataKey="carbohydrates_g" name="Carbs" fill="#FBBF24" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fat_g" name="Fat" fill="#F87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Micronutrient highlights */}
      {today?.meal_count > 0 && (
        <div className="card p-5">
          <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-4">Micronutrients today</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'sodium_mg', label: 'Sodium', unit: 'mg', goal: 2300, color: '#94A3B8' },
              { key: 'cholesterol_mg', label: 'Cholesterol', unit: 'mg', goal: 300, color: '#FCD34D' },
              { key: 'vitamin_c_mg', label: 'Vitamin C', unit: 'mg', goal: 90, color: '#F97316' },
              { key: 'calcium_mg', label: 'Calcium', unit: 'mg', goal: 1000, color: '#A78BFA' },
              { key: 'iron_mg', label: 'Iron', unit: 'mg', goal: 18, color: '#FB923C' },
              { key: 'potassium_mg', label: 'Potassium', unit: 'mg', goal: 3500, color: '#34D399' },
            ].map(({ key, label, unit, goal, color }) => {
              const val = t[key] || 0;
              const p = pct(val, goal);
              return (
                <div key={key} className="p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{Math.round(val)}<span className="text-xs text-slate-500 font-normal ml-0.5">{unit}</span></p>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: color }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">{p}% of daily goal</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
