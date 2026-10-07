import { useEffect } from 'preact/hooks';

export function NotFound() {
  useEffect(() => {
    document.title = 'Alzy — AI-секретарь для малого бизнеса';
  }, []);
  return (
    <div class="login-page">
      <div class="login-card">
        <h1>Страница не найдена</h1>
        <a href="/" class="inline-link">
          На главную
        </a>
      </div>
    </div>
  );
}
