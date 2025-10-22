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
      },
      broadcastIPC: false,
      logToConsole: false
    });

    this.registerEvent('osc-ready', {
      description: 'Fired when OSC bridge is connected',
      payload: {
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: false
    });

    this.registerEvent('osc-error', {
      description: 'Fired when OSC error occurs',
      payload: {
        error: 'string - Error message',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: false
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
        name: "💬 ChatBox",
        description: "VRChat ChatBox integration (deprecated methods)",
      },
      variables: {
        name: "📝 Variables",
        description: "ChatBox variable storage (recommended)",
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
      ipcMessageType: {
        type: SettingType.STRING,
        description: "IPC message type for bulk events (Event7List=silent, VrcxMessage=verbose)",
        category: "advanced",
        default: "Event7List",
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
      enableDirectChatBox: {
        type: SettingType.BOOLEAN,
        description: "⚠️ Enable deprecated direct ChatBox methods (sendChatBox/clearChatBox). Use storeChatVariable() instead.",
        category: "chatbox",
        default: false,
      },
    });

    // Register IPC listener for messages FROM OSC app
    this.setupIpcListener();

    // Patch console.log to filter out verbose IPC messages
    this.patchIpcLogging();

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
    this.onIpc((data) => {
      // Process OSC-related messages
      if (data.type?.startsWith('OSC_')) {
        this.handleIpcMessage(data);
      }
      // Also handle configurable message type for bulk OSC events
      else {
        const configuredType = this.settings?.store?.ipcMessageType || 'Event7List';
        if (data.type === configuredType && data.raw?.MsgType === 'OSC_RECEIVED_BULK') {
          this.handleIpcMessage({
            type: data.raw.MsgType,
            payload: JSON.parse(data.raw.Data)
          });
        }
      }
    });
    
    this.logger.log("IPC listener registered for OSC messages");
  }

  /**
   * Patch console.log to filter out verbose OSC IPC messages
   */
  patchIpcLogging() {
    const originalConsoleLog = console.log;
    const self = this;
    
    console.log = function(...args: any[]) {
      // Filter out "IPC:" messages for OSC_RECEIVED_BULK unless logging is enabled
      if (args.length >= 2 && args[0] === 'IPC:' && typeof args[1] === 'object') {
        const data = args[1];
        const configuredType = self.settings?.store?.ipcMessageType || 'Event7List';
        // Suppress OSC_RECEIVED_BULK messages when logging is disabled (check configured type)
        if (data?.Type === configuredType && data?.MsgType === 'OSC_RECEIVED_BULK') {
          if (!self.settings?.store?.logOscParams) {
            return; // Suppress this log
          }
        }
      }
      
      // Call original console.log for everything else
      originalConsoleLog.apply(console, args);
    };
    
    this.logger.log("IPC logging filter installed");
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
          // OSC parameter received FROM VRChat via VRCOSC (single event)
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

        case 'OSC_RECEIVED_BULK':
          // Bulk OSC events from VRCOSC - decode and emit individually
          const events = data.payload.events;
          if (Array.isArray(events)) {
            if (this.settings.store.logOscParams) {
              this.logger.log(`OSC ← VRChat: Received ${events.length} bulk events`);
            }

            for (const event of events) {
              if (this.settings.store.logOscParams) {
                this.logger.log(`  ${event.Address} = ${JSON.stringify(event.Value)} (${event.Type})`);
              }

              this.emit('osc-param-changed', {
                path: event.Address,
                type: event.Type,
                value: event.Value,
                timestamp: event.Timestamp || Date.now()
              });
            }

            this.stats.messagesReceived += events.length;
            this.stats.lastReceived = Date.now();
          }
          break;

        case 'OSC_COMMAND':
          // Command FROM VRCOSC to control VRCX
          if (this.settings.store.logCommands) {
            this.logger.log(`Command ← VRCOSC: ${data.payload.command}`);
          }
          this.handleCommand(data.payload);
          break;

        case 'OSC_RESPONSE':
          // Response FROM VRCOSC to our command
          const responseId = data.payload.requestId;
          if (responseId && this.pendingCommands.has(responseId)) {
            const pending = this.pendingCommands.get(responseId)!;
            clearTimeout(pending.timeout);
            pending.resolve(data.payload.result);
            this.pendingCommands.delete(responseId);
          }
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
   * @deprecated Use storeChatVariable() instead for proper ChatBox integration
   * Send ChatBox message to VRChat (deprecated - requires manual enablement)
   * @param message - Message text (max 144 chars)
   * @param immediate - Send immediately (true) or type out (false)
   */
  sendChatBox(message: string, immediate: boolean = true): boolean {
    if (!this.settings.store.enableDirectChatBox) {
      this.logger.showWarning("Direct ChatBox methods are disabled. Use storeChatVariable() or enable in settings.");
      this.logger.warn("⚠️ sendChatBox() is deprecated. Use storeChatVariable() + ChatBox timeline for proper integration.");
      return false;
    }

    this.logger.warn("⚠️ Using deprecated sendChatBox(). Consider using storeChatVariable() + ChatBox timeline instead.");
    
    const prefix = this.settings.store.chatboxPrefix || '';
    const suffix = this.settings.store.chatboxSuffix || '';
    const fullMessage = prefix + message + suffix;

    // VRChat chatbox has 144 character limit
    const truncated = fullMessage.substring(0, 144);

    return this.sendOSC('/chatbox/input', [truncated, immediate, false]);
  }

  /**
   * @deprecated Use storeChatVariable() with empty string instead
   * Clear ChatBox (deprecated - requires manual enablement)
   */
  clearChatBox(): boolean {
    if (!this.settings.store.enableDirectChatBox) {
      this.logger.showWarning("Direct ChatBox methods are disabled. Use storeChatVariable('', '') or enable in settings.");
      this.logger.warn("⚠️ clearChatBox() is deprecated. Use storeChatVariable() + ChatBox timeline instead.");
      return false;
    }

    this.logger.warn("⚠️ Using deprecated clearChatBox(). Consider using storeChatVariable('', '') instead.");
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

  /**
   * Fetch a chat timeline variable from VRCOSC
   * @param name - Variable name
   * @returns Variable value or null if not found
   */
  async fetchChatVariable(name: string): Promise<any> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return null;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('GET_VARIABLE', { name }, requestId);
      
      if (response?.success) {
        return response.value;
      } else {
        this.logger.warn(`Variable '${name}' not found: ${response?.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch variable '${name}': ${errorMsg}`);
      return null;
    }
  }

  /**
   * Store a ChatBox timeline variable in VRCOSC (recommended way)
   * Variables are automatically persisted and recreated on VRCOSC startup.
   * Use this in ChatBox timeline states with {vrcx_yourVariableName} syntax.
   * 
   * @param name - Variable name (will be prefixed with vrcx_ in ChatBox)
   * @param value - Variable value (string, number, or boolean)
   * @returns true if successful
   * 
   * @example
   * // Store a string variable
   * await oscBridge.storeChatVariable('plugin1_status', 'Active');
   * // Then use {vrcx_plugin1_status} in your ChatBox timeline
   * 
   * @example
   * // Store a counter
   * await oscBridge.storeChatVariable('friend_count', 42);
   * // Use {vrcx_friend_count} in ChatBox timeline
   */
  async storeChatVariable(name: string, value: any): Promise<boolean> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready - variable will be queued");
      return false;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('SET_VARIABLE', { name, value }, requestId);
      
      if (response?.success) {
        if (this.settings.store.logCommands) {
          this.logger.log(`✓ ChatBox variable 'vrcx_${name}' stored: ${JSON.stringify(value)}`);
        }
        return true;
      } else {
        this.logger.error(`Failed to store variable '${name}': ${response?.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to store variable '${name}': ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all ChatBox variables
   * @returns Object with variable information
   */
  async getChatVariables(): Promise<any> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return null;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('GET_VARIABLES', {}, requestId);
      
      if (response?.success) {
        return response.variables || [];
      } else {
        this.logger.error(`Failed to get variables: ${response?.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get variables: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Change to a ChatBox state (auto-creates if doesn't exist)
   * @param name - State name to switch to (will be prefixed with vrcx_)
   * @param displayName - Optional display name (only used if state doesn't exist yet)
   * @returns true if successful
   * 
   * @example
   * await oscBridge.setChatState('idle', 'Idle State');
   * await oscBridge.setChatState('idle'); // Switch to existing state
   */
  async setChatState(name: string, displayName?: string): Promise<boolean> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return false;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('SET_STATE', { name, displayName }, requestId);
      
      if (response?.success) {
        if (this.settings.store.logCommands) {
          this.logger.log(`✓ Changed to state 'vrcx_${name}'`);
        }
        return true;
      } else {
        this.logger.error(`Failed to set state '${name}': ${response?.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to set state '${name}': ${errorMsg}`);
      return false;
    }
  }

  /**
   * Trigger a ChatBox event (auto-creates if doesn't exist)
   * @param name - Event name to trigger (will be prefixed with vrcx_)
   * @param displayName - Optional display name (only used if event doesn't exist yet)
   * @returns true if successful
   * 
   * @example
   * await oscBridge.triggerChatEvent('friend_joined', 'Friend Joined');
   * await oscBridge.triggerChatEvent('friend_joined'); // Trigger existing event
   */
  async triggerChatEvent(name: string, displayName?: string): Promise<boolean> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return false;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('TRIGGER_EVENT', { name, displayName }, requestId);
      
      if (response?.success) {
        if (this.settings.store.logCommands) {
          this.logger.log(`✓ Triggered event 'vrcx_${name}'`);
        }
        return true;
      } else {
        this.logger.error(`Failed to trigger event '${name}': ${response?.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to trigger event '${name}': ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all ChatBox states
   * @returns Array of states with name, key, and displayName
   */
  async getChatStates(): Promise<any> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return null;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('GET_STATES', {}, requestId);
      
      if (response?.success) {
        return response.states || [];
      } else {
        this.logger.error(`Failed to get states: ${response?.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get states: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Get all ChatBox events
   * @returns Array of events with name, key, and displayName
   */
  async getChatEvents(): Promise<any> {
    if (!this.oscReady) {
      this.logger.warn("OSC app not ready");
      return null;
    }

    try {
      const requestId = this.generateRequestId();
      const response = await this.sendCommandToOSC('GET_EVENTS', {}, requestId);
      
      if (response?.success) {
        return response.events || [];
      } else {
        this.logger.error(`Failed to get events: ${response?.error || 'Unknown error'}`);
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get events: ${errorMsg}`);
      return null;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private pendingCommands: Map<string, { resolve: Function; reject: Function; timeout: number }> = new Map();

  private async sendCommandToOSC(command: string, args: any, requestId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(requestId);
        reject(new Error('Command timeout'));
      }, 5000);

      this.pendingCommands.set(requestId, { resolve, reject, timeout });

      this.sendIpcToOSC('COMMAND', {
        command,
        args,
        requestId
      });
    });
  }
}

(window as any).customjs.__LAST_PLUGIN_CLASS__ = OSCBridgePlugin;
