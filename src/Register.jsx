import { useState } from 'preact/hooks';
import { api } from './api.js';

export function Register() {
  const initial = new URLSearchParams(location.search).get('plan');
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: initial === 'finance' ? 'finance' : 'booking' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api('/auth/register', { method: 'POST', body: form }); location.href = '/app'; }
    catch (cause) { setError(cause.message); setBusy(false); }
  }
  return <div class="login-page"><a href="/" class="product-logo"><span>✳</span> alzy</a><form class="login-card register-card" onSubmit={submit}><div class="eyebrow"><span /> 14 ДНЕЙ БЕСПЛАТНО</div><h1>Создайте компанию.</h1><p>Получите собственную страницу записи и кабинет. Карта не нужна.</p><label>Название компании<input value={form.name} onInput={event => setForm({ ...form, name: event.currentTarget.value })} required maxLength="120" placeholder="Например, Студия Линия" /></label><label>Email владельца<input type="email" value={form.email} onInput={event => setForm({ ...form, email: event.currentTarget.value })} required placeholder="you@company.ru" /></label><label>Пароль<input type="password" value={form.password} onInput={event => setForm({ ...form, password: event.currentTarget.value })} required minLength="10" placeholder="Не менее 10 символов" /></label><label>Тариф<select value={form.plan} onChange={event => setForm({ ...form, plan: event.currentTarget.value })}><option value="booking">AI-запись · 499 ₽/мес</option><option value="finance">Запись + финансы · 999 ₽/мес</option></select></label>{error && <div class="admin-error" role="alert">{error}</div>}<button class="primary-button" disabled={busy}>Начать пробный период <span>→</span></button><p>Уже есть аккаунт? <a href="/app" class="inline-link">Войти</a></p></form></div>;
}
