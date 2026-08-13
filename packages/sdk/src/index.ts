export interface SDKConfig {
  gameId: string;
  developerKey?: string;
  debug?: boolean;
  adDuration?: number; // duration in seconds, default 5
}

export class GendisSDKClass {
  private isInitialized = false;
  private config: SDKConfig | null = null;
  private styleElement: HTMLStyleElement | null = null;

  public init(config: SDKConfig): void {
    if (this.isInitialized) {
      console.warn('[GendisSDK] SDK already initialized.');
      return;
    }
    this.config = {
      adDuration: 5, // default 5 seconds
      ...config
    };
    this.isInitialized = true;
    
    this.injectStyles();

    if (this.config.debug) {
      console.log('[GendisSDK] Initialized with config:', this.config);
    }
  }

  private injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (this.styleElement) return;

    const css = `
      .gendis-ad-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(10, 10, 12, 0.95);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f3f4f6;
        user-select: none;
      }
      .gendis-ad-modal {
        background: #111827;
        border: 1px solid #1f2937;
        border-radius: 16px;
        width: 90%;
        max-width: 560px;
        padding: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .gendis-ad-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .gendis-ad-title {
        font-size: 14px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .gendis-ad-badge {
        background-color: #374151;
        color: #f3f4f6;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
      }
      .gendis-ad-content {
        position: relative;
        width: 100%;
        height: 280px;
        background-color: #030712;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #374151;
      }
      .gendis-ad-placeholder {
        text-align: center;
        padding: 16px;
      }
      .gendis-ad-logo {
        font-size: 36px;
        margin-bottom: 8px;
        animation: pulse 2s infinite ease-in-out;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 1; }
      }
      .gendis-ad-text {
        font-size: 18px;
        font-weight: 700;
        color: #3b82f6;
        margin-bottom: 4px;
      }
      .gendis-ad-subtext {
        font-size: 12px;
        color: #6b7280;
      }
      .gendis-ad-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .gendis-ad-timer {
        font-size: 13px;
        color: #9ca3af;
      }
      .gendis-ad-button {
        background-color: #3b82f6;
        color: #ffffff;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s ease-in-out;
      }
      .gendis-ad-button:hover:not(:disabled) {
        background-color: #2563eb;
      }
      .gendis-ad-button:disabled {
        background-color: #1f2937;
        color: #4b5563;
        cursor: not-allowed;
      }
    `;

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = css;
    document.head.appendChild(this.styleElement);
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

    const duration = this.config?.adDuration || 5;
    let timeLeft = duration;

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

    // Close function
    const closeAd = () => {
      clearInterval(interval);
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
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
   */
  public bindPlayButton(buttonSelector: string | HTMLElement, onComplete: () => void): void {
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

    element.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.config?.debug) {
        console.log('[GendisSDK] Play button clicked. Showing ad first...');
      }
      this.showPreRoll(onComplete);
    });
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
