export async function api(path, options = {}) {
  const origin = (
    import.meta.env.VITE_API_ORIGIN ||
    (import.meta.env.DEV ? `http://${location.hostname}:3000` : '')
  ).replace(/\/$/, '');
  const response = await fetch(origin + '/api' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('API недоступен: сервер вернул ответ не в формате JSON');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос');
  return data;
}

export function todayMoscow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', ...options }).format(
    new Date(date + 'T12:00:00Z')
  );
}

export function formatMoment(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value + ':00+03:00'));
}
