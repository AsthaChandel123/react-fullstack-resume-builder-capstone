// Service worker registration with a "new version available" toast.
//
// vite-plugin-pwa wires the registration script automatically (autoUpdate +
// injectRegister:'auto' in vite.config.ts), so the SW is installed without
// this file. What this file adds is the user-visible signal: when a new SW
// is waiting, drop a small toast so the user can reload to pick it up.

const TOAST_ID = 'pwa-update-toast';

function showUpdateToast(onReload: () => void): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(TOAST_ID)) return;

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#182B49',
    'color:#fff',
    'padding:12px 16px',
    'border-radius:12px',
    'box-shadow:0 6px 18px rgba(0,0,0,0.2)',
    'display:flex',
    'gap:12px',
    'align-items:center',
    'font:500 14px/1.3 system-ui,-apple-system,sans-serif',
    'z-index:2147483647',
    'max-width:calc(100vw - 32px)',
  ].join(';');

  const message = document.createElement('span');
  message.textContent = 'A new version is ready.';
  toast.appendChild(message);

  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Reload';
  reload.style.cssText = [
    'background:#fff',
    'color:#182B49',
    'border:0',
    'border-radius:8px',
    'padding:6px 12px',
    'font:600 13px system-ui,-apple-system,sans-serif',
    'cursor:pointer',
  ].join(';');
  reload.addEventListener('click', onReload);
  toast.appendChild(reload);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss update notification');
  dismiss.textContent = '×';
  dismiss.style.cssText = [
    'background:transparent',
    'color:#fff',
    'border:0',
    'font:700 18px system-ui,-apple-system,sans-serif',
    'cursor:pointer',
    'padding:0 4px',
    'line-height:1',
  ].join(';');
  dismiss.addEventListener('click', () => toast.remove());
  toast.appendChild(dismiss);

  document.body.appendChild(toast);
}

export function registerPwa(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Pick up the registration once it's ready. vite-plugin-pwa registers a
  // top-level /sw.js so this serviceWorker.ready promise resolves with it.
  navigator.serviceWorker.ready.then((registration) => {
    // If a new SW is already waiting (last visit installed it), surface now.
    if (registration.waiting) {
      showUpdateToast(() => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }

    // Otherwise watch for one arriving during this session.
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(() => {
            installing.postMessage({ type: 'SKIP_WAITING' });
          });
        }
      });
    });
  }).catch(() => {
    // SW not available (private mode, http://, etc.). Non-critical.
  });

  // When the new SW takes control, reload so the page runs against it.
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}
