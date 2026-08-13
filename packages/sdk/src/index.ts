export interface SDKConfig {
  gameId: string;
  developerKey?: string;
  debug?: boolean;
  adDuration?: number; // duration in seconds, default 5
  apiBaseUrl?: string; // backend API base URL, default http://localhost:3000
}

interface ServerAdConfig {
  gameId: string;
  adDuration: number;
  placementId: string;
}

interface BoundPlayButton {
  element: HTMLElement;
  handler: (e: Event) => void;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const CONFIG_FETCH_TIMEOUT_MS = 4000;

export class GendisSDKClass {
  private isInitialized = false;
  private config: SDKConfig | null = null;
  private serverAdConfig: ServerAdConfig | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private boundPlayButtons: BoundPlayButton[] = [];

  public async init(config: SDKConfig): Promise<void> {
    if (this.isInitialized) {
      console.warn('[GendisSDK] SDK already initialized.');
      return;
    }
    this.config = {
      adDuration: 5, // default 5 seconds
      apiBaseUrl: DEFAULT_API_BASE_URL,
      ...config
    };

    this.injectStyles();

    try {
      await this.fetchServerConfig();
    } catch (error) {
      console.warn(
        `[GendisSDK] Failed to fetch ad config from backend. Falling back to defaults.`,
        error
      );
    }

    this.isInitialized = true;

    if (this.config.debug) {
      console.log('[GendisSDK] Initialized with config:', this.config);
    }
  }

  /**
   * Tears down the SDK: removes injected styles, un-binds play buttons,
   * and clears any active ad overlay / timers to prevent memory leaks in
   * the host game engine. Safe to call multiple times.
   */
  public destroy(): void {
    const wasDebug = this.config?.debug === true;
    this.removeStyles();
    this.unbindPlayButtons();
    this.clearActiveAd();
    this.isInitialized = false;
    this.config = null;
    this.serverAdConfig = null;
    if (wasDebug) {
      console.log('[GendisSDK] SDK destroyed.');
    }
  }

  private async fetchServerConfig(): Promise<void> {
    if (typeof fetch === 'undefined') return;

    const { gameId, apiBaseUrl, developerKey } = this.config as SDKConfig;
    const url = `${apiBaseUrl}/api/config?gameId=${encodeURIComponent(gameId)}`;

    const headers: Record<string, string> = {};
    if (developerKey) {
      headers['Authorization'] = `Bearer ${developerKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Config request failed with status ${res.status}`);
      }

      const data: ServerAdConfig = await res.json();
      this.serverAdConfig = data;

      if (this.config?.debug) {
        console.log('[GendisSDK] Server ad config:', data);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Non-blocking telemetry send. Prefers `navigator.sendBeacon` (fire & forget,
   * survives page unload), falls back to `fetch` with keepalive when beacon is
   * unavailable or rejected (e.g. blocked by an AdBlocker). Never throws and
   * never blocks the caller.
   */
  private sendTelemetry(type: string): void {
    if (!this.config) return;

    const { gameId, apiBaseUrl, developerKey } = this.config;
    const placementId = this.serverAdConfig?.placementId ?? 'pre-roll';

    const payload = JSON.stringify({
      gameId,
      type,
      placementId,
      timestamp: Date.now(),
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (developerKey) {
      headers['Authorization'] = `Bearer ${developerKey}`;
    }

    const url = `${apiBaseUrl}/api/telemetry`;

    // 1. Prefer sendBeacon — non-blocking and delivered on page unload.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) {
          if (this.config.debug) {
            console.log(`[GendisSDK] Telemetry event sent (beacon): ${type}`);
          }
          return;
        }
        // Beacon rejected (e.g. quota / blocked) → fall through to fetch.
      } catch (error) {
        if (this.config.debug) {
          console.warn(`[GendisSDK] sendBeacon failed for ${type}, falling back to fetch:`, error);
        }
      }
    }

    // 2. Fallback: fire & forget fetch with keepalive, abort on AdBlock/network hang.
    if (typeof fetch === 'undefined') return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    void fetch(url, {
      method: 'POST',
      headers,
      body: payload,
      keepalive: true,
      signal: controller.signal,
    })
      .catch((error: unknown) => {
        // AdBlocker / network failure — telemetry must never break the game.
        if (this.config?.debug) {
          console.warn(`[GendisSDK] Telemetry ${type} not delivered:`, error);
        }
      })
      .finally(() => clearTimeout(timeoutId));
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (this.styleElement) return;

    const css = `
      .gendis-ad-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;user-select:none;padding:16px}
      .gendis-ad-modal{background:#18181B;border:1px solid #27272A;border-radius:8px;width:100%;max-width:520px;padding:24px;display:flex;flex-direction:column;gap:16px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
      .gendis-ad-header{display:flex;justify-content:space-between;align-items:center}
      .gendis-ad-title{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#A1A1AA}
      .gendis-ad-badge{background:rgba(16,185,129,.12);color:#10B981;border:1px solid rgba(16,185,129,.35);border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .gendis-ad-content{position:relative;height:220px;background:#09090B;border:1px solid #27272A;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .gendis-ad-placeholder{text-align:center;padding:16px}
      .gendis-ad-logo{font-size:36px;margin-bottom:10px}
      .gendis-ad-text{font-size:18px;font-weight:700;color:#FAFAFA;margin-bottom:4px}
      .gendis-ad-subtext{font-size:13px;color:#A1A1AA}
      .gendis-ad-footer{display:flex;justify-content:space-between;align-items:center;gap:12px}
      .gendis-ad-timer{font-size:13px;color:#A1A1AA;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
      .gendis-ad-button{background:#FAFAFA;border:1px solid #27272A;border-radius:6px;color:#09090B;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s ease,opacity .15s ease}
      .gendis-ad-button:hover:not(:disabled){background:#E4E4E7}
      .gendis-ad-button:disabled{background:#18181B;color:#52525B;cursor:not-allowed}
    `;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);
  }

