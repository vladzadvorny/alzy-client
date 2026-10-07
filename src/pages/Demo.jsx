import { useEffect } from 'preact/hooks';

export const title = 'Студия Линия — запись онлайн';

const services = [
  { number: '01', title: 'Стрижка', detail: 'Форма, в которой узнаёте себя', price: 'от 2 500 ₽' },
  { number: '02', title: 'Укладка', detail: 'Для обычного дня и особого случая', price: 'от 2 000 ₽' },
  { number: '03', title: 'Окрашивание', detail: 'Цвет, который хочется сохранить', price: 'от 6 500 ₽' }
];

export function Demo() {
  useEffect(() => { document.title = title; }, []);
  useEffect(() => {
    if (window.AlzyWidget) {
      window.AlzyWidget.mount();
      return () => window.AlzyWidget.unmount();
    }
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.dataset.auto = 'true';
    script.dataset.business = 'demo';
    document.body.appendChild(script);
    return () => {
      window.AlzyWidget?.unmount();
      script.remove();
    };
  }, []);

  return (
    <div class="demo">
      <header class="site-header">
        <a href="/demo" class="wordmark"><span class="wordmark-mark">✳</span> линия<span class="wordmark-period">.</span></a>
        <nav><a href="#services">Услуги</a><a href="#about">О студии</a><a href="/">О CRM</a></nav>
        <button class="header-book" onClick={() => window.AlzyWidget?.open()}>Записаться <span>↗</span></button>
      </header>

      <main>
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow"><span /> ВАШЕ ВРЕМЯ ДЛЯ СЕБЯ</div>
            <h1>Красота<br />в вашем <em>ритме.</em></h1>
            <p>Студия ухода за волосами, где приятно быть собой. Выберите услугу, а наш AI-секретарь найдёт удобное время за пару сообщений.</p>
            <div class="hero-actions">
              <button class="primary-button" onClick={() => window.AlzyWidget?.open()}>Подобрать время <span>↗</span></button>
              <a href="/book" class="text-link">Открыть чат на весь экран <span>→</span></a>
            </div>
            <div class="hero-note"><span class="tiny-star">✦</span> Онлайн-запись в любое время суток</div>
          </div>
          <div class="hero-art" aria-label="Декоративная композиция">
            <div class="art-orbit orbit-one" />
            <div class="art-orbit orbit-two" />
            <div class="art-sun">✳</div>
            <div class="art-vase"><div class="art-stem stem-one" /><div class="art-stem stem-two" /><div class="art-stem stem-three" /><div class="art-flower flower-one">✦</div><div class="art-flower flower-two">✺</div><div class="art-flower flower-three">✳</div></div>
            <div class="art-caption">линия — место,<br />где всё начинается с вас</div>
          </div>
          <div class="hero-side-label">МОСКВА · ПЕТРОВКА, 12</div>
        </section>

        <section class="service-section" id="services">
          <div class="section-topline"><span>01 / УСЛУГИ</span><span>Всё для вашего образа</span></div>
          <div class="service-heading"><h2>Найдите своё.</h2><p>Понятные услуги, прозрачные цены и время, которое принадлежит только вам.</p></div>
          <div class="service-grid">
            {services.map(item => <div class="service-card" key={item.number}><span class="service-number">{item.number}</span><div class="service-symbol">{item.number === '01' ? '✳' : item.number === '02' ? '◌' : '✦'}</div><h3>{item.title}</h3><p>{item.detail}</p><div class="service-bottom"><strong>{item.price}</strong><button aria-label={`Записаться на ${item.title}`} onClick={() => window.AlzyWidget?.open()}>↗</button></div></div>)}
          </div>
        </section>

        <section class="about-section" id="about">
          <div><span class="about-kicker">02 / О СТУДИИ</span><h2>Маленькая пауза<br />с большим смыслом.</h2></div>
          <p>Мы верим, что забота о себе начинается с простого: выбрать удобное время и довериться мастеру. Напишите секретарю — он подскажет услуги и сразу запишет вас.</p>
        </section>
      </main>
      <footer class="site-footer"><span>✳ линия.</span><span>Москва, ул. Петровка, 12</span><span>Демонстрация AI-секретаря</span></footer>
    </div>
  );
}
