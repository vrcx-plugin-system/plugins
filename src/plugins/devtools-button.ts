// 
class DevToolsButtonPlugin extends CustomModule {
  navMenuApi: any;

  constructor() {
    super({
      name: "🔧 DevTools Button",
      description:
        "Adds a button to the navigation menu to open browser DevTools",
      authors: [        {
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }      ],
      tags: ["Utility", "Developer", "Button"],
      dependencies: ["nav-menu-api"],
    });

    this.navMenuApi = null;
  }

  async load() {
    this.logger.log("DevTools Button ready");
    this.loaded = true;
  }

  async start() {
    this.navMenuApi = await window.customjs.waitForModule(
      "nav-menu-api"
    );

    if (!this.navMenuApi) {
      this.logger.error("❌ Nav Menu API plugin not found after waiting");
      return;
    }

    this.navMenuApi.addItem("devtools", {
      label: "DevTools",
      icon: "ri-terminal-box-line",
      onClick: () => this.handleOpenDevTools(),
      after: "settings", // Place after the settings button
      // No content = button only, not a tab
    });

    this.enabled = true;
    this.started = true;
    this.logger.log("DevTools Button started");
  }

  async handleOpenDevTools() {
    try {
      if (!(window as any).AppApi?.ShowDevTools) {
        this.logger.showError("Cannot open DevTools: AppApi not available");
        return;
      }

      this.logger.log("Opening DevTools");
      await (window as any).AppApi.ShowDevTools();
      this.logger.showSuccess("DevTools opened");
    } catch (error: any) {
      this.logger.showError(`Error opening DevTools: ${error.message}`);
    }
  }

  async stop() {
    if (this.navMenuApi) {
      this.navMenuApi.removeItem("devtools");
    }

    await super.stop();
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = DevToolsButtonPlugin;
