import { render } from 'preact';
import { Chat } from './Chat.jsx';
import { Demo } from './Demo.jsx';
import { Admin } from './Admin.jsx';
import { Home } from './Home.jsx';
import { Register } from './Register.jsx';
import { Platform } from './Platform.jsx';
import './styles.css';

function App() {
  const path = window.location.pathname;
  document.title = path === '/demo' ? 'Студия Линия — запись онлайн' : path.includes('/book') ? 'Онлайн-запись — Alzy' : 'Alzy — AI-секретарь для малого бизнеса';
  const match = path.match(/^\/b\/([a-z0-9-]+)\/(book|widget)$/);
  const slug = match?.[1] || 'demo';
  if (match?.[2] === 'widget' || path === '/widget') return <Chat compact slug={slug} />;
  if (match?.[2] === 'book' || path === '/book') return <div class="book-page"><header><a href="/" class="product-logo"><span>✳</span> alzy</a><a href={slug === 'demo' ? '/demo' : '/'}>← На главную</a></header><main><div class="book-intro"><div class="eyebrow"><span /> ОНЛАЙН-ЗАПИСЬ</div><h1>Ваш визит<br /><em>начинается здесь.</em></h1><p>Выберите услугу и свободное время. Секретарь поможет с записью.</p></div><Chat slug={slug} /></main></div>;
  if (path === '/register') return <Register />;
  if (path.startsWith('/app') || path.startsWith('/admin')) return <Admin />;
  if (path.startsWith('/platform')) return <Platform />;
  if (path === '/demo') return <Demo />;
  return <Home />;
}

render(<App />, document.getElementById('app'));
