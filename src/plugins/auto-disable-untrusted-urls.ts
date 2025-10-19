// 
class AutoDisableUntrustedURLsPlugin extends CustomModule {
  _lastGameRunning: boolean;

  constructor() {
    super({
      name: "Auto Disable Untrusted URLs 🛡️",
      description:
        "Automatically disables VRChat's untrusted URL feature for security (enables in private instances)",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["Security", "Automation"],
      required_dependencies: [],
    });

    // Track last game running state
    this._lastGameRunning = false;
  }

  async load() {
    const SettingType = window.customjs.types.SettingType;

    // Define settings
    this.settings = this.defineSettings({
      triggerOnVRCXStart: {
        type: SettingType.BOOLEAN,
        description: "Disable untrusted URLs when VRCX starts",
        default: true,
      },
      triggerOnGameStart: {
        type: SettingType.BOOLEAN,
        description: "Disable untrusted URLs when VRChat starts",
        default: true,
      },
      triggerOnPublicInstance: {
        type: SettingType.BOOLEAN,
        description: "Disable untrusted URLs when switching to public instance",
        default: true,
      },
      triggerOnPrivateInstance: {
        type: SettingType.BOOLEAN,
        description: "Enable untrusted URLs when switching to private instance",
        default: true,
      },
    });

    this.logger.log("Auto Disable Untrusted URLs plugin ready");
    this.loaded = true;
  }

  async start() {
    // Apply on VRCX startup
    if (this.settings.store.triggerOnVRCXStart) {
      await this.setUntrustedURLs(0, "VRCX_START"); // Disable on startup
    }

    // Setup game state monitoring
    this.setupGameStateMonitoring();

    // Setup instance monitoring
    this.setupInstanceMonitoring();

    this.enabled = true;
    this.started = true;
    this.logger.log("Auto Disable Untrusted URLs plugin started");
  }

  async stop() {
    this.logger.log("Stopping Auto Disable Untrusted URLs plugin");
    await super.stop();
  }

  setupGameStateMonitoring() {
    if (!this.settings.store.triggerOnGameStart) {
      return;
    }

    // Subscribe to game state changes
    this.subscribe("GAME", ({ isGameRunning }: any) => {
      // Check if game started (changed to true)
      if (isGameRunning && !this._lastGameRunning) {
        this.logger.log("Game started detected");
        this.setUntrustedURLs(0, "GAME_START"); // Disable on game start
      }

      // Track previous state
      this._lastGameRunning = isGameRunning;
    });
  }

  setupInstanceMonitoring() {
    if (
      !this.settings.store.triggerOnPublicInstance &&
      !this.settings.store.triggerOnPrivateInstance
    ) {
      return;
    }

    // Subscribe to location changes
    this.subscribe("LOCATION", ({ location }: any) => {
      if (!location?.location) return;

      const instanceType = this.getInstanceType(location.location);

      if (
        instanceType === "public" &&
        this.settings.store.triggerOnPublicInstance
      ) {
        this.logger.log("Switched to public instance");
        this.setUntrustedURLs(0, "INSTANCE_SWITCH_PUBLIC"); // Disable for public
      } else if (
        instanceType === "private" &&
        this.settings.store.triggerOnPrivateInstance
      ) {
        this.logger.log("Switched to private instance");
        this.setUntrustedURLs(1, "INSTANCE_SWITCH_PRIVATE"); // Enable for private
      }
    });
  }

  /**
   * Determine instance type from location string
   * @param location - VRChat location string
   * @returns Instance type (public, private, friends, etc.)
   */
  getInstanceType(location: string): string {
    if (!location) return "unknown";

    // Extract instance type from location string
    // Format: wrld_xxx:instance~region(instance_type)
    const match = location.match(/~(\w+)\(/);
    if (match) {
      return match[1].toLowerCase();
    }

    // If no instance type specified, it's usually public
    return "public";
  }

  /**
   * Set VRC_ALLOW_UNTRUSTED_URL registry setting
   * @param value - Value to set (0 = disabled, 1 = enabled)
   * @param trigger - What triggered this action
   */
  async setUntrustedURLs(value: number, trigger: string = "MANUAL") {
    try {
      const key = "VRC_ALLOW_UNTRUSTED_URL";
      const desiredValue = value;

      // Get current value
      const currentValue = await (window as any).AppApi.GetVRChatRegistryKey(key);

      // Skip if already set to desired value
      if (currentValue === desiredValue) {
        return;
      }

      const action = desiredValue === 0 ? "disabled" : "enabled";
      this.logger.log(
        `[${trigger}] ${key}: ${currentValue} → ${desiredValue} (${action})`
      );

      // Set registry value
      await (window as any).AppApi.SetVRChatRegistryKey(key, desiredValue, 3); // 3 = REG_DWORD
    } catch (error: any) {
      this.logger.error("Error setting untrusted URLs:", error);
    }
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = AutoDisableUntrustedURLsPlugin;
