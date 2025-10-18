/**
 * TypeScript definitions for VRCX Plugin System
 */

declare class Plugin {
  metadata: PluginMetadata;
  enabled: boolean;
  loaded: boolean;
  started: boolean;
  logger: PluginLogger;
  resources: PluginResources;
  settings?: PluginSettings;
  categories?: Record<string, SettingCategory>;

  constructor(metadata: PluginMetadata);
  
  load?(): Promise<void> | void;
  start?(): Promise<void> | void;
  stop?(): Promise<void> | void;
  onLogin?(currentUser: any): Promise<void> | void;
  
  get(key: string, defaultValue?: any): any;
  set(key: string, value: any): void;
  getConfig(key: string, defaultValue?: any): any;
  setConfig(key: string, value: any): void;
  
  defineSettings(settings: Record<string, SettingDefinition>): PluginSettings;
  defineSettingsCategories(categories: Record<string, SettingCategory>): Record<string, SettingCategory>;
  
  registerPreHook(functionPath: string, callback: (args: any[]) => void): void;
  registerPostHook(functionPath: string, callback: (result: any, args: any[]) => void): void;
  registerVoidHook(functionPath: string, callback: (args: any[]) => void): void;
  registerReplaceHook(functionPath: string, callback: (originalFunc: Function, ...args: any[]) => any): void;
  
  registerTimer(timer: number | NodeJS.Timeout): number | NodeJS.Timeout;
  registerObserver(observer: MutationObserver | IntersectionObserver | ResizeObserver): any;
  registerListener(target: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions): void;
  subscribe(storeName: string, callback: (state: any) => void): void;
  
  on(eventName: string, callback: (data: any) => void): void;
  emit(eventName: string, data?: any): void;
}

interface PluginMetadata {
  name: string;
  description: string;
  author: string;
  build: string;
  dependencies?: string[];
  tags?: string[];
}

interface PluginLogger {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  showSuccess(message: string): void;
  showInfo(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;
}

interface PluginResources {
  timers: Set<number | NodeJS.Timeout>;
  observers: Set<any>;
  listeners: Set<{ target: EventTarget; event: string; callback: EventListener }>;
  subscriptions: Set<() => void>;
}

interface PluginSettings {
  store: Record<string, any>;
  definitions: Record<string, SettingDefinition>;
}

interface SettingDefinition {
  type: SettingType;
  description: string;
  category?: string;
  default: any;
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

enum SettingType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  SELECT = "SELECT",
  SLIDER = "SLIDER"
}

interface CustomJS {
  plugins: Plugin[];
  pluginManager: PluginManager;
  events: Record<string, Array<(data: any) => void>>;
  hooks: {
    pre: Record<string, Array<(args: any[]) => void>>;
    post: Record<string, Array<(result: any, args: any[]) => void>>;
    void: Record<string, Array<(args: any[]) => void>>;
    replace: Record<string, Array<(originalFunc: Function, ...args: any[]) => any>>;
  };
  functions: Record<string, Function>;
  utils?: PluginUtils;
  debug?: any;
  SettingType: typeof SettingType;
  __LAST_PLUGIN_CLASS__?: typeof Plugin;
}

interface PluginManager {
  loadPlugin(url: string): Promise<Plugin>;
  getPlugin(id: string): Plugin | undefined;
  waitForPlugin(id: string, timeout?: number): Promise<Plugin>;
  getPluginList(): Plugin[];
}

interface PluginUtils {
  getTimestamp(): number;
  showSuccess(message: string): void;
  showInfo(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;
}

interface Window {
  customjs: CustomJS;
  $pinia?: any;
  $app?: any;
  AppApi?: any;
  request?: any;
}

declare const window: Window;
