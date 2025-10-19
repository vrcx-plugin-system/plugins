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
  dependencies: string[];
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
  
  on(eventName: string, callback: (data: any) => void): void;
  emit(eventName: string, data?: any): void;
  
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
  dependencies?: string[];
  tags?: string[];
}

interface ModuleLogger {
  log(...args: any[]): void;
  logInfo(...args: any[]): void;
  logWarn(...args: any[]): void;
  logWarning(...args: any[]): void;
  logError(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  showSuccess(message: string): void;
  showInfo(message: string): void;
  showWarning(message: string): void;
  showWarn(message: string): void;
  showError(message: string): void;
  notifyInfo(message: string): void;
  notifySuccess(message: string): void;
  notifyWarning(message: string): void;
  notifyError(message: string): void;
  notifyDesktop(message: string, title?: string): Promise<void>;
  notifyVR(message: string, title?: string): Promise<void>;
  notifyAll(message: string): Promise<void>;
  addFeed(entry: any): void;
  addGameLog(entry: any): void;
  addFriendLog(entry: any): void;
  addNotificationLog(entry: any): void;
  alert(message: string): void;
}

interface ModuleResources {
  timers: Set<number | NodeJS.Timeout>;
  observers: Set<any>;
  listeners: Map<EventTarget, Array<{event: string; handler: EventListener; options?: AddEventListenerOptions}>>;
  subscriptions: Set<() => void>;
  hooks?: Set<{type: string; functionPath: string; callback: Function}>;
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
  COMPONENT: 'component';
  CUSTOM: 'custom';
}

type SettingType = SettingTypeEnum[keyof SettingTypeEnum];

interface CustomJS {
  modules: CustomModule[];
  repos: any[];
  events: Record<string, Array<(data: any) => void>>;
  hooks: {
    pre: Record<string, Array<{plugin: CustomModule; callback: (args: any[]) => void}>>;
    post: Record<string, Array<{plugin: CustomModule; callback: (result: any, args: any[]) => void}>>;
    void: Record<string, Array<{plugin: CustomModule; callback: (args: any[]) => void}>>;
    replace: Record<string, Array<{plugin: CustomModule; callback: (originalFunc: Function, ...args: any[]) => any}>>;
  };
  functions: Record<string, Function>;
  subscriptions: Map<string, Set<() => void>>;
  classes: {
    Logger: any;
    ConfigManager: any;
    SettingsStore: any;
    Module: any;
    CoreModule: any;
    CustomModule: typeof CustomModule;
    CustomActionButton: typeof CustomActionButton;
    ModuleRepository: any;
  };
  utils?: ModuleUtils;
  debug?: any;
  types: {
    SettingType: SettingTypeEnum;
  };
  definePluginSettings?: (definition: Record<string, SettingDefinition>, plugin: CustomModule) => ModuleSettings;
  __LAST_PLUGIN_CLASS__?: typeof CustomModule;
  coreModules?: Map<string, any>;
  configManager?: any;
  getModule?: (idOrUrl: string) => CustomModule | undefined;
  waitForModule?: (moduleId: string, timeout?: number) => Promise<CustomModule>;
  getRepo?: (url: string) => any;
  loadModule?: (url: string) => Promise<{success: boolean; message?: string; module?: CustomModule}>;
  unloadModule?: (idOrUrl: string) => Promise<{success: boolean; message?: string}>;
  reloadModule?: (idOrUrl: string) => Promise<{success: boolean; message?: string}>;
  addRepository?: (url: string, saveConfig?: boolean) => Promise<{success: boolean; message: string; repo?: any}>;
  removeRepository?: (url: string) => boolean;
}

interface ModuleUtils {
  isEmpty(v: any): boolean;
  timeToText(ms: number): string;
  getTimestamp(now?: Date | null): string;
  formatDateTime(now?: Date | null): string;
  copyToClipboard(text: string, description?: string): Promise<boolean>;
  saveBio(bio?: string, bioLinks?: any): Promise<any>;
  getLocationObject(loc: any): Promise<any>;
  hexToRgba(hex: string, alpha: number): string;
  darkenColor(hex: string, percent: number): string;
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
