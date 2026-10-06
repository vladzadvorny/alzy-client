# Alzy · клиент

Preact и Vite: демонстрационная страница /demo, отдельный чат /book, чат для iframe /widget и кабинет /admin.

Для разработки: npm install, затем npm run dev (Koa API должен работать на порту 3000). Для сборки: npm run build; Koa отдаёт результат из client/dist.

Чтобы показать чат на другом сайте, вставьте в его HTML:

    <script src="https://YOUR-DOMAIN/embed.js" data-auto="true" defer></script>

Скрипт создаёт кнопку и iframe со страницей /widget. Административный пароль и ключ DeepSeek никогда не загружаются в браузер.
