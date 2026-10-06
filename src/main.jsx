import { render } from 'preact';
import { Chat } from './Chat.jsx';
import { Demo } from './Demo.jsx';
import { Admin } from './Admin.jsx';
import './styles.css';

function App() {
  const path = window.location.pathname;
  if (path === '/widget') return <Chat compact />;
  if (path === '/book') return <div class="book-page"><header><a href="/demo" class="wordmark"><span class="wordmark-mark">✳</span> линия<span class="wordmark-period">.</span></a><a href="/demo">← На главную</a></header><main><div class="book-intro"><div class="eyebrow"><span /> ОНЛАЙН-ЗАПИСЬ</div><h1>Ваш визит<br /><em>начинается здесь.</em></h1><p>Расскажите, какая услуга вам нужна. Секретарь предложит свободное время и подтвердит запись.</p></div><Chat /></main></div>;
  if (path.startsWith('/admin')) return <Admin />;
  return <Demo />;
}

render(<App />, document.getElementById('app'));
