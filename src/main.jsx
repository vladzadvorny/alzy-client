import { LocationProvider, Router, Route, hydrate, prerender as renderStatic } from 'preact-iso';
import { Demo, title as demoTitle } from './pages/Demo.jsx';
import { Admin } from './pages/Admin.jsx';
import { Home, title as homeTitle } from './pages/Home.jsx';
import { Register } from './pages/Register.jsx';
import { Platform } from './pages/Platform.jsx';
import { Booking, Widget } from './pages/Booking.jsx';
import { NotFound } from './pages/NotFound.jsx';
import './styles.css';

function App() {
  return <LocationProvider><Router>
    <Route path="/" component={Home} />
    <Route path="/demo" component={Demo} />
    <Route path="/register" component={Register} />
    <Route path="/app/:rest*" component={Admin} />
    <Route path="/admin/:rest*" component={Admin} />
    <Route path="/platform/:rest*" component={Platform} />
    <Route path="/b/:slug/book" component={Booking} />
    <Route path="/b/:slug/widget" component={Widget} />
    <Route path="/book" component={Booking} />
    <Route path="/widget" component={Widget} />
    <Route default component={NotFound} />
  </Router></LocationProvider>;
}

if (typeof window !== 'undefined') {
  const root = document.getElementById('app');
  const data = document.getElementById('prerender-data');
  const prerenderedPath = data && new URL(JSON.parse(data.textContent).url, location.origin).pathname;
  const normalizePath = path => path.replace(/\/+$/, '') || '/';
  if (prerenderedPath && normalizePath(prerenderedPath) !== normalizePath(location.pathname)) {
    // Vite preview can use the prerendered home page as an SPA fallback.
    root.replaceChildren();
  }
  hydrate(<App />, root);
}

export async function prerender(data) {
  const result = await renderStatic(<App />);
  return {
    ...result,
    links: new Set(),
    data: { url: data.url },
    head: {
      lang: 'ru',
      title: data.url === '/demo' ? demoTitle : homeTitle
    }
  };
}
