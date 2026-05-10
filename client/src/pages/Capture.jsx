import { useRef, useState, useEffect } from 'react';
import { Camera, Check, X, AlertCircle, Zap } from 'lucide-react';
import { analyzeMeal, getTodayStats } from '../api.js';

const FOOD_EMOJI = {
  chicken: '🍗', beef: '🥩', steak: '🥩', fish: '🐟', salmon: '🐟',
  shrimp: '🍤', egg: '🥚', rice: '🍚', pasta: '🍝', noodle: '🍜',
  bread: '🍞', sandwich: '🥪', burger: '🍔', pizza: '🍕', salad: '🥗',
  vegetable: '🥦', broccoli: '🥦', carrot: '🥕', tomato: '🍅', potato: '🥔',
  fruit: '🍎', apple: '🍎', banana: '🍌', orange: '🍊', berry: '🍇',
  soup: '🍲', sushi: '🍣', taco: '🌮', curry: '🍛', stew: '🫕',
  coffee: '☕', tea: '🍵', juice: '🧃', milk: '🥛', water: '💧', smoothie: '🥤',
  cake: '🍰', cookie: '🍪', chocolate: '🍫', yogurt: '🫙', cheese: '🧀',
  avocado: '🥑', hummus: '🫙', oatmeal: '🥣', cereal: '🥣', pancake: '🥞',
};

function getFoodEmoji(name) {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

function MacroPill({ label, value, colorClass }) {
  return (
    <div className="flex flex-col items-center gap-0.5 p-2.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className={`text-lg font-bold ${colorClass}`}>{value}</span>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

function ResultSheet({ result, onClose }) {
  const n = result.nutrition;
  return (
    <div className="glass rounded-t-3xl p-5 pb-8 max-h-[72vh] overflow-y-auto animate-slide-up">
      <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-accent bg-accent-dim px-3 py-1 rounded-full uppercase tracking-widest">
          {result.meal_type}
        </span>
      </div>

      <h2 className="text-xl font-bold text-white leading-snug mb-4">
        {result.analysis_notes || 'Meal analyzed'}
      </h2>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <MacroPill label="Cal" value={Math.round(n.calories || 0)} colorClass="text-accent" />
        <MacroPill label="Protein" value={`${Math.round(n.protein_g || 0)}g`} colorClass="text-macro-protein" />
        <MacroPill label="Carbs" value={`${Math.round(n.carbohydrates_g || 0)}g`} colorClass="text-macro-carbs" />
        <MacroPill label="Fat" value={`${Math.round(n.fat_g || 0)}g`} colorClass="text-macro-fat" />
      </div>

      {result.food_items.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Detected items</p>
          <div className="space-y-2.5">
            {result.food_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-2xl">{getFoodEmoji(item.name)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.quantity}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <div className="w-14 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.round((item.confidence || 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600">{Math.round((item.confidence || 0) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(n.fiber_g > 0 || n.sodium_mg > 0 || n.sugar_g > 0) && (
        <div className="mb-5 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2.5">More details</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {n.fiber_g > 0 && (
              <div>
                <p className="text-sm font-semibold text-macro-fiber">{Math.round(n.fiber_g)}g</p>
                <p className="text-[10px] text-slate-600">Fiber</p>
              </div>
            )}
            {n.sugar_g > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-300">{Math.round(n.sugar_g)}g</p>
                <p className="text-[10px] text-slate-600">Sugar</p>
              </div>
            )}
            {n.sodium_mg > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-300">{Math.round(n.sodium_mg)}mg</p>
                <p className="text-[10px] text-slate-600">Sodium</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-2xl bg-accent text-black font-semibold text-sm tracking-wide glow-green-sm active:scale-98 transition-transform"
      >
        Log Another Meal
      </button>
    </div>
  );
}

export default function Capture() {
  const fileRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | loading | success | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [todayStats, setTodayStats] = useState(null);

  useEffect(() => {
    getTodayStats().then(setTodayStats).catch(() => {});
  }, [result]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setPhase('loading');
    try {
      const data = await analyzeMeal(file);
      setResult(data);
      setPhase('success');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setError('');
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const todayCal = Math.round(todayStats?.totals?.calories || 0);
  const mealCount = todayStats?.meal_count || 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-14 pb-4 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-gradient tracking-tight">Calora</h1>
          <p className="text-xs text-slate-500 mt-0.5">Your personal dietitian</p>
        </div>
        {mealCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Zap className="w-3 h-3 text-accent" />
            <span className="text-xs font-semibold text-accent">{mealCount} today</span>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-8">
        {/* Capture button */}
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-accent/20 scale-150 animate-pulse-ring" />
            <div className="absolute inset-0 rounded-full border border-accent/15 scale-125" />

            <button
              onClick={() => fileRef.current?.click()}
              className="relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 active:scale-95 glow-green"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(34,197,94,0.18), rgba(34,197,94,0.06))',
                border: '2px solid rgba(34,197,94,0.5)',
              }}
            >
              <Camera className="w-14 h-14 text-accent" strokeWidth={1.5} />
            </button>
          </div>

          <div className="text-center">
            <p className="text-slate-300 font-medium">Capture your meal</p>
            <p className="text-slate-600 text-sm mt-1">AI identifies food & tracks nutrients</p>
          </div>
        </div>

        {/* Today summary */}
        {todayCal > 0 && (
          <div className="mt-16 w-full max-w-xs">
            <div className="card p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Today</p>
                <p className="text-xs text-slate-500">{mealCount} {mealCount === 1 ? 'meal' : 'meals'}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold text-white">{todayCal.toLocaleString()}</span>
                  <span className="text-slate-500 text-sm ml-1.5">cal</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    <span className="text-macro-protein font-semibold">{Math.round(todayStats?.totals?.protein_g || 0)}g</span> protein
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="text-macro-carbs font-semibold">{Math.round(todayStats?.totals?.carbohydrates_g || 0)}g</span> carbs
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((todayCal / 2000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5">{todayCal} / 2000 kcal goal</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input — rear camera on mobile */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {/* Loading overlay */}
      {phase === 'loading' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />
          <div className="relative flex flex-col items-center gap-5">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-accent/15" />
              <div className="absolute inset-0 rounded-full border-4 border-t-accent border-transparent animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border-2 border-t-accent/50 border-transparent animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-semibold">Analyzing your meal</p>
              <p className="text-slate-400 text-sm mt-1">Identifying nutrients & macros…</p>
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {phase === 'success' && result && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{
          backgroundImage: preview ? `url(${preview})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-lg" />

          {/* Success badge */}
          <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none animate-scale-in">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center glow-green"
                style={{ background: 'rgba(34,197,94,0.2)', border: '2px solid rgba(34,197,94,0.6)' }}>
                <Check className="w-7 h-7 text-accent" strokeWidth={2.5} />
              </div>
              <p className="text-white font-semibold text-sm">Meal tracked!</p>
            </div>
          </div>

          <div className="relative z-10">
            <ResultSheet result={result} onClose={reset} />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {phase === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="card p-6 w-full max-w-sm animate-scale-in text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-white font-semibold mb-2">Analysis failed</p>
            <p className="text-slate-400 text-sm mb-6">{error}</p>
            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-300 text-sm font-medium">
                Cancel
              </button>
              <button onClick={() => { setPhase('idle'); setError(''); fileRef.current?.click(); }}
                className="flex-1 py-3 rounded-2xl bg-accent text-black text-sm font-semibold">
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
