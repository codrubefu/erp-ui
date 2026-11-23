// Moves open tabs to a newly deployed build without a hard refresh.
// Detection uses /version.json rather than the service worker, because the app
// is also served over plain HTTP on the LAN, where service workers don't exist.

const VERSION_URL = '/version.json';
const CHECK_INTERVAL_MS = 60_000;
const WORKER_TIMEOUT_MS = 20_000;
const RETRY_AFTER_MS = 60_000;
const ATTEMPT_KEY = 'app-update-attempt';

let updateReady = false;
let checking = false;
let userInteracted = false;

async function fetchDeployedVersion() {
  const response = await fetch(VERSION_URL, { cache: 'no-store' });
  if (!response.ok) return undefined;
  const payload = (await response.json()) as { version?: unknown };
  return typeof payload.version === 'string' ? payload.version : undefined;
}

// Stops a reload loop when the server still hands out the old build (e.g. deploy in progress).
function recentlyAttempted(version: string) {
  const [attemptedVersion, attemptedAt] = (window.sessionStorage.getItem(ATTEMPT_KEY) ?? '').split('|');
  return attemptedVersion === version && Date.now() - Number(attemptedAt) < RETRY_AFTER_MS;
}

// The active worker answers navigations from its precache, so the new one has to
// take control first; otherwise a reload would bring the old build back.
async function activateLatestWorker() {
  if (!('serviceWorker' in navigator)) return true;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) return true;

  await registration.update();
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return true;

  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => finish(false), WORKER_TIMEOUT_MS);
    const onStateChange = () => {
      if (worker.state === 'activated') finish(true);
      if (worker.state === 'redundant') finish(false);
    };
    const finish = (activated: boolean) => {
      window.clearTimeout(timeout);
      worker.removeEventListener('statechange', onStateChange);
      resolve(activated);
    };
    worker.addEventListener('statechange', onStateChange);
    onStateChange();
  });
}

async function clearRuntimeCache() {
  if ('caches' in window) await window.caches.delete('json-data');
}

async function checkForUpdate() {
  if (checking || updateReady || document.visibilityState === 'hidden') return;
  checking = true;
  try {
    const deployedVersion = await fetchDeployedVersion();
    if (!deployedVersion || deployedVersion === __APP_VERSION__ || recentlyAttempted(deployedVersion)) return;
    if (!(await activateLatestWorker())) return;
    await clearRuntimeCache();

    window.sessionStorage.setItem(ATTEMPT_KEY, `${deployedVersion}|${Date.now()}`);
    updateReady = true;
    if (!userInteracted) window.location.reload();
  } catch {
    // Offline or server unavailable: the next check retries.
  } finally {
    checking = false;
  }
}

/**
 * Loads the new build at `path` if one is waiting. Call it where the current
 * screen is being left anyway, so unsaved form data is never lost mid-edit.
 */
export function applyPendingUpdate(path: string) {
  if (!updateReady) return false;
  window.history.pushState(null, '', path);
  // reload() revalidates the document, unlike assign(), which may use the HTTP cache.
  window.location.reload();
  return true;
}

export function startAppUpdates() {
  if (!import.meta.env.PROD) return;

  const markInteraction = () => {
    userInteracted = true;
  };
  window.addEventListener('pointerdown', markInteraction, { capture: true, once: true });
  window.addEventListener('keydown', markInteraction, { capture: true, once: true });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => undefined);
    });
  }

  void checkForUpdate();
  window.setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => void checkForUpdate());
}
