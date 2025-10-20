/**
 * TypeScript definitions for VRCX Custom Modules
 * These definitions allow modules to be written without @ts-nocheck
 */

/**
 * Author information for modules and plugins
 */
interface ModuleAuthor {
  name: string;
  description?: string;
  userId?: string;
  avatarUrl?: string;
}

/**
 * Custom action button for Plugin Manager UI
 */
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

/**
 * CustomModule - Base class for user modules
 */
declare class CustomModule {
  metadata: ModuleMetadata;
  enabled: boolean;
  loaded: boolean;
  started: boolean;
  logger: ModuleLogger;
  resources: ModuleResources;
  settings?: ModuleSettings;
  categories?: Record<string, SettingCategory>;
  required_dependencies: string[];
  optional_dependencies: string[];
  logColor: string;
  actionButtons: CustomActionButton[];
  repository?: any;

  constructor(metadata: Partial<ModuleMetadata>);
  
  load?(): Promise<void> | void;
  start?(): Promise<void> | void;
  stop(): Promise<void>;
  onLogin?(currentUser: any): Promise<void> | void;
  enable(): Promise<boolean>;
  disable(): Promise<boolean>;
  toggle(): Promise<boolean>;
  
  get(key: string, defaultValue?: any): any;
  set(key: string, value: any): boolean;
  deleteSetting(key: string): boolean;
  hasSetting(key: string): boolean;
  getAllSettingKeys(): string[];
  getAllSettings(): Record<string, any>;
  clearAllSettings(): void;
  
  defineSettings(settings: Record<string, SettingDefinition>): ModuleSettings;
  defineSettingsCategories(categories: Record<string, SettingCategory>): Record<string, SettingCategory>;
  
  showConfirmDialog(title: string, message: string, confirmText?: string, cancelText?: string): Promise<boolean>;
  showAlertDialog(title: string, message: string, confirmText?: string): Promise<void>;
  
  registerPreHook(functionPath: string, callback: (args: any[]) => void): void;
  registerPostHook(functionPath: string, callback: (result: any, args: any[]) => void): void;
  registerVoidHook(functionPath: string, callback: (args: any[]) => void): void;
  registerReplaceHook(functionPath: string, callback: (originalFunc: Function, ...args: any[]) => any): void;
  
  registerTimer(timer: number | NodeJS.Timeout): number | NodeJS.Timeout;
  registerObserver(observer: MutationObserver | IntersectionObserver | ResizeObserver): any;
  registerListener(target: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions): {element: EventTarget; event: string; handler: EventListener};
  registerSubscription(unsubscribe: () => void): () => void;
  registerResource(unsubscribe: () => void): () => void;
  cleanupResources(): void;
  subscribe(storeName: string, callback: (state: any) => void): (() => void) | null;
  
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
  events: string[];
  getEvents(): any[];
  
