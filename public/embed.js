(function () {
  if (window.AlzyWidget) return;
  const script = document.currentScript;
  const origin = new URL(script.src).origin;
  const defaultBusiness = script.dataset.business || 'demo';
  let root;
  let panel;
  let launcher;
  function mount(options = {}) {
    if (root) return;
    root = document.createElement('div');
    root.id = 'alzy-widget-root';
    root.style.cssText =
      'position:fixed;right:22px;bottom:22px;z-index:2147483647;font-family:Arial,sans-serif';
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Открыть чат записи');
    launcher.textContent = '✦  Записаться';
    launcher.style.cssText =
      'border:0;border-radius:999px;padding:17px 23px;background:#252e29;color:#fff;box-shadow:0 12px 32px #18241d33;font-size:15px;font-weight:700;cursor:pointer';
    panel = document.createElement('div');
    panel.style.cssText =
      'display:none;position:absolute;right:0;bottom:70px;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100dvh - 105px));background:white;border-radius:20px;overflow:hidden;box-shadow:0 18px 60px #13221c44;border:1px solid #e7e6e0';
    const frame = document.createElement('iframe');
    const business = options.business || defaultBusiness;
    if (!/^[a-z0-9-]+$/.test(business)) throw new Error('Invalid business slug');
    frame.src = (options.origin || origin) + '/b/' + encodeURIComponent(business) + '/widget';
    frame.title = 'Онлайн-запись';
    frame.style.cssText = 'width:100%;height:100%;border:0';
    panel.appendChild(frame);
    launcher.addEventListener('click', () => {
      const open = panel.style.display !== 'none';
      panel.style.display = open ? 'none' : 'block';
      launcher.textContent = open ? '✦  Записаться' : 'Закрыть ×';
      launcher.setAttribute('aria-label', open ? 'Открыть чат записи' : 'Закрыть чат записи');
    });
    root.append(panel, launcher);
    document.body.appendChild(root);
  }
  function unmount() {
    root?.remove();
    root = null;
  }
  window.AlzyWidget = {
    mount,
    unmount,
    open: () => {
      if (panel?.style.display === 'none') launcher.click();
    }
  };
  if (script.dataset.auto === 'true') {
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', () => mount(), { once: true });
  }
})();
