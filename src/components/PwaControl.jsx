import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  activatePwaUpdate,
  canPromptToInstall,
  INSTALL_STATE_EVENT,
  promptToInstall,
  UPDATE_READY_EVENT,
} from '../pwa.js';

export default function PwaControl() {
  const [portalTarget, setPortalTarget] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [installReady, setInstallReady] = useState(canPromptToInstall);
  const [installing, setInstalling] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    setPortalTarget(document.querySelector('.topbar-actions'));
  }, []);

  useEffect(() => {
    const handleConnection = () => setOnline(navigator.onLine);
    const handleInstallState = () => setInstallReady(canPromptToInstall());
    const handleUpdate = (event) => setWaitingWorker(event.detail.worker);

    window.addEventListener('online', handleConnection);
    window.addEventListener('offline', handleConnection);
    window.addEventListener(INSTALL_STATE_EVENT, handleInstallState);
    window.addEventListener(UPDATE_READY_EVENT, handleUpdate);
    return () => {
      window.removeEventListener('online', handleConnection);
      window.removeEventListener('offline', handleConnection);
      window.removeEventListener(INSTALL_STATE_EVENT, handleInstallState);
      window.removeEventListener(UPDATE_READY_EVENT, handleUpdate);
    };
  }, []);

  if (!portalTarget) return null;

  let control = null;
  if (!online) {
    control = <span className="pwa-state" role="status">Offline</span>;
  } else if (waitingWorker) {
    control = (
      <button type="button" onClick={() => activatePwaUpdate(waitingWorker)}>
        Update app
      </button>
    );
  }

  const install = async () => {
    setInstalling(true);
    await promptToInstall();
    setInstallReady(canPromptToInstall());
    setInstalling(false);
  };

  if (!control && installReady) {
    control = (
      <button type="button" disabled={installing} onClick={install}>
        {installing ? 'Opening install' : 'Install app'}
      </button>
    );
  }

  return control ? createPortal(control, portalTarget) : null;
}
