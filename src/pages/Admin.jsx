import { useEffect, useState } from 'preact/hooks';
import { api, formatDate, formatMoment, todayMoscow } from '../utils/api.js';

const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const today = todayMoscow();

function toKopecks(value) {
  const parts = String(value).match(/^(\d+)(?:\.(\d{1,2}))?$/);
  return parts ? Number(parts[1]) * 100 + Number((parts[2] || '').padEnd(2, '0')) : 0;
}

function monthShift(month, amount) {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + amount, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthDays(month) {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)];
}

function ErrorNote({ text }) {
  return text ? <div class="admin-error" role="alert">{text}</div> : null;
}

const sections = [
  { id: 'calendar', label: 'Календарь', title: 'Календарь записей' },
  { id: 'finance', label: 'Финансы', title: 'Финансы' },
  { id: 'subscription', label: 'Тариф', title: 'Тариф и доступ' },
  { id: 'settings', label: 'Настройки', title: 'Настройки компании' }
];

function SectionIcon({ name }) {
  const shapes = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2" /></>,
    finance: <><path d="M3 20h18M5 16l5-5 4 3 5-7" /><path d="M15 7h4v4" /></>,
    subscription: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    settings: <><path d="M12 3.5 13.5 5l2-.3.8 2 2 .8-.3 2L19.5 11l-1.5 1.5.3 2-2 .8-.8 2-2-.3-1.5 1.5-1.5-1.5-2 .3-.8-2-2-.8.3-2L4.5 11 6 9.5l-.3-2 2-.8.8-2 2 .3L12 3.5Z" /><circle cx="12" cy="11" r="2.5" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}

