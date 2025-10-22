// 
class ChatBoxEventsPlugin extends CustomModule {
  lastSentMessages: Map<string, number>;
  oscBridge: any;
  vrcoscData: {
    variables: Record<string, { key: string; name: string; value: any }>;
    events: Record<string, { key: string; name: string; defaultText: string }>;
    states: Record<string, { key: string; name: string; defaultText: string }>;
  };

  constructor() {
    super({
      name: "ChatBox Events 💬",
      description: "Send social events and API errors to VRChat chatbox via OSC Bridge",
      authors: [{
        name: "Bluscream",
        description: "VRCX Plugin System Maintainer",
        userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
      }],
      tags: ["ChatBox", "Events", "OSC", "Notifications"],
      required_dependencies: ["osc-bridge"],
    });

    this.lastSentMessages = new Map();

    // Centralized VRCOSC data definitions
    this.vrcoscData = {
      variables: {
        player_name: { key: 'player_name', name: 'Player Name', value: '' },
        player_id: { key: 'player_id', name: 'Player ID', value: '' },
        api_error: { key: 'api_error', name: 'API Error Message', value: '' },
        api_code: { key: 'api_code', name: 'API Error Code', value: 0 },
        status_text: { key: 'status_text', name: 'VRChat Status', value: '' }
      },
      events: {
        player_joined: { key: 'player_joined', name: 'Player Joined', defaultText: 'Player {vrcx_player_name} joined' },
        player_left: { key: 'player_left', name: 'Player Left', defaultText: 'Player {vrcx_player_name} left' },
        api_error: { key: 'api_error', name: 'API Error', defaultText: 'API Error: {vrcx_api_error}' },
        vrc_status_operational: { key: 'vrc_status_operational', name: 'VRChat Services Operational', defaultText: 'VRChat: {vrcx_status_text}' },
        vrc_status_issue: { key: 'vrc_status_issue', name: 'VRChat Services Issue', defaultText: 'VRChat: {vrcx_status_text}' }
      },
      states: {}
    };
  }

  async load() {
    const SettingType = window.customjs.types.SettingType;

    this.categories = this.defineSettingsCategories({
      general: {
        name: "💬 General",
        description: "General chatbox event settings",
      },
      social: {
        name: "👥 Social Events",
        description: "Player join/leave notifications",
      },
      moderation: {
        name: "🚫 Moderation Events",
        description: "Block/mute notifications",
      },
      api: {
        name: "⚠️ API Errors",
        description: "VRChat API error notifications",
      },
      vrcStatus: {
        name: "🌐 VRChat Status",
        description: "VRChat service status alerts",
      },
    });

    this.settings = this.defineSettings({
      enabled: {
        type: SettingType.BOOLEAN,
        description: "Enable chatbox events",
        category: "general",
        default: true,
      },
      deduplicateSeconds: {
        type: SettingType.NUMBER,
        description: "Minimum seconds between duplicate messages",
        category: "general",
        default: 5,
        min: 0,
        max: 60,
      },
      messagePrefix: {
        type: SettingType.STRING,
        description: "Prefix for all chatbox messages (e.g., '[VRCX]')",
        category: "general",
        default: "[VRCX] ",
      },

      // Social Events
      playerJoined: {
        type: SettingType.BOOLEAN,
        description: "Show when friends join",
        category: "social",
        default: true,
      },
      playerLeft: {
        type: SettingType.BOOLEAN,
        description: "Show when friends leave",
        category: "social",
        default: true,
      },
      onlyFriends: {
        type: SettingType.BOOLEAN,
        description: "Only show events for friends (not all players)",
        category: "social",
        default: true,
      },

      // Moderation Events
      playerBlocked: {
        type: SettingType.BOOLEAN,
        description: "Show when you block someone",
        category: "moderation",
        default: true,
      },
      playerUnblocked: {
        type: SettingType.BOOLEAN,
        description: "Show when you unblock someone",
        category: "moderation",
        default: false,
      },
      playerMuted: {
        type: SettingType.BOOLEAN,
        description: "Show when you mute someone",
        category: "moderation",
        default: true,
      },
      playerUnmuted: {
        type: SettingType.BOOLEAN,
        description: "Show when you unmute someone",
        category: "moderation",
        default: false,
      },

      // API Errors
      apiErrors: {
        type: SettingType.BOOLEAN,
        description: "Show VRChat API errors in chatbox",
        category: "api",
        default: true,
      },
      apiErrorMinSeverity: {
        type: SettingType.SELECT,
        description: "Minimum error severity to show",
        category: "api",
        default: "warning",
        options: [
          { label: "All (includes 429 rate limits)", value: "all" },
          { label: "Warning (client errors)", value: "warning" },
          { label: "Error (critical only)", value: "error" },
        ],
      },

      // VRChat Status
      vrcStatusAlerts: {
        type: SettingType.BOOLEAN,
        description: "Show VRChat service status issues in chatbox",
        category: "vrcStatus",
        default: true,
      },
      vrcStatusRecovery: {
        type: SettingType.BOOLEAN,
        description: "Show when VRChat services recover",
        category: "vrcStatus",
        default: false,
      },
    });

    this.actionButtons = [
      {
        title: "Create VRCOSC Data",
        color: "primary",
        icon: "ri-signal-tower-line",
        description: "Create Variables, States and Events required so you can set them up in VRCOSC",
        callback: async () => {
          await this.createVRCOSCData();
        },
      },
    ];

    this.loaded = true;
    this.logger.log("ChatBox Events plugin loaded");
  }

