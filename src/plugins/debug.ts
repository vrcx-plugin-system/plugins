// 
class DebugPlugin extends CustomModule {
  private ipcMessageLog: Array<{timestamp: number; direction: 'in' | 'out'; type: string; msgType?: string; data: any}> = [];
  private maxLogSize: number = 100;

  constructor() {
    super({
      name: "Debug Plugin 🐛",
      description: "Debug utilities, full IPC logging, global scope search, and console commands",
      authors: [{
        name: "Bluscream",
        description: "VRCX Plugin System Maintainer",
        userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
      }],
      required_dependencies: [],
      tags: ["Debug", "Utility", "Development"],
    });

    this.actionButtons = [
      {
        title: "Dump System State",
        color: "primary",
        icon: "ri-file-info-line",
        description: "Log all system information to console",
        callback: async () => {
          this.dumpSystemState();
        },
      },
      {
        title: "Show IPC Log",
        color: "info",
        icon: "ri-chat-1-line",
        description: "Display all captured IPC messages",
        callback: async () => {
          this.showIpcLog();
        },
      },
      {
        title: "Clear IPC Log",
        color: "warning",
        icon: "ri-delete-bin-line",
        description: "Clear IPC message log",
        callback: async () => {
          this.ipcMessageLog = [];
          this.logger.showSuccess("Cleared IPC log");
        },
      },
      {
        title: "Test Error",
        color: "danger",
        icon: "ri-error-warning-line",
        description: "Trigger a test error",
        callback: async () => {
          throw new Error("Test error from Debug Plugin");
        },
      },
    ];
  }

  async load() {
    const SettingType = window.customjs.types.SettingType;

    this.categories = this.defineSettingsCategories({
      general: {
        name: "🔧 General",
        description: "General debug settings",
      },
      ipc: {
        name: "📡 IPC Logging",
        description: "Inter-process communication logging",
      },
    });

    this.settings = this.defineSettings({
      consoleTimestamps: {
        type: SettingType.BOOLEAN,
        description: "Show timestamps in console logs",
        category: "general",
        default: true,
      },
      logIncomingIpc: {
        type: SettingType.BOOLEAN,
        description: "Log incoming IPC messages to console",
        category: "ipc",
        default: true,
      },
      logOutgoingIpc: {
        type: SettingType.BOOLEAN,
        description: "Log outgoing IPC messages to console",
        category: "ipc",
        default: true,
      },
      ipcTypeFilter: {
        type: SettingType.STRING,
        description: "Filter IPC types (comma-separated, e.g. 'OSC_,VrcxMessage' or leave empty for all)",
        category: "ipc",
        default: "",
      },
      captureIpc: {
        type: SettingType.BOOLEAN,
        description: "Capture IPC messages to log (view with 'Show IPC Log' button)",
        category: "ipc",
        default: true,
      },
      maxIpcLogSize: {
        type: SettingType.NUMBER,
        description: "Maximum IPC messages to keep in log",
        category: "ipc",
        default: 100,
        min: 10,
        max: 1000,
      },
    });

    // Expose all debug functions globally
    (window.customjs as any).debug = {
      // Plugin system debug
      printDebugInfo: () => this.dumpSystemState(),
      listPlugins: () => this.listPlugins(),
      getPlugin: (id: string) => window.customjs.getModule(id),
      listEvents: () => this.listEvents(),
      listHooks: () => this.listHooks(),
      testEvent: (eventName: string, data: any) => this.testEvent(eventName, data),

      // VRCX state access
      getCurrentUser: () => (window as any).$pinia?.user?.currentUser,
      getCurrentLocation: () => (window as any).$app?.lastLocation,
      getFriends: () => (window as any).$pinia?.user?.currentUser?.friends,
      getCustomTags: () => (window as any).$pinia?.user?.customUserTags,
      getStores: () => (window as any).$pinia,

      // Plugin helpers
      getModules: () => window.customjs.modules,
      getRepos: () => window.customjs.repos,
      inspectPlugin: (id: string) => this.inspectPlugin(id),

      // Global scope search
      searchVariable: (searchTerm: string, options?: any) => this.searchVariable(searchTerm, options),

      // IPC log access
      showIpcLog: () => this.showIpcLog(),
      clearIpcLog: () => { this.ipcMessageLog = []; },
      getIpcLog: () => this.ipcMessageLog,
    };

    this.logger.log("Debug utilities ready (access via window.customjs.debug)");
    this.loaded = true;
  }

  async start() {
    // Setup IPC logging
    this.setupIpcLogging();

    this.enabled = true;
    this.started = true;
    this.logger.log("Debug plugin started");
  }