export function Admin() {
  useEffect(() => { document.title = 'Alzy — AI-секретарь для малого бизнеса'; }, []);
  const [auth, setAuth] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState('calendar');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [day, setDay] = useState(today);
  const [counts, setCounts] = useState({});
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [services, setServices] = useState([]);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [requests, setRequests] = useState([]);
  const [finance, setFinance] = useState(null);
  const [entry, setEntry] = useState({ kind: 'expense', amount: '', description: '', date: today });
  const [paidAmounts, setPaidAmounts] = useState({});
  const [hours, setHours] = useState([]);
  const [newService, setNewService] = useState({ name: '', duration_min: 60, price_rub: '' });
  const [bookingForm, setBookingForm] = useState({ service_id: '', date: today, start: '', client_name: '', phone: '' });
  const [blockForm, setBlockForm] = useState({ start: '', end: '', note: '' });
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/admin/me').then(result => { setAuth(true); setSubscription(result.subscription); }).catch(() => setAuth(false));
  }, []);

  async function loadSubscription() {
    const result = await api('/admin/subscription');
    setSubscription(result.subscription);
    setRequests(result.requests);
  }

  async function loadFinance() {
    setFinance(await api(`/admin/finance?month=${month}`));
  }

  async function loadSettings() {
    const [serviceResult, businessResult, hoursResult] = await Promise.all([
      api('/admin/services'), api('/admin/business'), api('/admin/hours')
    ]);
    setServices(serviceResult.services);
    setBusiness(businessResult);
    setHours(hoursResult.hours.map(item => ({ ...item, opens: item.opens?.slice(0, 5) || '', closes: item.closes?.slice(0, 5) || '' })));
    setBookingForm(previous => ({ ...previous, service_id: previous.service_id || String(serviceResult.services.find(item => item.active)?.id || '') }));
  }

  async function loadCalendar(nextMonth = month, nextDay = day) {
    const [summary, list, closed] = await Promise.all([
      api(`/admin/calendar?month=${nextMonth}`),
      api(`/admin/bookings?date=${nextDay}`),
      api(`/admin/blocks?month=${nextMonth}`)
    ]);
    setCounts(summary.counts);
    setBookings(list.bookings);
    setBlocks(closed.blocks);
  }

  useEffect(() => {
    if (auth !== true) return;
    loadSettings().catch(cause => setError(cause.message));
  }, [auth]);

  useEffect(() => {
    if (auth !== true) return;
    loadCalendar(month, day).catch(cause => setError(cause.message));
    const timer = setInterval(() => loadCalendar(month, day).catch(() => {}), 15000);
    return () => clearInterval(timer);
  }, [auth, month, day]);

  useEffect(() => {
    if (auth !== true) return;
    loadSubscription().catch(cause => setError(cause.message));
  }, [auth]);

  useEffect(() => {
    if (auth !== true || tab !== 'finance') return;
    loadFinance().catch(cause => setError(cause.message));
  }, [auth, tab, month]);

  useEffect(() => {
    if (auth !== true || !business?.slug || !bookingForm.service_id || !bookingForm.date) return;
    setSlots([]);
    api(`/public/${business.slug}/availability?serviceId=${bookingForm.service_id}&date=${bookingForm.date}`)
      .then(result => setSlots(result.slots))
      .catch(() => setSlots([]));
  }, [auth, business?.slug, bookingForm.service_id, bookingForm.date, counts, blocks]);

  async function run(task, success) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await task();
      if (success) setNotice(success);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    await run(async () => {
      await api('/auth/login', { method: 'POST', body: { email, password } });
      setPassword('');
      setAuth(true);
    });
  }

  async function logout() {
    await run(async () => {
      await api('/auth/logout', { method: 'POST' });
      setEmail('');
      setAuth(false);
    });
  }

  async function addBooking(event) {
    event.preventDefault();
    await run(async () => {
      await api('/admin/bookings', { method: 'POST', body: { service_id: Number(bookingForm.service_id), start: bookingForm.start, client_name: bookingForm.client_name, phone: bookingForm.phone } });
      setDay(bookingForm.start.slice(0, 10));
      setMonth(bookingForm.start.slice(0, 7));
      setBookingForm(previous => ({ ...previous, start: '', client_name: '', phone: '' }));
      await loadCalendar(bookingForm.start.slice(0, 7), bookingForm.start.slice(0, 10));
    }, 'Запись добавлена');
  }

  async function requestActivation(plan) {
    await run(async () => {
      await api('/admin/activation-requests', { method: 'POST', body: { plan } });
      await loadSubscription();
    }, 'Запрос отправлен администратору платформы');
  }

  async function addTransaction(event) {
    event.preventDefault();
    await run(async () => {
      await api('/admin/finance', { method: 'POST', body: { kind: entry.kind, amount_kopecks: toKopecks(entry.amount), description: entry.description, date: entry.date } });
      setEntry({ kind: 'expense', amount: '', description: '', date: today });
      await loadFinance();
    }, 'Операция добавлена');
  }

  async function markPaid(item) {
    await run(async () => {
      await api(`/admin/bookings/${item.id}/paid`, { method: 'POST', body: { amount_kopecks: toKopecks(paidAmounts[item.id] || '') } });
      await loadCalendar();
      if (tab === 'finance') await loadFinance();
    }, 'Оплата учтена');
  }

  async function cancelBooking(id) {
    await run(async () => {
      await api(`/admin/bookings/${id}/cancel`, { method: 'PATCH' });
      await loadCalendar();
    }, 'Запись отменена');
  }

  async function addBlock(event) {
    event.preventDefault();
    await run(async () => {
      await api('/admin/blocks', { method: 'POST', body: blockForm });
      setBlockForm({ start: '', end: '', note: '' });
      await loadCalendar();
    }, 'Интервал закрыт');
  }

  async function removeBlock(id) {
    await run(async () => {
      await api(`/admin/blocks/${id}`, { method: 'DELETE' });
      await loadCalendar();
    }, 'Интервал открыт');
  }

  async function saveBusiness(event) {
    event.preventDefault();
    await run(async () => {
      const result = await api('/admin/business', { method: 'PUT', body: business });
      setBusiness(result);
    }, 'Информация сохранена');
  }

  async function saveHours(event) {
    event.preventDefault();
    await run(async () => {
      const result = await api('/admin/hours', { method: 'PUT', body: { hours } });
      setHours(result.hours.map(item => ({ ...item, opens: item.opens?.slice(0, 5) || '', closes: item.closes?.slice(0, 5) || '' })));
      await loadCalendar();
    }, 'Расписание сохранено');
  }

  async function saveService(item) {
    await run(async () => {
      await api(`/admin/services/${item.id}`, { method: 'PATCH', body: item });
      await loadSettings();
    }, 'Услуга обновлена');
  }

  async function addService(event) {
    event.preventDefault();
    await run(async () => {
      await api('/admin/services', { method: 'POST', body: newService });
      setNewService({ name: '', duration_min: 60, price_rub: '' });
      await loadSettings();
    }, 'Услуга добавлена');
  }

  function editService(id, patch) {
    setServices(previous => previous.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function navigateMonth(amount) {
    const next = monthShift(month, amount);
    setMonth(next);
    setDay(next === today.slice(0, 7) ? today : next + '-01');
  }

  function editHours(index, patch) {
    setHours(previous => previous.map((item, position) => position === index ? { ...item, ...patch } : item));
  }

  function selectTab(nextTab) {
    if (nextTab === tab) return;
    setTab(nextTab);
    window.scrollTo(0, 0);
  }

  if (auth === null) return <div class="admin-loading">Загружаем кабинет…</div>;
  if (auth === false) return (
    <div class="login-page">
      <a href="/" class="product-logo"><span>✳</span> alzy</a>
      <form class="login-card" onSubmit={login}>
        <div class="eyebrow"><span /> КАБИНЕТ КОМПАНИИ</div>
        <h1>С возвращением.</h1>
        <p>Войдите, чтобы открыть календарь записей.</p>
        <label>Email<input type="email" value={email} onInput={event => setEmail(event.currentTarget.value)} placeholder="you@company.ru" required /></label>
        <label>Пароль<input type="password" value={password} onInput={event => setPassword(event.currentTarget.value)} placeholder="Пароль" required /></label>
        <ErrorNote text={error} />
        <button class="primary-button" disabled={saving} type="submit">Войти <span>→</span></button>
        <p>Ещё нет аккаунта? <a href="/register" class="inline-link">Попробовать бесплатно</a></p>
      </form>
    </div>
  );

  return (
    <div class="admin-page">
      <header class="admin-header">
        <div class="admin-header-inner">
          <a href="/" class="product-logo" aria-label="Alzy — главная"><span>✳</span> alzy</a>
          <div class="admin-header-actions">
            <a href="/demo" class="admin-header-action">Демо <span aria-hidden="true">↗</span></a>
            <button type="button" class="admin-header-action" onClick={logout} disabled={saving}>Выйти</button>
          </div>
        </div>
      </header>

      <main class="admin-main">
        <div class="admin-content">
          <div class="admin-heading"><div><div class="eyebrow"><span /> {business?.name?.toUpperCase() || 'КАБИНЕТ КОМПАНИИ'}</div><h1>{sections.find(section => section.id === tab)?.title}</h1></div><span class="admin-date">{formatDate(today, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <ErrorNote text={error} />
          {notice && <div class="admin-notice">{notice}</div>}
          {subscription && <div class="subscription-strip"><span>{subscription.mode === 'trial' ? 'Пробный период' : subscription.mode === 'paid' ? 'Тариф активен' : 'Доступ закончился'} · {subscription.plan === 'finance' ? 'Запись + финансы' : 'AI-запись'}</span><span>AI: {subscription.used} / {subscription.limit}</span><button onClick={() => selectTab('subscription')}>Управлять →</button></div>}

          {tab === 'calendar' ? (
            <>
              <div class="calendar-layout">
                <section class="panel calendar-panel">
                  <div class="panel-header"><div><span class="panel-kicker">РАСПИСАНИЕ</span><h2>{formatDate(month + '-01', { month: 'long', year: 'numeric' })}</h2></div><div class="month-nav"><button aria-label="Предыдущий месяц" onClick={() => navigateMonth(-1)}>←</button><button aria-label="Следующий месяц" onClick={() => navigateMonth(1)}>→</button></div></div>
                  <div class="calendar-grid weekday-row">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(item => <span>{item}</span>)}</div>
                  <div class="calendar-grid date-grid">
                    {monthDays(month).map((date, index) => date ? <button key={date} class={`calendar-day ${date === day ? 'selected' : ''} ${date === today ? 'is-today' : ''}`} onClick={() => setDay(date)}><span>{Number(date.slice(-2))}</span>{counts[date] ? <small>{counts[date]} {counts[date] === 1 ? 'запись' : 'записей'}</small> : <small>—</small>}</button> : <div key={index} class="empty-day" />)}
                  </div>
                </section>
                <section class="panel day-panel">
                  <div class="panel-header"><div><span class="panel-kicker">ЗАПИСИ НА ДЕНЬ</span><h2>{formatDate(day, { day: 'numeric', month: 'long' })}</h2></div><span class="day-count">{bookings.filter(item => item.status === 'confirmed').length}</span></div>
                  <div class="day-list">
                    {bookings.filter(item => item.status === 'confirmed').length ? bookings.filter(item => item.status === 'confirmed').map(item => <div class="booking-card" key={item.id}><div class="booking-time">{item.start.slice(11, 16)}<span>{item.end.slice(11, 16)}</span></div><div class="booking-details"><strong>{item.client_name}</strong><span>{item.service_name}</span>{item.contact_unlocked ? <a href={`tel:${item.phone}`}>{item.phone}</a> : <span title="Продлите доступ, чтобы открыть телефон">{item.phone} · скрыт до продления</span>}{item.paid_amount_kopecks != null ? <small>Оплачено: {(item.paid_amount_kopecks / 100).toLocaleString('ru-RU')} ₽</small> : subscription?.active && subscription.plan === 'finance' ? <div class="booking-payment"><input aria-label="Фактическая сумма оплаты" type="number" min="0.01" step="0.01" placeholder="Сумма, ₽" value={paidAmounts[item.id] ?? ''} onInput={event => setPaidAmounts({ ...paidAmounts, [item.id]: event.currentTarget.value })} /><button onClick={() => markPaid(item)} disabled={saving || !paidAmounts[item.id]}>Оплачено</button></div> : null}</div><button class="quiet-button" title="Отменить запись" onClick={() => cancelBooking(item.id)}>×</button></div>) : <div class="empty-state"><span>✳</span><strong>Пока свободно</strong><p>На этот день ещё нет записей.</p></div>}
                  </div>
                </section>
              </div>

              <div class="admin-lower">
                <section class="panel form-panel">
                  <div class="panel-header"><div><span class="panel-kicker">ВРУЧНУЮ</span><h2>Добавить запись</h2></div><span class="form-icon">＋</span></div>
                  <form onSubmit={addBooking} class="admin-form">
                    <label>Услуга<select value={bookingForm.service_id} onChange={event => setBookingForm({ ...bookingForm, service_id: event.currentTarget.value, start: '' })} required><option value="">Выберите услугу</option>{services.filter(item => item.active).map(item => <option value={item.id}>{item.name} · {item.duration_min} мин</option>)}</select></label>
                    <div class="form-row"><label>Дата<input type="date" min={today} value={bookingForm.date} onInput={event => setBookingForm({ ...bookingForm, date: event.currentTarget.value, start: '' })} required /></label><label>Свободное время<select value={bookingForm.start} onChange={event => setBookingForm({ ...bookingForm, start: event.currentTarget.value })} required><option value="">Выберите</option>{slots.map(slot => <option value={slot}>{slot.slice(11)}</option>)}</select></label></div>
                    <div class="form-row"><label>Имя<input value={bookingForm.client_name} onInput={event => setBookingForm({ ...bookingForm, client_name: event.currentTarget.value })} placeholder="Имя клиента" required /></label><label>Телефон<input type="tel" value={bookingForm.phone} onInput={event => setBookingForm({ ...bookingForm, phone: event.currentTarget.value })} placeholder="+7 999 123-45-67" required /></label></div>
                    <button class="dark-button" disabled={saving || !bookingForm.start}>Добавить запись <span>→</span></button>
                  </form>
                </section>
                <section class="panel form-panel">
                  <div class="panel-header"><div><span class="panel-kicker">НЕДОСТУПНОЕ ВРЕМЯ</span><h2>Закрыть интервал</h2></div><span class="form-icon">−</span></div>
                  <form onSubmit={addBlock} class="admin-form">
                    <div class="form-row"><label>Начало · МСК<input type="datetime-local" value={blockForm.start} onInput={event => setBlockForm({ ...blockForm, start: event.currentTarget.value })} required /></label><label>Конец · МСК<input type="datetime-local" value={blockForm.end} onInput={event => setBlockForm({ ...blockForm, end: event.currentTarget.value })} required /></label></div>
                    <label>Причина<input value={blockForm.note} onInput={event => setBlockForm({ ...blockForm, note: event.currentTarget.value })} placeholder="Например, перерыв" /></label>
                    <button class="outline-button" disabled={saving}>Закрыть время <span>→</span></button>
                  </form>
                  {!!blocks.length && <div class="block-list"><h3>Закрытые интервалы месяца</h3>{blocks.map(item => <div class="block-row" key={item.id}><span>{formatMoment(item.start)} — {item.end.slice(11, 16)}<small>{item.note}</small></span><button onClick={() => removeBlock(item.id)} title="Открыть интервал">×</button></div>)}</div>}
                </section>
              </div>
            </>
          ) : tab === 'finance' ? (
            <div class="finance-page">
              <div class="finance-toolbar"><div class="month-nav"><button onClick={() => navigateMonth(-1)}>←</button><strong>{formatDate(month + '-01', { month: 'long', year: 'numeric' })}</strong><button onClick={() => navigateMonth(1)}>→</button></div><span>Внутренний учёт доходов и расходов</span></div>
              <div class="finance-summary"><article><span>Доходы</span><strong>{((finance?.summary.income_kopecks || 0) / 100).toLocaleString('ru-RU')} ₽</strong></article><article><span>Расходы</span><strong>{((finance?.summary.expenses_kopecks || 0) / 100).toLocaleString('ru-RU')} ₽</strong></article><article><span>Результат</span><strong>{((finance?.summary.net_kopecks || 0) / 100).toLocaleString('ru-RU')} ₽</strong></article></div>
              <div class="finance-layout"><section class="panel finance-list"><div class="panel-header"><div><span class="panel-kicker">ОПЕРАЦИИ</span><h2>За месяц</h2></div></div>{finance?.transactions.length ? finance.transactions.map(item => <div class="finance-row" key={item.id}><div><strong>{item.description}</strong><small>{formatMoment(item.occurred_at)}{item.booking_id ? ` · запись №${item.booking_id}` : ''}</small></div><b class={item.kind === 'income' ? 'positive' : 'negative'}>{item.kind === 'income' ? '+' : '−'} {(item.amount_kopecks / 100).toLocaleString('ru-RU')} ₽</b></div>) : <div class="finance-empty">В этом месяце операций пока нет.</div>}</section><section class="panel form-panel"><div class="panel-header"><div><span class="panel-kicker">ВРУЧНУЮ</span><h2>Новая операция</h2></div></div>{finance?.writable ? <form class="admin-form" onSubmit={addTransaction}><label>Тип<select value={entry.kind} onChange={event => setEntry({ ...entry, kind: event.currentTarget.value })}><option value="income">Доход</option><option value="expense">Расход</option></select></label><label>Дата операции<input type="date" value={entry.date} onInput={event => setEntry({ ...entry, date: event.currentTarget.value })} required /></label><label>Сумма, ₽<input type="number" min="0.01" step="0.01" value={entry.amount} onInput={event => setEntry({ ...entry, amount: event.currentTarget.value })} required /></label><label>Описание<input value={entry.description} onInput={event => setEntry({ ...entry, description: event.currentTarget.value })} required /></label><button class="dark-button" disabled={saving}>Добавить <span>→</span></button></form> : <p class="finance-readonly">История доступна для просмотра. Добавление операций открывается на активном тарифе «Запись + финансы».</p>}</section></div>
            </div>
          ) : tab === 'subscription' ? (
            <div class="subscription-page"><section class="panel subscription-main"><span class="panel-kicker">ВАШ ТАРИФ</span><h2>{subscription?.plan === 'finance' ? 'Запись + финансы' : 'AI-запись'}</h2><p>{subscription?.mode === 'trial' ? 'Пробный период активен' : subscription?.mode === 'paid' ? 'Подписка активна' : 'Подписка закончилась'}. {subscription?.until ? `Доступ до ${new Date(subscription.until).toLocaleDateString('ru-RU')}.` : ''}</p><div class="usage-meter"><span style={{ width: `${Math.min(100, 100 * (subscription?.used || 0) / (subscription?.limit || 1))}%` }} /></div><small>Ответов AI: {subscription?.used || 0} из {subscription?.limit || 0}. {subscription?.mode === 'expired' ? 'После лимита клиенты записываются через форму.' : ''}</small><div class="activation-buttons"><button disabled={saving || requests.some(item => item.status === 'pending')} onClick={() => requestActivation('booking')}>Запросить AI-запись · 499 ₽/мес</button><button disabled={saving || requests.some(item => item.status === 'pending')} onClick={() => requestActivation('finance')}>Запросить запись + финансы · 999 ₽/мес</button></div><p class="subscription-help">Оплата проходит вне CRM. После получения оплаты администратор платформы активирует выбранный тариф на месяц.</p></section><section class="panel subscription-links"><span class="panel-kicker">ДЛЯ ВАШИХ КЛИЕНТОВ</span><h2>Страница и виджет</h2><label>Ссылка на запись<input readOnly value={business ? `${location.origin}/b/${business.slug}/book` : ''} onFocus={event => event.currentTarget.select()} /></label><label>Код виджета<code>{business ? `<script src="${location.origin}/embed.js" data-business="${business.slug}" data-auto="true" defer></script>` : ''}</code></label><p>Вставьте код перед закрывающим тегом страницы вашего сайта.</p></section><section class="panel subscription-history"><span class="panel-kicker">ЗАПРОСЫ</span><h2>История продлений</h2>{requests.length ? requests.map(item => <div><span>{item.plan === 'finance' ? 'Запись + финансы' : 'AI-запись'}</span><strong>{item.status === 'pending' ? 'Ожидает' : item.status === 'approved' ? 'Активирован' : 'Отклонён'}</strong></div>) : <p>Запросов пока нет.</p>}</section></div>
          ) : (
            <div class="settings-layout">
              <section class="panel settings-panel"><div class="panel-header"><div><span class="panel-kicker">ИНФОРМАЦИЯ ДЛЯ СЕКРЕТАРЯ</span><h2>О студии</h2></div></div>{business && <form class="admin-form" onSubmit={saveBusiness}><label>Название<input value={business.name} onInput={event => setBusiness({ ...business, name: event.currentTarget.value })} required /></label><label>Описание<textarea rows="3" value={business.description} onInput={event => setBusiness({ ...business, description: event.currentTarget.value })} /></label><div class="form-row"><label>Адрес<input value={business.address} onInput={event => setBusiness({ ...business, address: event.currentTarget.value })} /></label><label>Телефон<input value={business.phone} onInput={event => setBusiness({ ...business, phone: event.currentTarget.value })} /></label></div><label>Правила и ответы на вопросы<textarea rows="4" value={business.faq} onInput={event => setBusiness({ ...business, faq: event.currentTarget.value })} /></label><button class="dark-button" disabled={saving}>Сохранить информацию <span>→</span></button></form>}</section>
              <section class="panel settings-panel"><div class="panel-header"><div><span class="panel-kicker">РАСПИСАНИЕ</span><h2>Рабочие часы</h2></div></div><form class="admin-form" onSubmit={saveHours}><div class="hours-list">{hours.map((item, index) => <div class="hours-row" key={item.weekday}><span>{weekdays[index]}</span><label class="closed-check"><input type="checkbox" checked={!item.opens} onChange={event => editHours(index, event.currentTarget.checked ? { opens: '', closes: '' } : { opens: '10:00', closes: '19:00' })} /> Выходной</label><input type="time" step="1800" value={item.opens} disabled={!item.opens} onInput={event => editHours(index, { opens: event.currentTarget.value })} /><span>—</span><input type="time" step="1800" value={item.closes} disabled={!item.opens} onInput={event => editHours(index, { closes: event.currentTarget.value })} /></div>)}</div><button class="dark-button" disabled={saving}>Сохранить часы <span>→</span></button></form></section>
              <section class="panel settings-panel services-panel"><div class="panel-header"><div><span class="panel-kicker">КАТАЛОГ</span><h2>Услуги</h2></div></div><div class="services-admin-list">{services.map(item => <div class="service-admin-row" key={item.id}><input aria-label="Название услуги" value={item.name} onInput={event => editService(item.id, { name: event.currentTarget.value })} /><input aria-label="Длительность в минутах" type="number" min="30" max="480" step="30" value={item.duration_min} onInput={event => editService(item.id, { duration_min: Number(event.currentTarget.value) })} /><input aria-label="Цена в рублях" type="number" min="0" value={item.price_rub ?? ''} onInput={event => editService(item.id, { price_rub: event.currentTarget.value })} /><label><input type="checkbox" checked={!!item.active} onChange={event => editService(item.id, { active: event.currentTarget.checked })} /> Активна</label><button class="outline-button" onClick={() => saveService(item)} disabled={saving}>Сохранить</button></div>)}</div><form class="admin-form add-service-form" onSubmit={addService}><h3>Новая услуга</h3><div class="form-row"><label>Название<input value={newService.name} onInput={event => setNewService({ ...newService, name: event.currentTarget.value })} required /></label><label>Минут<input type="number" min="30" max="480" step="30" value={newService.duration_min} onInput={event => setNewService({ ...newService, duration_min: Number(event.currentTarget.value) })} required /></label><label>Цена, ₽<input type="number" min="0" value={newService.price_rub} onInput={event => setNewService({ ...newService, price_rub: event.currentTarget.value })} /></label></div><button class="dark-button" disabled={saving}>Добавить услугу <span>→</span></button></form></section>
            </div>
          )}
        </div>
      </main>
      <nav class="admin-bottom-nav" aria-label="Разделы кабинета">
        {sections.map(section => <button key={section.id} type="button" class={tab === section.id ? 'admin-nav-item active' : 'admin-nav-item'} aria-pressed={tab === section.id} onClick={() => selectTab(section.id)}><SectionIcon name={section.id} /><span>{section.label}</span></button>)}
      </nav>
    </div>
  );
}