  async start() {
    // Get OSC Bridge module
    this.oscBridge = window.customjs.getModule("osc-bridge");
    if (!this.oscBridge) {
      this.logger.error("OSC Bridge module not found - ChatBox Events disabled");
      return;
    }

    this.setupGameLogMonitoring();
    this.setupApiErrorMonitoring();
    this.setupVrcStatusMonitoring();

    this.enabled = true;
    this.started = true;
    this.logger.log("ChatBox Events started and monitoring (events will auto-create on first trigger)");
  }

  async createVRCOSCData() {
    if (!this.oscBridge) {
      this.oscBridge = window.customjs.getModule("osc-bridge");
      if (!this.oscBridge) {
        this.logger.showError("OSC Bridge module not found - cannot create VRCOSC data");
        return;
      }
    }

    this.logger.showInfo("Creating VRCOSC variables, states, and events...");
    let created = 0;
    let failed = 0;

    try {
      // Create all variables
      for (const variable of Object.values(this.vrcoscData.variables)) {
        try {
          await this.oscBridge.setChatVariable(variable.key, variable.value);
          created++;
        } catch (error) {
          this.logger.error(`Failed to create variable '${variable.name}': ${error}`);
          failed++;
        }
      }

      // Create all states
      for (const state of Object.values(this.vrcoscData.states)) {
        try {
          await this.oscBridge.createChatState(state.key, state.defaultText);
          created++;
        } catch (error) {
          this.logger.error(`Failed to create state '${state.name}': ${error}`);
          failed++;
        }
      }

      // Create all events
      for (const event of Object.values(this.vrcoscData.events)) {
        try {
          await this.oscBridge.createChatEvent(event.key, event.defaultText);
          created++;
        } catch (error) {
          this.logger.error(`Failed to create event '${event.name}': ${error}`);
          failed++;
        }
      }

      const summary = [];
      const varCount = Object.keys(this.vrcoscData.variables).length;
      const stateCount = Object.keys(this.vrcoscData.states).length;
      const eventCount = Object.keys(this.vrcoscData.events).length;
      
      if (varCount > 0) summary.push(`${varCount} variables`);
      if (stateCount > 0) summary.push(`${stateCount} states`);
      if (eventCount > 0) summary.push(`${eventCount} events`);

      this.logger.showSuccess(`Created ${created} VRCOSC items${failed > 0 ? ` (${failed} failed)` : ''}`);
      this.logger.log(`✓ ${summary.join(', ')}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.showError(`Failed to create VRCOSC data: ${errorMsg}`);
    }
  }

  setupGameLogMonitoring() {
    // Subscribe to gameLog store changes
    this.subscribe("GAMELOG", ({ gameLogSessionTable }) => {
      if (!this.settings.store.enabled) return;
      if (!gameLogSessionTable || gameLogSessionTable.length === 0) return;
      
      // Get the latest entry
      const latestEntry = gameLogSessionTable[gameLogSessionTable.length - 1];
      this.handleGameLogEntry(latestEntry);
    });

    this.logger.log("GameLog store subscription registered");
  }

  setupApiErrorMonitoring() {
    // Hook into $throw function for API errors
    this.registerPreHook("$throw", (args) => {
      if (!this.settings.store.enabled) return;
      if (!this.settings.store.apiErrors) return;
      
      const [code, error, endpoint] = args;
      if (code && code >= 400) {
        this.handleApiError(code, error, endpoint);
      }
    });

    this.logger.log("API error monitoring registered");
  }

  setupVrcStatusMonitoring() {
    // Subscribe to VRChat status changes
    this.subscribe("VRCSTATUS", ({ statusText }) => {
      if (!this.settings.store.enabled) return;
      if (!this.settings.store.vrcStatusAlerts) return;
      
      this.handleVrcStatusChange(statusText);
    });

    this.logger.log("VRChat status monitoring registered");
  }

  handleGameLogEntry(entry: any) {
    if (!entry) return;

    try {
      switch (entry.type) {
        case "OnPlayerJoined":
          if (this.settings.store.playerJoined) {
            this.handlePlayerJoined(entry);
          }
          break;

        case "OnPlayerLeft":
          if (this.settings.store.playerLeft) {
            this.handlePlayerLeft(entry);
          }
          break;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling game log entry: ${errorMsg}`);
    }
  }

