class StartGameButtonPlugin extends Plugin {
  constructor() {
    super({
      name: "Start Game Button",
      description:
        "Adds a button to the navigation menu to start VRChat with VRCX settings",
      author: "Bluscream",
      version: "1.1.0",
      build: "1729018400",
      tags: ["Utility", "Game", "Button"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/nav-menu-api.js",
      ],
    });

    this.navMenuApi = null;
    this.settings = this.defineSettings({
      confirmBeforeLaunch: {
        type: window.customjs.SettingType.BOOLEAN,
        description: "Ask for confirmation before launching VRChat",
        default: true,
        category: "launch",
      },
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
    this.navMenuApi = await window.customjs.pluginManager.waitForPlugin(
      "nav-menu-api"
    );

    if (!this.navMenuApi) {
      this.logger.error("❌ Nav Menu API plugin not found after waiting");
      return;
    }

    this.navMenuApi.addItem("start-game", {
      label: "Start Game",
      icon: "ri-play-circle-line",
      onClick: () => this.handleStartGame(),
      position: 0, // Insert at the top (first position)
      // No content = button only, not a tab
    });

    this.enabled = true;
    this.started = true;
  }

  async handleStartGame() {
    try {
      if (!window.AppApi?.StartGame) {
        this.logger.showError("Cannot start game: AppApi not available");
        return;
      }

      const launchArguments =
        (await this.getConfigValue("launchArguments")) || "";
      const vrcLaunchPathOverride =
        (await this.getConfigValue("vrcLaunchPathOverride")) || "";
      const desktopMode = this.settings.store.desktopMode;

      const args = [];
      if (launchArguments) {
        args.push(launchArguments);
      }
      if (desktopMode) {
        args.push("--no-vr");
      }

      const argsString = args.join(" ");

      // Ask for confirmation if enabled
      if (this.settings.store.confirmBeforeLaunch) {
        const mode = desktopMode ? "Desktop Mode" : "VR Mode";
        const path = vrcLaunchPathOverride || "default location";
        const argsText = argsString ? `Arguments: ${argsString}` : "";

        const confirmed = await this.showConfirmDialog(
          `Launch VRChat in ${mode}?`,
          `Path: ${path}${argsText ? "\n" + argsText : ""}`
        );

        if (!confirmed) {
          this.logger.log("Launch cancelled by user");
          return;
        }
      }

      if (this.settings.store.showNotifications) {
        this.logger.showInfo("Starting VRChat...");
      }

      let result;
      if (vrcLaunchPathOverride) {
        result = await window.AppApi.StartGameFromPath(
          vrcLaunchPathOverride,
          argsString
        );
      } else {
        result = await window.AppApi.StartGame(argsString);
      }

      if (result) {
        if (this.settings.store.showNotifications) {
          this.logger.showSuccess("VRChat launched");
        }
      } else {
        this.logger.showError(
          vrcLaunchPathOverride
            ? "Failed to launch VRChat, invalid custom path set"
            : "Failed to find VRChat, set a custom path in launch options"
        );
      }
    } catch (error) {
      this.logger.showError(`Error starting game: ${error.message}`);
    }
  }

  /**
   * Show confirmation dialog using Element Plus or fallback to native confirm
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @returns {Promise<boolean>} True if confirmed, false if cancelled
   */
  async showConfirmDialog(title, message) {
    try {
      // Try Element Plus $confirm (Vue global properties)
      const $confirm = window.$app?.config?.globalProperties?.$confirm;
      if ($confirm) {
        try {
          await $confirm(message, title, {
            confirmButtonText: "Launch",
            cancelButtonText: "Cancel",
            type: "info",
          });
          return true; // User confirmed
        } catch (error) {
          // User cancelled or closed dialog
          return false;
        }
      }

      // Fallback to native browser confirm
      this.logger.log(
        "Using native confirm dialog (Element Plus not available)"
      );
      const fullMessage = `${title}\n\n${message}`;
      return confirm(fullMessage);
    } catch (error) {
      this.logger.warn(`Error showing confirm dialog: ${error.message}`);
      // Fallback to native confirm on any error
      const fullMessage = `${title}\n\n${message}`;
      return confirm(fullMessage);
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
    if (this.navMenuApi) {
      this.navMenuApi.removeItem("start-game");
    }

    await super.stop();
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = StartGameButtonPlugin;
