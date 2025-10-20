// 
class OSCBridgePlugin extends CustomModule {
  oscReady: boolean;
  pendingMessages: any[];
  stats: any;

  constructor() {
    super({
      name: "OSC Bridge 🎛️",
      description: "Bridges VRCX with external OSC application for VRChat OSC communication",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["Integration", "OSC", "VRChat"],
      required_dependencies: [],
    });

    this.oscReady = false;
    this.pendingMessages = [];
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      lastSent: null,
      lastReceived: null,
    };

    this.actionButtons = [
      {
        title: "Test Connection",
        color: "primary",
        icon: "ri-signal-tower-line",
        description: "Send test ping to OSC application",
        callback: async () => {
          this.sendChatBox('VRCX Plugin Test');
          this.logger.showInfo("Test message sent to OSC app");
        },
      },
      {
        title: "Reset Stats",
        color: "warning",
        icon: "ri-refresh-line",
        description: "Reset statistics",
        callback: async () => {
          this.stats.messagesSent = 0;
          this.stats.messagesReceived = 0;
          this.stats.errors = 0;
          this.logger.showSuccess("Statistics reset");
        },
      },
    ];
  }

  async load() {
    // Register events
    this.registerEvent('osc-param-changed', {
      description: 'Fired when VRChat OSC parameter changes',
      payload: {
        path: 'string - OSC parameter path (e.g., "/avatar/parameters/VRChatting")',
        type: 'string - Value type (bool, int, float)',
        value: 'any - Parameter value',
        timestamp: 'number - Unix timestamp'
      }
    });

    this.registerEvent('osc-ready', {
      description: 'Fired when OSC bridge is connected',
      payload: {
        timestamp: 'number - Unix timestamp'
      }
    });

    this.registerEvent('osc-error', {
      description: 'Fired when OSC error occurs',
      payload: {
        error: 'string - Error message',
        timestamp: 'number - Unix timestamp'
      }
    });

    this.registerEvent('command-received', {
      description: 'Fired when VRCOSC sends a command to VRCX',
      payload: {
        command: 'string - Command name',
        args: 'any - Command arguments',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: true
    });

    const SettingType = window.customjs.types.SettingType;

    this.categories = this.defineSettingsCategories({
      connection: {
        name: "🎛️ Connection",
        description: "OSC connection settings",
      },
      chatbox: {
        name: "🎛️ ChatBox",
        description: "VRChat ChatBox integration",
      },
      advanced: {
        name: "🎛️ Advanced",
        description: "Advanced OSC settings",
      },
    });

    this.settings = this.defineSettings({
      enabled: {
        type: SettingType.BOOLEAN,
        description: "Enable OSC bridge",
        category: "connection",
        default: true,
      },
      autoReconnect: {
        type: SettingType.BOOLEAN,
        description: "Auto-reconnect to OSC app if disconnected",
        category: "connection",
        default: true,
      },
      logOscParams: {
        type: SettingType.BOOLEAN,
        description: "Log all OSC parameter changes to console",
        category: "advanced",
        default: false,
      },
      logCommands: {
        type: SettingType.BOOLEAN,
        description: "Log VRCOSC commands to console",
        category: "advanced",
        default: true,
      },
    });

    // Register IPC listener for messages FROM OSC app
    this.setupIpcListener();

    this.loaded = true;
    this.logger.log("OSC Bridge plugin loaded");
  }

  async start() {
    this.oscReady = false;
    this.pendingMessages = [];

    // Send INIT to VRCOSC via IPC
    this.sendIpcToOSC('INIT', { timestamp: Date.now() });

    this.logger.log("Waiting for VRCOSC to connect...");
  }

  async stop() {
    // Notify OSC app that we're shutting down
    this.sendIpcToOSC('SHUTDOWN', { timestamp: Date.now() });
    
    await super.stop();
    this.logger.log("OSC Bridge stopped");
  }

  /**
   * Setup IPC listener for messages FROM external OSC app
   */
  setupIpcListener() {
    // Listen for IPC messages from OSC app
    this.subscribe('IPC', (data) => {
      if (!data || !data.type) return;

      // Only process OSC-related messages
      if (!data.type.startsWith('OSC_')) return;

      this.handleIpcMessage(data);
    });

    this.logger.log("IPC listener registered for OSC messages");
  }

  /**
   * Handle IPC message from external OSC app
   */
  handleIpcMessage(data: any) {
    try {
      switch (data.type) {
        case 'OSC_READY':
          this.oscReady = true;
          this.logger.showSuccess("OSC application connected!");
          this.emit('osc-ready', { timestamp: Date.now() });
          
          // Send any pending messages
          if (this.pendingMessages.length > 0) {
            this.logger.log(`Sending ${this.pendingMessages.length} pending messages`);
            this.pendingMessages.forEach(msg => this.sendIpcToOSC('SEND', msg));
            this.pendingMessages = [];
          }
          break;

        case 'OSC_RECEIVED':
          // OSC parameter received FROM VRChat via VRCOSC
          if (this.settings.store.logOscParams) {
            this.logger.log(`OSC ← VRChat: ${data.payload.address} = ${JSON.stringify(data.payload.value)} (${data.payload.type})`);
          }

          this.emit('osc-param-changed', {
            path: data.payload.address,
            type: data.payload.type,
            value: data.payload.value,
            timestamp: Date.now()
          });
          break;

        case 'OSC_COMMAND':
          // Command FROM VRCOSC to control VRCX
          if (this.settings.store.logCommands) {
            this.logger.log(`Command ← VRCOSC: ${data.payload.command}`);
          }
          this.handleCommand(data.payload);
          break;

        case 'OSC_ERROR':
          this.logger.error(`OSC Error: ${data.payload.error}`);
          this.emit('osc-error', {
            error: data.payload.error,
            timestamp: Date.now()
          });
          break;

        case 'OSC_DISCONNECTED':
          this.oscReady = false;
          this.logger.showWarning("OSC application disconnected");
          
          if (this.settings.store.autoReconnect) {
            setTimeout(() => {
              this.sendIpcToOSC('INIT', { timestamp: Date.now() });
            }, 5000);
          }
          break;

        default:
          this.logger.warn(`Unknown OSC IPC message: ${data.type}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling IPC message: ${errorMsg}`);
    }
  }

  /**
   * Handle command from VRCOSC to control VRCX
   */
  async handleCommand(payload: any) {
    const { command, args, requestId } = payload;
    let result: any = { success: false, error: 'Unknown command' };

    try {
      this.logger.log(`Command from VRCOSC: ${command}`, args);
      
      this.emit('command-received', {
        command,
        args,
        timestamp: Date.now()
      });

      switch (command) {
        // VRChat API calls
        case 'SEND_INVITE':
          result = await this.executeVRChatInvite(args);
          break;

        case 'SEND_FRIEND_REQUEST':
          result = await this.executeVRChatFriendRequest(args);
          break;

        case 'GET_USER_INFO':
          result = await this.executeGetUserInfo(args);
          break;

        case 'GET_WORLD_INFO':
          result = await this.executeGetWorldInfo(args);
          break;

        case 'GET_CURRENT_LOCATION':
          result = this.executeGetCurrentLocation();
          break;

        case 'GET_FRIENDS_LIST':
          result = this.executeGetFriendsList(args);
          break;

        // VRCX UI actions
        case 'SHOW_NOTIFICATION':
          result = this.executeShowNotification(args);
          break;

        case 'SHOW_TOAST':
          result = this.executeShowToast(args);
          break;

        case 'OPEN_USER_DIALOG':
          result = this.executeOpenUserDialog(args);
          break;

        case 'OPEN_WORLD_DIALOG':
          result = this.executeOpenWorldDialog(args);
          break;

        // Data queries
        case 'GET_PLUGIN_LIST':
          result = this.executeGetPluginList();
          break;

        case 'GET_ONLINE_FRIENDS':
          result = this.executeGetOnlineFriends();
          break;

        case 'QUERY_DATABASE':
          result = await this.executeQueryDatabase(args);
          break;

        default:
          result = { success: false, error: `Unknown command: ${command}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result = { success: false, error: errorMsg };
      this.logger.error(`Command execution failed: ${errorMsg}`);
    }

    // Send result back to VRCOSC
    if (requestId) {
      this.sendIpcToOSC('RESPONSE', {
        requestId,
        result
      });
    }
  }

  // Command implementations
  async executeVRChatInvite(args: any) {
    const { userId, instanceId, worldId, worldName, message } = args;
    const inviteParams: any = { instanceId, worldId, worldName };
    if (message) inviteParams.message = message;

    await window.request.notificationRequest.sendInvite(inviteParams, userId);
    return { success: true, message: `Invite sent to ${userId}` };
  }

  async executeVRChatFriendRequest(args: any) {
    const { userId } = args;
    await window.request.friendRequest.sendFriendRequest(userId);
    return { success: true, message: `Friend request sent to ${userId}` };
  }

  async executeGetUserInfo(args: any) {
    const { userId } = args;
    const user = await window.request.apiRequest.getUser(userId);
    return { success: true, data: user };
  }

  async executeGetWorldInfo(args: any) {
    const { worldId } = args;
    const world = await window.request.apiRequest.getWorld(worldId);
    return { success: true, data: world };
  }

  executeGetCurrentLocation() {
    const currentUser = window.$pinia?.user?.currentUser;
    return {
      success: true,
      data: {
        userId: currentUser?.id,
        displayName: currentUser?.displayName,
        location: currentUser?.location,
        worldId: window.$pinia?.location?.worldId,
        instanceId: window.$pinia?.location?.instanceId,
      }
    };
  }

  executeGetFriendsList(args: any) {
    const { onlineOnly = false } = args || {};
    const friends = window.$pinia?.friends?.friends || [];
    
    const filteredFriends = onlineOnly 
      ? friends.filter((f: any) => f.location && f.location !== 'offline' && f.location !== 'private')
      : friends;

    return {
      success: true,
      data: filteredFriends.map((f: any) => ({
        id: f.id,
        displayName: f.displayName,
        location: f.location,
        status: f.status,
        statusDescription: f.statusDescription,
      }))
    };
  }

  executeShowNotification(args: any) {
    const { title, message, type = 'info' } = args;
    
    const AppApi = window.AppApi;
    if (AppApi?.DesktopNotification) {
      AppApi.DesktopNotification(title, message);
    }

    return { success: true };
  }

  executeShowToast(args: any) {
    const { message, type = 'info' } = args;
    
    switch (type) {
      case 'success': this.logger.showSuccess(message); break;
      case 'warning': this.logger.showWarning(message); break;
      case 'error': this.logger.showError(message); break;
      default: this.logger.showInfo(message); break;
    }

    return { success: true };
  }

  executeOpenUserDialog(args: any) {
    const { userId } = args;
    const userStore = window.$pinia?.user;
    if (userStore?.showUserDialog) {
      userStore.showUserDialog(userId);
      return { success: true };
    }
    return { success: false, error: 'User dialog not available' };
  }

  executeOpenWorldDialog(args: any) {
    const { worldId } = args;
    const worldStore = window.$pinia?.world;
    if (worldStore?.showWorldDialog) {
      worldStore.showWorldDialog(worldId);
      return { success: true };
    }
    return { success: false, error: 'World dialog not available' };
  }

  executeGetPluginList() {
    const modules = window.customjs?.modules || [];
    return {
      success: true,
      data: modules.map((m: any) => ({
        id: m.metadata.id,
        name: m.metadata.name,
        enabled: m.enabled,
        started: m.started,
      }))
    };
  }

  executeGetOnlineFriends() {
    const friends = window.$pinia?.friends?.friends || [];
    const online = friends.filter((f: any) => 
      f.location && f.location !== 'offline' && f.location !== 'private'
    );

    return {
      success: true,
      count: online.length,
      data: online.map((f: any) => ({
        id: f.id,
        displayName: f.displayName,
        location: f.location,
        worldId: f.worldId,
      }))
    };
  }

  async executeQueryDatabase(args: any) {
    const { query, params = [] } = args;
    
    try {
      const SQLite = window.SQLite;
      if (!SQLite) {
        return { success: false, error: 'SQLite not available' };
      }

      const result = await SQLite.Execute(query, params);
      return { success: true, data: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Send IPC message TO external OSC app
   */
  sendIpcToOSC(command: string, payload: any) {
    try {
      const AppApi = window.AppApi;
      if (!AppApi?.SendIpc) {
        this.logger.error("AppApi.SendIpc not available");
        return false;
      }

      AppApi.SendIpc(`OSC_${command}`, JSON.stringify(payload));
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send IPC: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Send OSC message to VRChat (via external app)
   * @param address - OSC address (e.g., '/chatbox/input', '/avatar/parameters/MyParam')
   * @param value - OSC value (string, number, boolean, array)
   */
  sendOSC(address: string, value: any): boolean {
    if (!this.settings.store.enabled) {
      this.logger.warn("OSC Bridge is disabled");
      return false;
    }

    const message = { address, value, timestamp: Date.now() };

    // If OSC app not ready, queue message
    if (!this.oscReady) {
      this.pendingMessages.push(message);
      this.logger.log(`OSC app not ready, message queued (${this.pendingMessages.length} pending)`);
      return false;
    }

    // Send via IPC
    const sent = this.sendIpcToOSC('SEND', message);
    
    if (sent) {
      this.stats.messagesSent++;
      this.stats.lastSent = Date.now();

      if (this.settings.store.logOscParams) {
        this.logger.log(`OSC → VRChat: ${address} = ${JSON.stringify(value)}`);
      }
    }

    return sent;
  }

  /**
   * Send ChatBox message to VRChat
   * @param message - Message text (max 144 chars)
   * @param immediate - Send immediately (true) or type out (false)
   */
  sendChatBox(message: string, immediate: boolean = true): boolean {
    const prefix = this.settings.store.chatboxPrefix || '';
    const suffix = this.settings.store.chatboxSuffix || '';
    const fullMessage = prefix + message + suffix;

    // VRChat chatbox has 144 character limit
    const truncated = fullMessage.substring(0, 144);

    return this.sendOSC('/chatbox/input', [truncated, immediate, false]);
  }

  /**
   * Clear ChatBox
   */
  clearChatBox(): boolean {
    return this.sendOSC('/chatbox/input', ['', true, false]);
  }

  /**
   * Set avatar parameter
   * @param parameterName - Parameter name
   * @param value - Value (number, boolean)
   */
  setAvatarParameter(parameterName: string, value: number | boolean): boolean {
    return this.sendOSC(`/avatar/parameters/${parameterName}`, value);
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      oscReady: this.oscReady,
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
      errors: this.stats.errors,
      lastSent: this.stats.lastSent,
      lastReceived: this.stats.lastReceived,
      pendingMessages: this.pendingMessages.length,
    };
  }
}

(window as any).customjs.__LAST_PLUGIN_CLASS__ = OSCBridgePlugin;
