import express from 'express';
import multer from 'multer';
import { readFileSync, unlinkSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

const storage = multer.diskStorage({
  destination: join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert nutritionist analyzing a food photo.
Identify ALL food and drink items visible. Estimate realistic portion sizes.

Return ONLY valid JSON — no markdown, no explanation — in this exact format:
{
  "food_items": [
    {"name": "string", "quantity": "string", "confidence": 0.0-1.0}
  ],
  "meal_type": "breakfast|lunch|dinner|snack|drink",
  "nutrition": {
    "calories": number,
    "protein_g": number,
    "carbohydrates_g": number,
    "fat_g": number,
    "saturated_fat_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "cholesterol_mg": number,
    "vitamin_c_mg": number,
    "calcium_mg": number,
    "iron_mg": number,
    "potassium_mg": number
  },
  "analysis_notes": "short one-line description of the meal"
}

Be realistic. Estimate conservatively for partially visible items.`;

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const imageBuffer = readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mediaType = req.file.mimetype;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image },
            },
            { type: 'text', text: SYSTEM_PROMPT },
          ],
        },
      ],
    });

    let analysis;
    try {
      const text = message.content[0].text.trim();
      const jsonStr = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('Claude response parse failed:', message.content[0].text);
      return res.status(500).json({ error: 'Failed to parse nutrition data from AI response' });
    }

    const stmt = db.prepare(`
      INSERT INTO meals (created_at, image_filename, food_items, nutrition, meal_type, analysis_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      Date.now(),
      req.file.filename,
      JSON.stringify(analysis.food_items || []),
      JSON.stringify(analysis.nutrition || {}),
      analysis.meal_type || 'meal',
      analysis.analysis_notes || ''
    );

    const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);
    res.json(formatMeal(meal));
  } catch (err) {
    // Clean up uploaded file on error
    try { unlinkSync(req.file.path); } catch {}
    console.error('Meal analysis error:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const meals = db.prepare(
    'SELECT * FROM meals ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
  res.json(meals.map(formatMeal));
});

router.get('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });
  res.json(formatMeal(meal));
});

router.delete('/:id', (req, res) => {
  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
  if (!meal) return res.status(404).json({ error: 'Meal not found' });

  db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);

  if (meal.image_filename) {
    try {
      unlinkSync(join(__dirname, '..', 'uploads', meal.image_filename));
    } catch {}
  }

  res.json({ success: true });
});

function formatMeal(m) {
  return {
    ...m,
    food_items: JSON.parse(m.food_items),
    nutrition: JSON.parse(m.nutrition),
    image_url: m.image_filename ? `/uploads/${m.image_filename}` : null,
  };
}

export default router;
