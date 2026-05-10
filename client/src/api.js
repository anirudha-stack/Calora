async function request(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function analyzeMeal(imageFile) {
  const form = new FormData();
  form.append('image', imageFile);
  return request('/api/meals', { method: 'POST', body: form });
}

export function getMeals(limit = 60, offset = 0) {
  return request(`/api/meals?limit=${limit}&offset=${offset}`);
}

export function deleteMeal(id) {
  return request(`/api/meals/${id}`, { method: 'DELETE' });
}

export function getTodayStats() {
  return request('/api/analytics/today');
}

export function getWeeklyStats() {
  return request('/api/analytics/weekly');
}

export function getSummary() {
  return request('/api/analytics/summary');
}
