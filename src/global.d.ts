/**
 * Global type declarations for VRCX Plugin System
 * Defines types available to all plugins
 */

declare class CustomModule {
  metadata: any;
  logger: any;
  utils: any;
  settings: any;
  categories: any;
  actionButtons: any[];
  required_dependencies: string[];
  optional_dependencies: string[];
  loaded: boolean;
  started: boolean;
  enabled: boolean;

  constructor(metadata?: any);

  // Event system
  registerEvent(eventName: string, options: {
    description: string;
    payload?: Record<string, string>;
    broadcastIPC?: boolean;
    logToConsole?: boolean;
  }): void;
  emit(eventName: string, payload: any): void;
  on(eventName: string, callback: (data: any) => void): () => void;
  off(eventName: string, callback: Function): void;
  get events(): string[];
  getEvents(): any[];

  // Lifecycle
  load(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  unload(): Promise<void>;
  reload(): Promise<any>;
  onLogin(currentUser: any): Promise<void>;

  // Settings
  defineSettings(settings: any): any;
  defineSettingsCategories(categories: any): any;
  get(key: string, defaultValue?: any): any;
  set(key: string, value: any): void;

  // Subscriptions
  subscribe(storeType: string, callback: Function): (() => void) | null;
  registerSubscription(unsubscribe: () => void): void;

  // Hooks
  registerPreHook(functionPath: string, callback: Function): void;
  registerPostHook(functionPath: string, callback: Function): void;
  registerVoidHook(functionPath: string, callback: Function): void;
  registerReplaceHook(functionPath: string, callback: Function): void;

  // Utilities
  registerTimer(timerId: number): number;
  registerObserver(observer: any): any;
  registerListener(element: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions): void;
  cleanupResources(): void;

  // Dialogs
  showConfirmDialog(title: string, message: string, confirmText?: string, cancelText?: string): Promise<boolean>;
  showAlertDialog(title: string, message: string, confirmText?: string): Promise<void>;

  // Logging shortcuts
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

declare class Logger {
  constructor(prefix: string);
  log(message: string, options?: any, level?: string): void;
  warn(message: string, options?: any): void;
  error(message: string, options?: any): void;
  showInfo(message: string): void;
  showSuccess(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;
  addNotificationLog(data: any): void;
}

declare class CustomActionButton {
  title: string;
  color: "primary" | "success" | "warning" | "danger" | "info";
  icon?: string;
  description?: string;
  callback: () => void | Promise<void>;

  constructor(config: {
    title: string;
    color?: "primary" | "success" | "warning" | "danger" | "info";
    icon?: string;
    description?: string;
    callback: () => void | Promise<void>;
  });
}

interface Window {
  customjs: any;
  $pinia: any;
  AppApi: any;
  request: any;
  utils: any;
}