  async handlePlayerJoined(entry: any) {
    const displayName = entry.displayName || "Unknown";
    const userId = entry.userId || "";

    // Check if friend filter is enabled
    if (this.settings.store.onlyFriends && userId) {
      const isFriend = await this.isFriend(userId);
      if (!isFriend) return;
    }

    // Set variables and trigger event (auto-creates event on first trigger)
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.player_name.key, displayName);
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.player_id.key, userId);
    await this.oscBridge.triggerChatEvent(this.vrcoscData.events.player_joined.key, this.vrcoscData.events.player_joined.defaultText);
  }

  async handlePlayerLeft(entry: any) {
    const displayName = entry.displayName || "Unknown";
    const userId = entry.userId || "";

    // Check if friend filter is enabled
    if (this.settings.store.onlyFriends && userId) {
      const isFriend = await this.isFriend(userId);
      if (!isFriend) return;
    }

    // Set variables and trigger event (auto-creates event on first trigger)
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.player_name.key, displayName);
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.player_id.key, userId);
    await this.oscBridge.triggerChatEvent(this.vrcoscData.events.player_left.key, this.vrcoscData.events.player_left.defaultText);
  }

  async isFriend(userId: string): Promise<boolean> {
    const friends = (window as any).$pinia?.user?.currentUser?.friends;
    if (!friends || !Array.isArray(friends)) return false;
    return friends.includes(userId);
  }

  async handleApiError(code: number, error: any, endpoint: string) {
    const severity = this.getErrorSeverity(code);
    const minSeverity = this.settings.store.apiErrorMinSeverity;

    // Filter by severity
    if (minSeverity === "error" && severity !== "error") return;
    if (minSeverity === "warning" && severity === "all") return;
    
    let message = "";
    if (code === 429) {
      message = "Rate limited";
    } else if (code === 401) {
      message = "Auth failed";
    } else if (code === 403) {
      message = "Access forbidden";
    } else if (code === 404) {
      message = "Not found";
    } else if (code >= 500) {
      message = "Server error";
    } else {
      message = `Error ${code}`;
    }

    // Set variables and trigger event (auto-creates event on first trigger)
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.api_error.key, message);
    await this.oscBridge.setChatVariable(this.vrcoscData.variables.api_code.key, code);
    await this.oscBridge.triggerChatEvent(this.vrcoscData.events.api_error.key, this.vrcoscData.events.api_error.defaultText);
  }

  getErrorSeverity(statusCode: number): string {
    if (statusCode >= 500) return "error";
    if (statusCode === 429) return "all";
    if (statusCode >= 400) return "warning";
    return "all";
  }

  async handleVrcStatusChange(statusText: string) {
    // If statusText is empty, services are operational
    if (!statusText) {
      if (this.settings.store.vrcStatusRecovery) {
        await this.oscBridge.setChatVariable(this.vrcoscData.variables.status_text.key, 'Services operational');
        await this.oscBridge.triggerChatEvent(this.vrcoscData.events.vrc_status_operational.key, this.vrcoscData.events.vrc_status_operational.defaultText);
      }
    } else {
      // Services have issues
      await this.oscBridge.setChatVariable(this.vrcoscData.variables.status_text.key, statusText);
      await this.oscBridge.triggerChatEvent(this.vrcoscData.events.vrc_status_issue.key, this.vrcoscData.events.vrc_status_issue.defaultText);
    }
  }

  sendToChatBox(message: string) {
    // Add prefix
    const prefix = this.settings.store.messagePrefix || "";
    const fullMessage = prefix + message;

    // Check dedupe
    const dedupSeconds = this.settings.store.deduplicateSeconds;
    if (dedupSeconds > 0) {
      const lastSent = this.lastSentMessages.get(fullMessage);
      if (lastSent && (Date.now() - lastSent) < dedupSeconds * 1000) {
        return;
      }
      this.lastSentMessages.set(fullMessage, Date.now());
    }

    // Send via OSC Bridge
    try {
      if (this.oscBridge && typeof this.oscBridge.sendChatBox === "function") {
        this.oscBridge.sendChatBox(fullMessage);
      } else {
        this.logger.warn("OSC Bridge not available or sendChatBox method missing");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send chatbox message: ${errorMsg}`);
    }
  }

  async stop() {
    this.lastSentMessages.clear();
    await super.stop();
    this.logger.log("ChatBox Events stopped");
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = ChatBoxEventsPlugin;
