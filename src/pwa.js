export const INSTALL_STATE_EVENT = 'leetcards:install-state';
export const UPDATE_READY_EVENT = 'leetcards:update-ready';

let deferredInstallPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
  });
}

export const canPromptToInstall = () => deferredInstallPrompt !== null;

export async function promptToInstall() {
  if (!deferredInstallPrompt) return false;

  const prompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  window.dispatchEvent(new Event(INSTALL_STATE_EVENT));
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome === 'accepted';
}

export function activatePwaUpdate(worker) {
  if (!worker || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => window.location.reload(),
    { once: true },
  );
  worker.postMessage({ type: 'SKIP_WAITING' });
}

export function registerPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        { scope: import.meta.env.BASE_URL },
      );

      const reportWaitingWorker = (worker) => {
        if (!worker) return;
        window.dispatchEvent(new CustomEvent(UPDATE_READY_EVENT, {
          detail: { worker },
        }));
      };

      reportWaitingWorker(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            reportWaitingWorker(registration.waiting ?? worker);
          }
        });
      });
    } catch (error) {
      console.error('Leetcards could not enable offline reading.', error);
    }
  }, { once: true });
}
