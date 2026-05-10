import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data.json');

mkdirSync(join(__dirname, 'uploads'), { recursive: true });

let store = { meals: [], nextId: 1 };

if (existsSync(DATA_FILE)) {
  try { store = JSON.parse(readFileSync(DATA_FILE, 'utf8')); } catch {}
}

function persist() {
  writeFileSync(DATA_FILE, JSON.stringify(store));
}

export function insertMeal({ image_filename, food_items, nutrition, meal_type, analysis_notes }) {
  const meal = {
    id: store.nextId++,
    created_at: Date.now(),
    image_filename: image_filename || null,
    food_items: food_items || [],
    nutrition: nutrition || {},
    meal_type: meal_type || 'meal',
    analysis_notes: analysis_notes || '',
  };
  store.meals.unshift(meal);
  persist();
  return meal;
}

export function getMeals(limit = 50, offset = 0) {
  return store.meals.slice(offset, offset + limit);
}

export function getMealById(id) {
  return store.meals.find(m => m.id === Number(id)) || null;
}

export function deleteMealById(id) {
  const idx = store.meals.findIndex(m => m.id === Number(id));
  if (idx === -1) return false;
  store.meals.splice(idx, 1);
  persist();
  return true;
}

export function getMealsInRange(start, end) {
  return store.meals.filter(m => m.created_at >= start && m.created_at <= end);
}

export function getMealCount() {
  return store.meals.length;
}
