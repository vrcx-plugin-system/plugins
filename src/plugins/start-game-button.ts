// @ts-nocheck
// TODO: Remove @ts-nocheck and fix type definitions properly

class StartGameButtonPlugin extends Plugin {
  navMenuApi: any;

  constructor() {
    super({
      name: "🎮 Start Game Button",
      description:
        "Adds a button to the navigation menu to start VRChat with VRCX settings",
      authors: [
      {
        name: "Bluscream",
      }
    ],
      build: "1760766085",
      tags: ["Utility", "Game", "Button"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/nav-menu-api.js",
      ],
    });

    this.navMenuApi = null;
  }

  async load() {
    const SettingType = window.customjs.SettingType;

    this.categories = this.defineSettingsCategories({
      launch: {
        name: "🎮 Launch Settings",
        description: "Configure how VRChat is launched",
      },
    });

    this.settings = this.defineSettings({
      confirmBeforeLaunch: {
        type: SettingType.BOOLEAN,
        description: "Ask for confirmation before launching VRChat",
        default: true,
        category: "launch",
      },
      desktopMode: {
        type: SettingType.BOOLEAN,
        description: "Launch in Desktop Mode (--no-vr)",
        default: false,
        category: "launch",
      },
      showNotifications: {
        type: SettingType.BOOLEAN,
        description: "Show notifications when launching game",
        default: true,
        category: "launch",
      },
    });

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
      if (!(window as any).AppApi?.StartGame) {
        this.logger.showError("Cannot start game: AppApi not available");
        return;
      }

      const launchArguments =
        (await this.getConfigValue("launchArguments")) || "";
      const vrcLaunchPathOverride =
        (await this.getConfigValue("vrcLaunchPathOverride")) || "";
      const desktopMode = this.settings.store.desktopMode;

      const args: string[] = [];
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

      let result: boolean;
      if (vrcLaunchPathOverride) {
        result = await (window as any).AppApi.StartGameFromPath(
          vrcLaunchPathOverride,
          argsString
        );
      } else {
        result = await (window as any).AppApi.StartGame(argsString);
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
    } catch (error: any) {
      this.logger.showError(`Error starting game: ${error.message}`);
    }
  }

  /**
   * Show confirmation dialog using Element Plus or fallback to native confirm
   * @param title - Dialog title
   * @param message - Dialog message
   * @returns True if confirmed, false if cancelled
   */
  async showConfirmDialog(title: string, message: string): Promise<boolean> {
    try {
      // Try Element Plus $confirm (Vue global properties)
      const $confirm = (window as any).$app?.config?.globalProperties?.$confirm;
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
    } catch (error: any) {
      this.logger.warn(`Error showing confirm dialog: ${error.message}`);
      // Fallback to native confirm on any error
      const fullMessage = `${title}\n\n${message}`;
      return confirm(fullMessage);
    }
  }

  /**
   * Helper to get config value from VRCX's config repository
   * @param key - Config key
   * @returns Config value or null
   */
  async getConfigValue(key: string): Promise<string | null> {
    try {
      // Try to use configRepository if available
      if ((window as any).configRepository?.getString) {
        return await (window as any).configRepository.getString(key);
      }

      // Fallback: try AppApi
      if ((window as any).AppApi?.GetConfigValue) {
        return await (window as any).AppApi.GetConfigValue(key);
      }

      this.logger.warn(`Cannot read config value: ${key}`);
      return null;
    } catch (error: any) {
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