  private removeStyles(): void {
    if (!this.styleElement) return;
    if (document.head.contains(this.styleElement)) {
      document.head.removeChild(this.styleElement);
    }
    this.styleElement = null;
  }

  private unbindPlayButtons(): void {
    for (const bound of this.boundPlayButtons) {
      bound.element.removeEventListener('click', bound.handler);
    }
    this.boundPlayButtons = [];
  }

  private clearActiveAd(): void {
    if (typeof document === 'undefined') return;
    const overlay = document.querySelector('.gendis-ad-overlay');
    if (overlay && document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }

  public showPreRoll(onComplete?: () => void): void {
    if (!this.isInitialized) {
      console.error('[GendisSDK] SDK is not initialized. Please call init() first.');
      if (onComplete) onComplete();
      return;
    }

    if (this.config?.debug) {
      console.log('[GendisSDK] Showing Pre-Roll Ad...');
    }

    if (typeof document === 'undefined') {
      if (onComplete) onComplete();
      return;
    }

    // Check if an ad is already showing to prevent duplicates
    if (document.querySelector('.gendis-ad-overlay')) {
      if (this.config?.debug) {
        console.warn('[GendisSDK] Ad overlay is already active.');
      }
      return;
    }

    const duration = this.serverAdConfig?.adDuration ?? this.config?.adDuration ?? 5;
    let timeLeft = duration;

    // Record impression event (non-blocking)
    this.sendTelemetry('IMPRESSION');

    // Create Overlay elements
    const overlay = document.createElement('div');
    overlay.className = 'gendis-ad-overlay';

    const modal = document.createElement('div');
    modal.className = 'gendis-ad-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'gendis-ad-header';
    const title = document.createElement('div');
    title.className = 'gendis-ad-title';
    title.textContent = 'Advertisement';
    const badge = document.createElement('span');
    badge.className = 'gendis-ad-badge';
    badge.textContent = 'AD';
    header.appendChild(title);
    header.appendChild(badge);

    // Content area (with a beautiful placeholder)
    const content = document.createElement('div');
    content.className = 'gendis-ad-content';

    const placeholder = document.createElement('div');
    placeholder.className = 'gendis-ad-placeholder';

    const logo = document.createElement('div');
    logo.className = 'gendis-ad-logo';
    logo.textContent = '🎮';

    const text = document.createElement('div');
    text.className = 'gendis-ad-text';
    text.textContent = 'Open Developer Network';

    const subtext = document.createElement('div');
    subtext.className = 'gendis-ad-subtext';
    subtext.textContent = 'Sponsor Ads — Game loading shortly...';

    placeholder.appendChild(logo);
    placeholder.appendChild(text);
    placeholder.appendChild(subtext);
    content.appendChild(placeholder);

    // Footer with Timer and Skip/Close Button
    const footer = document.createElement('div');
    footer.className = 'gendis-ad-footer';

    const timer = document.createElement('div');
    timer.className = 'gendis-ad-timer';
    timer.textContent = `Game will start in ${timeLeft}s`;

    const button = document.createElement('button');
    button.className = 'gendis-ad-button';
    button.disabled = true;
    button.textContent = `Skip Ad (${timeLeft})`;

    footer.appendChild(timer);
    footer.appendChild(button);

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Timer interval
    const interval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        timer.textContent = `Game will start in ${timeLeft}s`;
        button.textContent = `Skip Ad (${timeLeft})`;
      } else {
        clearInterval(interval);
        timer.textContent = 'Ad complete. Enjoy your game!';
        button.disabled = false;
        button.textContent = 'Start Game';
      }
    }, 1000);

    // Close function — always clears the interval & removes the overlay
    const closeAd = () => {
      clearInterval(interval);
      button.removeEventListener('click', closeAd);
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      // Record click event (non-blocking)
      this.sendTelemetry('CLICK');
      if (this.config?.debug) {
        console.log('[GendisSDK] Pre-Roll Ad completed and overlay removed.');
      }
      if (onComplete) {
        onComplete();
      }
    };

    button.addEventListener('click', closeAd);
  }

  /**
   * Helper to bind a Play button click to intercept with an ad before triggering game load.
   * Returns an unbind function for manual cleanup.
   */
  public bindPlayButton(buttonSelector: string | HTMLElement, onComplete: () => void): (() => void) | void {
    if (typeof document === 'undefined') return;

    let element: HTMLElement | null = null;
    if (typeof buttonSelector === 'string') {
      element = document.querySelector(buttonSelector);
    } else {
      element = buttonSelector;
    }

    if (!element) {
      console.warn(`[GendisSDK] Play button element not found for selector: ${buttonSelector}`);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (this.config?.debug) {
        console.log('[GendisSDK] Play button clicked. Showing ad first...');
      }
      this.showPreRoll(onComplete);
    };

    element.addEventListener('click', handler);
    const bound: BoundPlayButton = { element, handler };
    this.boundPlayButtons.push(bound);

    return () => {
      const index = this.boundPlayButtons.indexOf(bound);
      if (index !== -1) {
        this.boundPlayButtons.splice(index, 1);
      }
      element.removeEventListener('click', handler);
    };
  }
}

declare global {
  interface Window {
    GendisSDK: GendisSDKClass;
  }
}

const instance = new GendisSDKClass();

if (typeof window !== 'undefined') {
  window.GendisSDK = instance;
}

export default instance;
