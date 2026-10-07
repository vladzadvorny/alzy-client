import { useEffect } from 'preact/hooks';
import { Chat } from '../Chat.jsx';

const title = 'Онлайн-запись — Alzy';

function useBookingTitle() {
  useEffect(() => { document.title = title; }, []);
}

export function Booking({ slug = 'demo' }) {
  useBookingTitle();
  return <div class="book-page"><header><a href="/" class="product-logo"><span>✳</span> alzy</a><a href={slug === 'demo' ? '/demo' : '/'}>← На главную</a></header><main><div class="book-intro"><div class="eyebrow"><span /> ОНЛАЙН-ЗАПИСЬ</div><h1>Ваш визит<br /><em>начинается здесь.</em></h1><p>Выберите услугу и свободное время. Секретарь поможет с записью.</p></div><Chat slug={slug} /></main></div>;
}

export function Widget({ slug = 'demo' }) {
  useBookingTitle();
  return <Chat compact slug={slug} />;
}
