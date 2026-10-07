import { useEffect, useRef, useState } from 'preact/hooks';
import { api, todayMoscow } from './api.js';

export function Chat({ compact = false, slug = 'demo' }) {
  const base = `/public/${encodeURIComponent(slug)}`;
  const [info, setInfo] = useState(null);
  const [chat, setChat] = useState(null);
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ service_id: '', date: todayMoscow(), start: '', client_name: '', phone: '' });
  const [slots, setSlots] = useState([]);
  const [complete, setComplete] = useState(null);
  const end = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await api(base + '/config');
        if (cancelled) return;
        setInfo(config);
        setMode(config.mode);
        setForm(previous => ({ ...previous, service_id: String(config.services[0]?.id || '') }));
        const key = 'alzy_chat_' + slug;
        const saved = sessionStorage.getItem(key);
        let session = saved ? JSON.parse(saved) : null;
        if (session) {
          try {
            const result = await api(`${base}/chats/${session.id}/messages`, { headers: { Authorization: `Bearer ${session.token}` } });
            if (!cancelled) { setMessages(result.messages); setMode('chat'); }
          } catch { session = null; }
        }
        if (!session) {
          if (config.mode === 'form') return;
          session = await api(base + '/chats', { method: 'POST' });
          if (session.mode === 'form') { setMode('form'); return; }
          sessionStorage.setItem(key, JSON.stringify(session));
        }
        if (!cancelled) setChat(session);
      } catch (cause) { if (!cancelled) setError(cause.message); }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => {
    if (mode !== 'form' || !form.service_id || !form.date) return;
    api(`${base}/availability?serviceId=${form.service_id}&date=${form.date}`).then(result => setSlots(result.slots)).catch(() => setSlots([]));
  }, [base, mode, form.service_id, form.date]);

  async function send(event, suggested) {
    event?.preventDefault();
    const value = String(suggested || input).trim();
    if (!value || !chat || busy) return;
    setInput(''); setError(''); setBusy(true);
    setMessages(previous => [...previous, { role: 'user', content: value }]);
    try {
      const result = await api(`${base}/chats/${chat.id}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${chat.token}` }, body: { message: value } });
      setMessages(previous => [...previous, { role: 'assistant', content: result.reply }]);
      if (result.mode === 'form') setMode('form');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function submitForm(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api(base + '/bookings', { method: 'POST', body: { ...form, service_id: Number(form.service_id) } });
      setComplete(result.id);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  if (mode === 'form') return <div class={`chat-shell booking-form-shell ${compact ? 'chat-compact' : ''}`}>
    <div class="chat-top"><div class="chat-avatar">✦</div><div><strong>{info?.business?.name || 'Онлайн-запись'}</strong><span>Выберите услугу и свободное время</span></div></div>
    {complete ? <div class="booking-success"><span>✓</span><h2>Вы записаны!</h2><p>Номер записи: {complete}. До встречи!</p></div> : <form class="booking-form" onSubmit={submitForm}>
      <p>Запишитесь через форму — доступное время проверяется перед подтверждением.</p>
      <label>Услуга<select value={form.service_id} onChange={event => setForm({ ...form, service_id: event.currentTarget.value, start: '' })} required><option value="">Выберите услугу</option>{info?.services?.map(item => <option value={item.id}>{item.name}{item.price_rub == null ? '' : ` · ${item.price_rub} ₽`}</option>)}</select></label>
      <label>Дата<input type="date" min={todayMoscow()} value={form.date} onInput={event => setForm({ ...form, date: event.currentTarget.value, start: '' })} required /></label>
      <label>Свободное время<select value={form.start} onChange={event => setForm({ ...form, start: event.currentTarget.value })} required><option value="">Выберите время</option>{slots.map(slot => <option value={slot}>{slot.slice(11)}</option>)}</select></label>
      <label>Ваше имя<input value={form.client_name} onInput={event => setForm({ ...form, client_name: event.currentTarget.value })} required /></label>
      <label>Телефон<input type="tel" value={form.phone} onInput={event => setForm({ ...form, phone: event.currentTarget.value })} placeholder="+7 999 123-45-67" required /></label>
      {error && <div class="chat-error">{error}</div>}
      <button class="primary-button" disabled={busy || !form.start}>Подтвердить запись <span>→</span></button>
    </form>}
  </div>;

  return <div class={`chat-shell ${compact ? 'chat-compact' : ''}`}>
    <div class="chat-top"><div class="chat-avatar">✦</div><div><strong>Секретарь · {info?.business?.name || 'компания'}</strong><span>Помогу выбрать время для визита</span></div><i class="online-dot" aria-label="На связи" /></div>
    <div class="chat-messages"><div class="chat-date">Сегодня</div><div class="message assistant-message">Здравствуйте! Это {info?.business?.name || 'компания'}. Помогу выбрать услугу и время для визита.</div>
      {messages.map((item, index) => <div key={index} class={`message ${item.role === 'user' ? 'user-message' : 'assistant-message'}`}>{item.content}</div>)}
      {!messages.length && <div class="chat-suggestions"><button disabled={!chat} onClick={event => send(event, 'Какие услуги есть?')}>Посмотреть услуги</button><button disabled={!chat} onClick={event => send(event, 'Хочу записаться')}>Записаться</button></div>}
      {busy && <div class="message assistant-message typing">Секретарь печатает<span>···</span></div>}{error && <div class="chat-error">{error}</div>}<div ref={end} />
    </div>
    <form class="chat-compose" onSubmit={event => send(event)}><input aria-label="Сообщение" placeholder="Напишите сообщение..." value={input} onInput={event => setInput(event.currentTarget.value)} disabled={!chat || busy} /><button type="submit" aria-label="Отправить" disabled={!chat || busy || !input.trim()}>↑</button></form>
    <button class="chat-form-link" onClick={() => setMode('form')}>Выбрать услугу и время без чата →</button>
    <div class="chat-footnote">Запись подтвердится после вашего согласия</div>
  </div>;
}
