export interface SDKConfig {
  gameId: string;
  developerKey?: string;
  debug?: boolean;
}

export class GendisSDKClass {
  private isInitialized = false;
  private config: SDKConfig | null = null;

  public init(config: SDKConfig): void {
    if (this.isInitialized) {
      console.warn('[GendisSDK] SDK already initialized.');
      return;
    }
    this.config = config;
    this.isInitialized = true;
    if (config.debug) {
      console.log('[GendisSDK] Initialized with config:', config);
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

    // Temporary placeholder for Pre-roll ad completion
    setTimeout(() => {
      if (this.config?.debug) {
        console.log('[GendisSDK] Pre-Roll Ad completed.');
      }
      if (onComplete) {
        onComplete();
      }
    }, 1000);
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
