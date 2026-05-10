import express from 'express';
import db from '../db.js';

const router = express.Router();

function parseNutrition(raw) {
  try { return JSON.parse(raw); } catch { return {}; }
}

function sumNutrition(meals) {
  return meals.reduce((acc, m) => {
    const n = parseNutrition(m.nutrition);
    Object.keys(n).forEach(key => {
      acc[key] = (acc[key] || 0) + (Number(n[key]) || 0);
    });
    return acc;
  }, {});
}

function dayBounds(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23, 59, 59, 999);
  return [start.getTime(), end.getTime()];
}

// GET /api/analytics/today
router.get('/today', (req, res) => {
  const [start, end] = dayBounds(0);
  const meals = db.prepare(
    'SELECT nutrition, meal_type FROM meals WHERE created_at >= ? AND created_at <= ?'
  ).all(start, end);

  res.json({
    meal_count: meals.length,
    totals: sumNutrition(meals),
  });
});

// GET /api/analytics/weekly — last 7 days of daily totals
router.get('/weekly', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const [start, end] = dayBounds(i);
    const meals = db.prepare(
      'SELECT nutrition FROM meals WHERE created_at >= ? AND created_at <= ?'
    ).all(start, end);

    const date = new Date(start);
    days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      meal_count: meals.length,
      ...sumNutrition(meals),
    });
  }
  res.json(days);
});

// GET /api/analytics/summary
router.get('/summary', (req, res) => {
  const totalMeals = db.prepare('SELECT COUNT(*) as c FROM meals').get().c;
  const [wStart] = dayBounds(6);
  const activeDays = db.prepare(
    'SELECT COUNT(DISTINCT (created_at / 86400000)) as d FROM meals WHERE created_at >= ?'
  ).get(wStart).d;

  res.json({ totalMeals, activeDays });
});

export default router;
