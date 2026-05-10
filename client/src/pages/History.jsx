import { useEffect, useState, useCallback } from 'react';
import { Trash2, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { getMeals, deleteMeal } from '../api.js';

function groupByDate(meals) {
  const groups = {};
  meals.forEach(m => {
    const d = new Date(m.created_at);
    const key = d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
    const isToday = new Date().toDateString() === d.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === d.toDateString();
    const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : key;
    if (!groups[label]) groups[label] = [];
    groups[label].push(m);
  });
  return groups;
}

function mealTimeLabel(ts) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

const MEAL_TYPE_ICON = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎', drink: '🥤', meal: '🍽️',
};

function MealCard({ meal, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const n = meal.nutrition;
  const topItems = meal.food_items.slice(0, 3);

  const handleDelete = async () => {
    if (!confirm('Remove this meal from your log?')) return;
    setDeleting(true);
    try {
      await onDelete(meal.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`card p-4 flex gap-3 transition-all duration-300 ${deleting ? 'opacity-0 scale-95' : 'opacity-100'}`}
    >
      {/* Thumbnail */}
      <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {meal.image_url ? (
          <img src={meal.image_url} alt="meal" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {MEAL_TYPE_ICON[meal.meal_type] || '🍽️'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-snug">
              {meal.analysis_notes || topItems.map(i => i.name).join(', ') || 'Meal'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px]">{MEAL_TYPE_ICON[meal.meal_type]}</span>
              <span className="text-[10px] text-slate-600 capitalize">{meal.meal_type}</span>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[10px] text-slate-600">{mealTimeLabel(meal.created_at)}</span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: 'rgba(239,68,68,0.08)' }}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
          </button>
        </div>

        <div className="flex gap-3 mt-2.5">
          <div>
            <span className="text-xs font-bold text-accent">{Math.round(n.calories || 0)}</span>
            <span className="text-[10px] text-slate-600 ml-0.5">cal</span>
          </div>
          <div>
            <span className="text-xs font-bold text-macro-protein">{Math.round(n.protein_g || 0)}g</span>
            <span className="text-[10px] text-slate-600 ml-0.5">protein</span>
          </div>
          <div>
            <span className="text-xs font-bold text-macro-carbs">{Math.round(n.carbohydrates_g || 0)}g</span>
            <span className="text-[10px] text-slate-600 ml-0.5">carbs</span>
          </div>
          <div>
            <span className="text-xs font-bold text-macro-fat">{Math.round(n.fat_g || 0)}g</span>
            <span className="text-[10px] text-slate-600 ml-0.5">fat</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getMeals()
      .then(setMeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await deleteMeal(id);
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const grouped = groupByDate(meals);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin-slow" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 pt-14 pb-6">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {meals.length} {meals.length === 1 ? 'meal' : 'meals'} logged
        </p>
      </div>

      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <UtensilsCrossed className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No meals yet</p>
          <p className="text-slate-600 text-sm mt-1">Start by capturing your first meal</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, group]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{date}</p>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <p className="text-xs text-slate-600">
                  {Math.round(group.reduce((s, m) => s + (m.nutrition.calories || 0), 0))} cal
                </p>
              </div>
              <div className="space-y-2.5">
                {group.map(meal => (
                  <MealCard key={meal.id} meal={meal} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
