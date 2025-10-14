class StartGameButtonPlugin extends Plugin {
  constructor() {
    super({
      name: "Start Game Button",
      description:
        "Adds a button to the navigation menu to start VRChat with VRCX settings",
      author: "Bluscream",
      version: "1.0.0",
      build: Math.floor(Date.now() / 1000).toString(),
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/nav-menu-api.js",
      ],
    });

    this.navMenuApi = null;
    this.settings = this.defineSettings({
      desktopMode: {
        type: window.customjs.SettingType.BOOLEAN,
        description: "Launch in Desktop Mode (--no-vr)",
        default: false,
        category: "launch",
      },
      showNotifications: {
        type: window.customjs.SettingType.BOOLEAN,
        description: "Show notifications when launching game",
        default: true,
        category: "launch",
      },
    });

    this.categories = {
      launch: {
        name: "Launch Settings",
        description: "Configure how VRChat is launched",
      },
    };
  }

  async load() {
    this.logger.log("Start Game Button ready");
    this.loaded = true;
  }

  async start() {
    this.logger.log("🚀 Starting Start Game Button...");

    // Wait for nav-menu-api dependency
    this.logger.log("⏳ Waiting for nav-menu-api plugin...");
    this.navMenuApi = await window.customjs.pluginManager.waitForPlugin(
      "nav-menu-api"
    );

    if (!this.navMenuApi) {
      this.logger.error("❌ Nav Menu API plugin not found after waiting");
      return;
    }
    this.logger.log("✅ nav-menu-api plugin found!");

    // Add button to navigation menu
    this.logger.log("🎯 Adding start game button to nav menu...");
    this.navMenuApi.addItem("start-game", {
      label: "Start Game",
      icon: "ri-play-circle-line",
      onClick: () => this.handleStartGame(),
      before: "settings",
      // No content = button only, not a tab
    });

    this.enabled = true;
    this.started = true;
    this.logger.log("✅ Start Game Button plugin started successfully");
  }

  async handleStartGame() {
    this.logger.log("🎮 Start Game button clicked");

    try {
      // Check if AppApi is available
      if (!window.AppApi?.StartGame) {
        this.logger.error("AppApi.StartGame not available");
        this.logger.showError("Cannot start game: AppApi not available");
        return;
      }

      // Get launch settings from VRCX config
      this.logger.log("📋 Reading launch settings...");

      const launchArguments =
        (await this.getConfigValue("launchArguments")) || "";
      const vrcLaunchPathOverride =
        (await this.getConfigValue("vrcLaunchPathOverride")) || "";
      const desktopMode = this.settings.store.desktopMode;

      this.logger.log(`Launch arguments: "${launchArguments}"`);
      this.logger.log(`Desktop mode: ${desktopMode}`);
      this.logger.log(`Custom path: "${vrcLaunchPathOverride}"`);

      // Build arguments array
      const args = [];

      if (launchArguments) {
        args.push(launchArguments);
      }

      if (desktopMode) {
        args.push("--no-vr");
      }

      const argsString = args.join(" ");
      this.logger.log(`🚀 Starting VRChat with args: "${argsString}"`);

      // Show notification
      if (this.settings.store.showNotifications) {
        this.logger.showInfo("Starting VRChat...");
      }

      // Start the game
      let result;
      if (vrcLaunchPathOverride) {
        this.logger.log("Using custom launch path");
        result = await window.AppApi.StartGameFromPath(
          vrcLaunchPathOverride,
          argsString
        );
      } else {
        this.logger.log("Using default Steam launch");
        result = await window.AppApi.StartGame(argsString);
      }

      if (result) {
        this.logger.log("✅ VRChat launched successfully");
        if (this.settings.store.showNotifications) {
          this.logger.showSuccess("VRChat launched");
        }
      } else {
        this.logger.error("❌ Failed to launch VRChat");
        this.logger.showError(
          vrcLaunchPathOverride
            ? "Failed to launch VRChat, invalid custom path set"
            : "Failed to find VRChat, set a custom path in launch options"
        );
      }
    } catch (error) {
      this.logger.error("❌ Error starting game:", error);
      this.logger.showError(`Error starting game: ${error.message}`);
    }
  }

  /**
   * Helper to get config value from VRCX's config repository
   * @param {string} key - Config key
   * @returns {Promise<string|null>}
   */
  async getConfigValue(key) {
    try {
      // Try to use configRepository if available
      if (window.configRepository?.getString) {
        return await window.configRepository.getString(key);
      }

      // Fallback: try AppApi
      if (window.AppApi?.GetConfigValue) {
        return await window.AppApi.GetConfigValue(key);
      }

      this.logger.warn(`Cannot read config value: ${key}`);
      return null;
    } catch (error) {
      this.logger.warn(`Error reading config value ${key}:`, error);
      return null;
    }
  }

  async stop() {
    this.logger.log("Stopping Start Game Button");

    if (this.navMenuApi) {
      this.navMenuApi.removeItem("start-game");
    }

    await super.stop();
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = StartGameButtonPlugin;