  setupIpcLogging() {
    // Hook incoming IPC messages
    this.onIpc((data) => {
      const shouldLog = this.shouldLogIpcMessage('in', data.type, data.raw.Type);
      
      if (shouldLog && this.settings?.store.logIncomingIpc) {
        console.group(`%c[IPC IN] ${data.type}`, 'color: #4caf50; font-weight: bold');
        console.log('Type:', data.type);
        console.log('Payload:', data.payload);
        console.log('Raw:', data.raw);
        console.log('Time:', new Date().toLocaleTimeString());
        console.groupEnd();
      }

      if (shouldLog && this.settings?.store.captureIpc) {
        this.captureIpcMessage('in', data.type, data.payload, data.raw.Type);
      }
    });

    // Hook outgoing IPC messages
    this.registerPreHook("AppApi.SendIpc", (args) => {
      const msgType = this.extractMessageType(args);
      const shouldLog = this.shouldLogIpcMessage('out', msgType);
      
      if (shouldLog && this.settings?.store.logOutgoingIpc) {
        console.group(`%c[IPC OUT] ${msgType}`, 'color: #ff9800; font-weight: bold');
        console.log('Args:', args);
        console.log('Time:', new Date().toLocaleTimeString());
        console.groupEnd();
      }

      if (shouldLog && this.settings?.store.captureIpc) {
        this.captureIpcMessage('out', msgType, args);
      }
    });

    this.logger.log("IPC logging initialized (incoming + outgoing)");
  }

