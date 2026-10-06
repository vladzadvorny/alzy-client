import { useEffect, useRef, useState } from 'preact/hooks';
import { api } from './api.js';

export function Chat({ compact = false }) {
  const [info, setInfo] = useState(null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await api('/public/config');
        if (cancelled) return;
        setInfo(config);
        const saved = sessionStorage.getItem('alzy_chat');
        let session = saved ? JSON.parse(saved) : null;
        if (session) {
          try {
            const result = await api(`/public/chats/${session.id}/messages`, { headers: { Authorization: `Bearer ${session.token}` } });
            if (!cancelled) setMessages(result.messages);
          } catch {
            session = null;
          }
        }
        if (!session) {
          session = await api('/public/chats', { method: 'POST' });
          sessionStorage.setItem('alzy_chat', JSON.stringify(session));
        }
        if (!cancelled) setChat(session);
      } catch (cause) {
        if (!cancelled) setError(cause.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  async function send(event, suggested) {
    event?.preventDefault();
    const text = String(suggested || input).trim();
    if (!text || !chat || busy) return;
    setInput('');
    setError('');
    setMessages(previous => [...previous, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const result = await api(`/public/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${chat.token}` },
        body: { message: text }
      });
      setMessages(previous => [...previous, { role: 'assistant', content: result.reply }]);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class={`chat-shell ${compact ? 'chat-compact' : ''}`}>
      <div class="chat-top">
        <div class="chat-avatar">✦</div>
        <div>
          <strong>Секретарь студии</strong>
          <span>Помогу выбрать время для визита</span>
        </div>
        <i class="online-dot" aria-label="На связи" />
      </div>
      <div class="chat-messages">
        <div class="chat-date">Сегодня</div>
        <div class="message assistant-message">
          Здравствуйте! Это {info?.business?.name || 'студия'}. Помогу выбрать услугу и время для визита.
        </div>
        {messages.map((item, index) => (
          <div key={index} class={`message ${item.role === 'user' ? 'user-message' : 'assistant-message'}`}>{item.content}</div>
        ))}
        {!messages.length && (
          <div class="chat-suggestions">
            <button disabled={!chat} onClick={event => send(event, 'Какие услуги есть?')}>Посмотреть услуги</button>
            <button disabled={!chat} onClick={event => send(event, 'Хочу записаться на стрижку')}>Записаться на стрижку</button>
          </div>
        )}
        {busy && <div class="message assistant-message typing">Секретарь печатает<span>···</span></div>}
        {error && <div class="chat-error">{error}</div>}
        <div ref={end} />
      </div>
      <form class="chat-compose" onSubmit={event => send(event)}>
        <input aria-label="Сообщение" placeholder="Напишите сообщение..." value={input} onInput={event => setInput(event.currentTarget.value)} disabled={!chat || busy} />
        <button type="submit" aria-label="Отправить" disabled={!chat || busy || !input.trim()}>↑</button>
      </form>
      <div class="chat-footnote">Запись подтвердится после вашего согласия</div>
    </div>
  );
}
