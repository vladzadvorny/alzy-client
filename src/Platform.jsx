import { useEffect, useState } from 'preact/hooks';
import { api } from './api.js';

export function Platform() {
  const [auth, setAuth] = useState(null);
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { const result = await api('/platform/requests'); setRequests(result.requests); }
  useEffect(() => { api('/platform/me').then(() => { setAuth(true); load().catch(cause => setError(cause.message)); }).catch(() => setAuth(false)); }, []);
  async function login(event) { event.preventDefault(); setBusy(true); setError(''); try { await api('/platform/login', { method: 'POST', body: { password } }); setAuth(true); await load(); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }
  async function act(id, action) { setBusy(true); setError(''); try { await api(`/platform/requests/${id}/${action}`, { method: 'POST' }); await load(); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }
  if (auth === null) return <div class="admin-loading">Загрузка…</div>;
  if (!auth) return <div class="login-page"><a href="/" class="product-logo"><span>✳</span> alzy</a><form class="login-card" onSubmit={login}><h1>Платформа</h1><p>Вход для ручной активации тарифов.</p><label>Пароль администратора<input type="password" value={password} onInput={event => setPassword(event.currentTarget.value)} required /></label>{error && <div class="admin-error">{error}</div>}<button class="primary-button" disabled={busy}>Войти →</button></form></div>;
  return <div class="platform-page"><header><a href="/" class="product-logo"><span>✳</span> alzy</a><button onClick={async () => { await api('/platform/logout', { method: 'POST' }); setAuth(false); }}>Выйти</button></header><main><div class="eyebrow"><span /> УПРАВЛЕНИЕ ПЛАТФОРМОЙ</div><h1>Запросы на продление</h1><p>Подтверждайте активацию после получения оплаты вне CRM.</p>{error && <div class="admin-error">{error}</div>}<div class="platform-list">{requests.map(item => <article><div><strong>{item.name}</strong><small>{item.email} · /b/{item.slug}/book</small><span>{item.plan === 'finance' ? '999 ₽ · запись + финансы' : '499 ₽ · AI-запись'} · {item.status === 'pending' ? 'ожидает' : item.status === 'approved' ? 'одобрен' : 'отклонён'}</span></div>{item.status === 'pending' && <div class="platform-actions"><button disabled={busy} onClick={() => act(item.id, 'approve')}>Активировать на месяц</button><button disabled={busy} onClick={() => act(item.id, 'reject')}>Отклонить</button></div>}</article>)}{!requests.length && <p>Запросов пока нет.</p>}</div></main></div>;
}