  private extractMessageType(args: any[]): string {
    try {
      if (args && args.length > 0) {
        const firstArg = args[0];
        if (typeof firstArg === 'string') {
          const parsed = JSON.parse(firstArg);
          return parsed.MsgType || parsed.Type || 'Unknown';
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return 'Unknown';
  }

  private shouldLogIpcMessage(direction: 'in' | 'out', msgType: string, rawType?: string): boolean {
    const filter = this.settings?.store.ipcTypeFilter || '';
    if (!filter) return true;

    const filters = filter.split(',').map(f => f.trim()).filter(f => f);
    return filters.some(f => msgType.includes(f) || rawType?.includes(f));
  }

  private captureIpcMessage(direction: 'in' | 'out', type: string, data: any, msgType?: string) {
    this.maxLogSize = this.settings?.store.maxIpcLogSize || 100;
    
    this.ipcMessageLog.push({
      timestamp: Date.now(),
      direction,
      type,
      msgType,
      data
    });

    // Trim if too large
    if (this.ipcMessageLog.length > this.maxLogSize) {
      this.ipcMessageLog = this.ipcMessageLog.slice(-this.maxLogSize);
    }
  }

  showIpcLog() {
    if (this.ipcMessageLog.length === 0) {
      this.logger.showInfo("No IPC messages captured");
      return;
    }

    console.group(`%c[Debug] IPC Message Log (${this.ipcMessageLog.length} messages)`, 'color: #ff9800; font-weight: bold; font-size: 14px');
    
    // Group by direction and type
    const incoming = this.ipcMessageLog.filter(m => m.direction === 'in');
    const outgoing = this.ipcMessageLog.filter(m => m.direction === 'out');

    if (incoming.length > 0) {
      console.group(`%c📥 Incoming (${incoming.length})`, 'color: #4caf50; font-weight: bold');
      const grouped: Record<string, any[]> = {};
      incoming.forEach(msg => {
        const key = msg.type;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(msg);
      });
      Object.entries(grouped).forEach(([type, messages]) => {
        console.group(`${type} (${messages.length})`);
        messages.forEach(msg => {
          const time = new Date(msg.timestamp).toLocaleTimeString();
          console.log(`[${time}]`, msg.data);
        });
        console.groupEnd();
      });
      console.groupEnd();
    }

    if (outgoing.length > 0) {
      console.group(`%c📤 Outgoing (${outgoing.length})`, 'color: #ff9800; font-weight: bold');
      const grouped: Record<string, any[]> = {};
      outgoing.forEach(msg => {
        const key = msg.type;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(msg);
      });
      Object.entries(grouped).forEach(([type, messages]) => {
        console.group(`${type} (${messages.length})`);
        messages.forEach(msg => {
          const time = new Date(msg.timestamp).toLocaleTimeString();
          console.log(`[${time}]`, msg.data);
        });
        console.groupEnd();
      });
      console.groupEnd();
    }

    console.groupEnd();
    this.logger.showInfo(`Displayed ${this.ipcMessageLog.length} IPC messages in console`);
  }

  async stop() {
    if ((window.customjs as any)?.debug) {
      delete (window.customjs as any).debug;
    }
    await super.stop();
  }

  dumpSystemState() {
    console.group("%c=== DEBUG INFO ===", "color: #2196f3; font-weight: bold; font-size: 14px");
    console.log(`Modules loaded: ${window.customjs.modules.length}`);
    console.log(`Event registry stats:`, window.customjs.eventRegistry.getStats());
    console.log(`Hooks: pre=${Object.keys(window.customjs.hooks.pre).length}, post=${Object.keys(window.customjs.hooks.post).length}`);
    console.log(`Functions backed up: ${Object.keys(window.customjs.functions).length}`);
    
    console.group("Loaded Modules");
    window.customjs.modules.forEach((plugin) => {
      const status = `${plugin.enabled ? '✓' : '✗'} ${plugin.loaded ? 'L' : ''} ${plugin.started ? 'S' : ''}`;
      console.log(`[${status}] ${plugin.metadata.name} (${plugin.metadata.id})`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }

  listPlugins() {
    return window.customjs.modules.map((p) => ({
      id: p.metadata.id,
      name: p.metadata.name,
      enabled: p.enabled,
      loaded: p.loaded,
      started: p.started,
    }));
  }

  listEvents() {
    if ((window as any).AppApi?.ShowDevTools) {
      (window as any).AppApi.ShowDevTools();
    }

    const allEvents = window.customjs.eventRegistry.listAll();
    console.group("📡 Registered Events");
    allEvents.forEach((event: any) => {
      console.log(`${event.name}: ${event.listenerCount} listeners (${event.registeredBy.length} plugins)`);
    });
    console.groupEnd();
    return allEvents;
  }

  listHooks() {
    if ((window as any).AppApi?.ShowDevTools) {
      (window as any).AppApi.ShowDevTools();
    }

    console.group("🪝 Registered Hooks");
    console.log("Pre-hooks:", Object.keys(window.customjs.hooks.pre));
    console.log("Post-hooks:", Object.keys(window.customjs.hooks.post));
    console.log("Void-hooks:", Object.keys(window.customjs.hooks.void));
    console.log("Replace-hooks:", Object.keys(window.customjs.hooks.replace));
    console.groupEnd();
    return window.customjs.hooks;
  }

  testEvent(eventName: string, data: any) {
    this.emit(eventName, data);
    this.logger.log(`Emitted event: ${eventName}`, data);
  }

  inspectPlugin(id: string) {
    if ((window as any).AppApi?.ShowDevTools) {
      (window as any).AppApi.ShowDevTools();
    }

    const plugin = window.customjs.modules.find((p) => p.metadata.id === id);
    if (plugin) {
      console.group(`🔍 Plugin: ${plugin.metadata.name}`);
      console.log("Metadata:", plugin.metadata);
      console.table({
        enabled: plugin.enabled,
        loaded: plugin.loaded,
        started: plugin.started,
      });
      console.log("Resources:", plugin.resources);
      console.log("Settings:", plugin.settings?.store);
      console.groupEnd();
    } else {
      console.warn(`Plugin not found: ${id}`);
    }
    return plugin;
  }

  searchVariable(searchTerm: string, options: any = {}) {
    const maxDepth = options.maxDepth || 5;
    const caseSensitive = options.caseSensitive || false;
    const exactMatch = options.exactMatch || false;
    const root = options.root || window;

    const results: any[] = [];
    const visited = new WeakSet();
    const searchPattern = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    const search = (obj: any, path: string, depth: number) => {
      if (depth > maxDepth) return;
      if (obj === null || obj === undefined) return;
      if (typeof obj !== "object" && typeof obj !== "function") return;
      if (visited.has(obj)) return;
      visited.add(obj);

      try {
        const keys = Object.getOwnPropertyNames(obj);
        for (const key of keys) {
          try {
            const currentPath = path ? `${path}.${key}` : key;
            const keyToCheck = caseSensitive ? key : key.toLowerCase();
            const matches = exactMatch ? keyToCheck === searchPattern : keyToCheck.includes(searchPattern);

            if (matches) {
              let value;
              let type;
              try {
                const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                if (descriptor && descriptor.get && !descriptor.set) {
                  value = "[Getter]";
                  type = "getter";
                } else {
                  value = obj[key];
                  type = typeof value;
                }
              } catch (e) {
                value = "[Access Error]";
                type = "error";
              }
              results.push({ path: currentPath, key, type, value });
            }

            if (depth < maxDepth) {
              try {
                const nestedValue = obj[key];
                if (nestedValue && (typeof nestedValue === "object" || typeof nestedValue === "function")) {
                  search(nestedValue, currentPath, depth + 1);
                }
              } catch (e) {
                // Skip
              }
            }
          } catch (e) {
            // Skip
          }
        }
      } catch (e) {
        // Skip
      }
    };

    this.logger.log(`Searching for "${searchTerm}" (max depth: ${maxDepth})...`);
    search(root, "", 0);

    if ((window as any).AppApi?.ShowDevTools) {
      (window as any).AppApi.ShowDevTools();
    }

    console.group(`🔍 Search results for "${searchTerm}" (${results.length} matches)`);
    results.forEach((result) => {
      if (result.type === "getter" || result.type === "error") {
        console.log(`${result.path} [${result.type}]`);
      } else {
        console.log(`${result.path} [${result.type}]`, result.value);
      }
    });
    console.groupEnd();

    this.logger.log(`Found ${results.length} matches`);
    return results;
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = DebugPlugin;