  log(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Module metadata - uses ModuleAuthor array for multi-author support
 */
interface ModuleMetadata {
  id?: string;
  name: string;
  description: string;
  authors: ModuleAuthor[];
  build?: string;
  url?: string | null;
  required_dependencies?: string[];
  optional_dependencies?: string[];
  tags?: string[];
}

interface ModuleLogger {
  // Console logging
  log(msg: any, ...args: any[]): void;
  logInfo(msg: any, ...args: any[]): void;
  logWarn(msg: any, ...args: any[]): void;
  logWarning(msg: any, ...args: any[]): void;
  logError(msg: any, ...args: any[]): void;
  info(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
  warning(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
  
  // UI toast messages (brief, top-center)
  showInfo(msg: any, ...args: any[]): void;
  showSuccess(msg: any, ...args: any[]): void;
  showWarning(msg: any, ...args: any[]): void;
  showWarn(msg: any, ...args: any[]): void;
  showError(msg: any, ...args: any[]): void;
  
  // UI notifications (persistent, top-right)
  notifyInfo(msg: any, ...args: any[]): void;
  notifySuccess(msg: any, ...args: any[]): void;
  notifyWarning(msg: any, ...args: any[]): void;
  notifyError(msg: any, ...args: any[]): void;
  
  // System notifications
  notifyDesktop(msg: any, title?: string, ...args: any[]): Promise<void>;
  notifyVR(msg: any, title?: string, ...args: any[]): Promise<void>;
  notifyAll(msg: any, ...args: any[]): Promise<void>;
  alert(msg: any, ...args: any[]): void;
  
  // VRCX log feeds
  addFeed(entry: any): void;
  addGameLog(entry: any): void;
  addFriendLog(entry: any): void;
  addNotificationLog(entry: any): void;
}

interface ModuleResources {
  timers: Set<number | NodeJS.Timeout>;
  observers: Set<any>;
  listeners: Map<EventTarget, Array<{event: string; handler: EventListener; options?: AddEventListenerOptions}>>;
  subscriptions: Set<() => void>;
  hooks: Set<{type: string; functionPath: string; callback: Function}>;
}

interface ModuleSettings {
  store: Record<string, any>;
  plain: Record<string, any>;
  def: Record<string, SettingDefinition>;
  pluginName: string;
  onChange(key: string, callback: Function): void;
  offChange(key: string, callback: Function): void;
  reset(key: string): void;
  resetAll(): void;
  getVisibleSettings(): Record<string, SettingDefinition>;
  getHiddenSettings(): Record<string, SettingDefinition>;
  getSettingsByCategory(): Record<string, Record<string, SettingDefinition>>;
  getCategorySettings(categoryKey: string): Record<string, SettingDefinition>;
}

interface SettingDefinition {
  type: SettingType;
  description: string;
  category?: string;
  default?: any;
  placeholder?: string;
  hidden?: boolean;
  markers?: number[];
  options?: SelectOption[];
  variables?: Record<string, string>;
  label?: string;
  min?: number;
  max?: number;
}

interface SettingCategory {
  name: string;
  description: string;
}

interface SelectOption {
  label: string;
  value: any;
  default?: boolean;
}

interface SettingTypeEnum {
  STRING: 'string';
  NUMBER: 'number';
  BIGINT: 'bigint';
  BOOLEAN: 'boolean';
  SELECT: 'select';
  SLIDER: 'slider';
  TIMESPAN: 'timespan';
  COMPONENT: 'component';
  CUSTOM: 'custom';
}

type SettingType = SettingTypeEnum[keyof SettingTypeEnum];

interface CustomJS {
  sourceUrl: string;
  build: number;
  modules: CustomModule[];
  repos: any[];
  subscriptions: Map<string, Set<() => void>>;
  hooks: {
    pre: Record<string, Array<{plugin: CustomModule; callback: (args: any[]) => void}>>;
    post: Record<string, Array<{plugin: CustomModule; callback: (result: any, args: any[]) => void}>>;
    void: Record<string, Array<{plugin: CustomModule; callback: (args: any[]) => void}>>;
    replace: Record<string, Array<{plugin: CustomModule; callback: (originalFunc: Function, ...args: any[]) => any}>>;
  };
  functions: Record<string, Function>;
  eventRegistry: any;
  coreModules: Map<string, any>;
  hasTriggeredLogin: boolean;
  classes: {
    Logger: any;
    ConfigManager: any;
    SettingsStore: any;
    Module: any;
    CoreModule: any;
    CustomModule: typeof CustomModule;
    CustomActionButton: typeof CustomActionButton;
    ModuleRepository: any;
    EventRegistry: any;
  };
  systemLogger: any;
  configManager: any;
  utils: ModuleUtils;
  types: {
    SettingType: SettingTypeEnum;
  };
  definePluginSettings: (definition: Record<string, SettingDefinition>, plugin: CustomModule) => ModuleSettings;
  
  // Module management
  getModule: (idOrUrl: string) => CustomModule | undefined;
  waitForModule: (moduleId: string, timeout?: number) => Promise<CustomModule>;
  loadModule: (url: string) => Promise<{success: boolean; message?: string; module?: CustomModule}>;
  unloadModule: (idOrUrl: string) => Promise<{success: boolean; message?: string}>;
  reloadModule: (idOrUrl: string) => Promise<{success: boolean; message?: string}>;
  
  // Repository management
  getRepo: (url: string) => any;
  addRepository: (url: string, saveConfig?: boolean) => Promise<{success: boolean; message: string; repo?: any}>;
  removeRepository: (url: string) => boolean;
  
  // Emergency shutdown
  panic: () => Promise<{success: boolean; message: string; modulesUnloaded: number}>;
  
  // Internal use
  __LAST_PLUGIN_CLASS__?: typeof CustomModule;
  __currentPluginUrl?: string;
}

interface ModuleUtils {
  // String/Data utilities
  isEmpty(v: any): boolean;
  decodeUnicode(str: string): string;
  
  // Time formatting
  timeToText(ms: number): string;
  parseTimespan(input: string | number): number;
  formatTimespan(ms: number): string;
  getTimestamp(now?: Date | null): string;
  formatDateTime(now?: Date | null): string;
  
  // Clipboard & Downloads
  copyToClipboard(text: string, description?: string): Promise<boolean>;
  downloadFile(url: string, filename: string, mimeType?: string): Promise<{success: boolean; method?: string; error?: string}>;
  downloadDataAsFile(content: string, filename: string, mimeType?: string): void;
  
  // VRCX API helpers
  saveBio(bio?: string, bioLinks?: any): Promise<any>;
  getLocationObject(loc: any): Promise<any>;
  
  // UI utilities
  injectCSS(css: string): HTMLStyleElement;
  hexToRgba(hex: string, alpha: number): string;
  darkenColor(hex: string, percent: number): string;
  
  // Repository parsing
  parseRepositoryUrl(url: string): {
    platform: 'github' | 'gitlab' | 'unknown';
    owner: string;
    repo: string;
    branch?: string;
    filepath?: string;
    isRaw?: boolean;
    isRelease?: boolean;
    tag?: string;
    rawUrl?: string;
    apiUrl?: string;
    repoUrl?: string;
    releaseUrl?: string;
  } | null;
  
  [key: string]: any;
}

interface Window {
  customjs: CustomJS;
  $pinia?: any;
  $app?: any;
  AppApi?: {
    ShowDevTools(): void;
    SendIpc(event: string, data: any): void;
    DesktopNotification(title: string, message: string): Promise<void>;
    XSNotification(title: string, message: string, duration: number, volume: number, icon: string): Promise<void>;
    OVRTNotification(flag1: boolean, flag2: boolean, title: string, message: string, duration: number, volume: number, icon: string | null): Promise<void>;
    ReadConfigFileSafe(): Promise<string>;
    WriteConfigFile(content: string): Promise<void>;
  };
  request?: any;
  database?: any;
}
