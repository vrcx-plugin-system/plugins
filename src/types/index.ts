/**
 * TypeScript definitions for VRCX Plugin System
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

declare class Plugin {
  metadata: PluginMetadata;
  enabled: boolean;
  loaded: boolean;
  started: boolean;
  logger: PluginLogger;
  resources: PluginResources;
  settings?: PluginSettings;
  categories?: Record<string, SettingCategory>;
  dependencies: string[];
  logColor: string;
  actionButtons: CustomActionButton[];

  constructor(metadata: PluginMetadata);
  
  load?(): Promise<void> | void;
  start?(): Promise<void> | void;
  stop(): Promise<void>;
  onLogin?(currentUser: any): Promise<void> | void;
  toggle?(): Promise<void>;
  
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
  
  log(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * Plugin metadata - uses ModuleAuthor array for multi-author support
 */
interface PluginMetadata {
  name: string;
  description: string;
  authors: ModuleAuthor[];   // Required - array of authors
  build?: string;  // Optional - managed by repo.json
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
  classes: {
    Logger: any;
    ConfigManager: any;
    SettingsStore: any;
    Plugin: typeof Plugin;
    PluginLoader: any;
    PluginManager: any;
    CustomActionButton: typeof CustomActionButton;
    PluginRepo: any;
    PluginRepoManager: any;
  };
  utils?: PluginUtils;
  debug?: any;
  SettingType: typeof SettingType;
  definePluginSettings?: Function;
  __LAST_PLUGIN_CLASS__?: typeof Plugin;
  coreModules?: Map<string, any>;
  configManager?: any;
  repoManager?: any;
  core_modules?: Map<string, any>;
}

interface PluginManager {
  loadPlugin(url: string): Promise<Plugin>;
  getPlugin(id: string): Plugin | undefined;
  waitForPlugin(id: string, timeout?: number): Promise<Plugin>;
  getPluginList(): Plugin[];
  failedUrls?: Map<string, any>;
  getPluginConfig?(): Record<string, boolean>;
  savePluginConfig?(config: Record<string, boolean>): void;
  reloadPlugin?(id: string): Promise<void>;
  removePlugin?(id: string): Promise<void>;
  loader?: any;
}

interface PluginUtils {
  getTimestamp(): number;
  showSuccess(message: string): void;
  showInfo(message: string): void;
  showWarning(message: string): void;
  showError(message: string): void;
  hexToRgba?(hex: string, alpha: number): string;
  copyToClipboard?(text: string, label?: string): void;
  [key: string]: any;
}

interface Window {
  customjs: CustomJS;
  $pinia?: any;
  $app?: any;
  AppApi?: any;
  request?: any;
}

declare const window: Window;
