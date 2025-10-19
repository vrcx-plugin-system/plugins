// 
class RetryAutoLoginPlugin extends CustomModule {
  checkIntervalId: any;

  constructor() {
    super({
      name: "Retry Auto Login 🔑",
      description: "Automatically retries login with saved credentials if logged out",
      authors: [
        {
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }
      ],
      tags: ["Utility", "Automation", "Login"],
      required_dependencies: [],
    });

    this.checkIntervalId = null;

    this.actionButtons = [
      {
        title: "Retry Login Now",
        color: "primary",
        icon: "ri-login-circle-line",
        description: "Immediately retry login with saved credentials",
        callback: async () => {
          await this.attemptAutoLogin();
        },
      },
    ];
  }

  async load() {
    const SettingType = window.customjs.types.SettingType;

    this.settings = this.defineSettings({
      autoRetryOnStartup: {
        type: SettingType.BOOLEAN,
        description: "Retry login immediately on plugin startup if logged out",
        default: true,
      },
      autoRetryOnInterval: {
        type: SettingType.BOOLEAN,
        description: "Periodically check and retry login if disconnected",
        default: true,
      },
      checkInterval: {
        type: SettingType.TIMESPAN,
        description: "How often to check login status",
        default: 30000,
      },
      retryDelay: {
        type: SettingType.TIMESPAN,
        description: "Delay between retry attempts",
        default: 5000,
      },
      maxRetries: {
        type: SettingType.NUMBER,
        description: "Maximum retry attempts (0 = unlimited)",
        default: 0,
      },
      showNotifications: {
        type: SettingType.BOOLEAN,
        description: "Show notifications on login attempts",
        default: true,
      },
    });

    this.logger.log("Retry Auto Login plugin ready");
    this.loaded = true;
  }

  async start() {
    // Retry on startup if enabled
    if (this.settings.store.autoRetryOnStartup) {
      setTimeout(async () => {
        await this.checkAndRetryLogin();
      }, 2000);
    }

    // Start periodic check if enabled
    if (this.settings.store.autoRetryOnInterval) {
      this.startPeriodicCheck();
    }

    this.enabled = true;
    this.started = true;
    this.logger.log("Retry Auto Login plugin started");
  }

  async stop() {
    this.logger.log("Stopping Retry Auto Login plugin");

    // Clear interval
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    await super.stop();
  }

  startPeriodicCheck() {
    const interval = this.settings.store.checkInterval || 30000;

    this.checkIntervalId = this.registerTimer(
      setInterval(async () => {
        if (this.settings.store.autoRetryOnInterval) {
          await this.checkAndRetryLogin();
        }
      }, interval)
    );

    this.logger.log(`Started periodic login check (interval: ${interval}ms)`);
  }

  async checkAndRetryLogin() {
    try {
      // Check if already logged in
      const watchState = (window as any).watchState;
      if (!watchState) {
        return;
      }

      if (watchState.isLoggedIn) {
        return;
      }

      // Not logged in, attempt auto login
      this.logger.log("Not logged in, attempting auto login...");
      await this.attemptAutoLogin();
    } catch (error) {
      this.logger.error("Error in checkAndRetryLogin:", error);
    }
  }

  async attemptAutoLogin() {
    try {
      const authStore = window.$pinia?.auth;
      const watchState = (window as any).watchState;

      if (!authStore) {
        this.logger.error("Auth store not available");
        if (this.settings.store.showNotifications) {
          this.logger.showError("Cannot retry login: Auth store not found");
        }
        return false;
      }

      if (!watchState) {
        this.logger.error("watchState not available");
        return false;
      }

      // Check if already logged in
      if (watchState.isLoggedIn) {
        this.logger.log("Already logged in, no retry needed");
        if (this.settings.store.showNotifications) {
          this.logger.showInfo("Already logged in");
        }
        return true;
      }

      // Check if already attempting auto login
      if (authStore.attemptingAutoLogin) {
        this.logger.log("Auto login already in progress");
        return false;
      }

      // Get saved credentials
      const savedCredentials = authStore.loginForm?.savedCredentials || {};
      const lastUserLoggedIn = authStore.loginForm?.lastUserLoggedIn;

      if (!lastUserLoggedIn) {
        this.logger.log("No last user saved, cannot auto login");
        if (this.settings.store.showNotifications) {
          this.logger.showWarning("No saved login credentials found");
        }
        return false;
      }

      const userCredentials = savedCredentials[lastUserLoggedIn];
      if (!userCredentials) {
        this.logger.log(`No credentials found for user: ${lastUserLoggedIn}`);
        if (this.settings.store.showNotifications) {
          this.logger.showWarning("Saved credentials not found");
        }
        return false;
      }

      // Check max retries
      const maxRetries = this.settings.store.maxRetries || 0;
      if (maxRetries > 0) {
        const currentAttempts = authStore.autoLoginAttempts?.size || 0;
        if (currentAttempts >= maxRetries) {
          this.logger.log(`Max retry attempts reached (${maxRetries})`);
          if (this.settings.store.showNotifications) {
            this.logger.showWarning(`Max login retry attempts reached (${maxRetries})`);
          }
          return false;
        }
      }

      // Attempt login
      this.logger.log(`Attempting auto login for user: ${userCredentials.user?.displayName || lastUserLoggedIn}`);
      
      if (this.settings.store.showNotifications) {
        this.logger.showInfo(`Retrying login as ${userCredentials.user?.displayName || 'saved user'}...`);
      }

      // Check if relogin function exists
      if (typeof authStore.relogin !== 'function') {
        this.logger.error("authStore.relogin function not found");
        if (this.settings.store.showNotifications) {
          this.logger.showError("Login system not available");
        }
        return false;
      }

      // Add delay before retry if configured
      const retryDelay = this.settings.store.retryDelay || 0;
      if (retryDelay > 0) {
        this.logger.log(`Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      // Call relogin
      authStore.attemptingAutoLogin = true;
      await authStore.relogin(userCredentials);

      this.logger.log("Auto login request sent");
      return true;
    } catch (error: any) {
      this.logger.error("Error attempting auto login:", error);
      if (this.settings.store.showNotifications) {
        this.logger.showError(`Login retry failed: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Check current login status
   */
  isLoggedIn(): boolean {
    const watchState = (window as any).watchState;
    return watchState?.isLoggedIn || false;
  }

  /**
   * Get saved credentials info
   */
  getSavedCredentialsInfo(): { hasCredentials: boolean; lastUser: string | null; userCount: number } {
    const authStore = window.$pinia?.auth;
    const savedCredentials = authStore?.loginForm?.savedCredentials || {};
    const lastUserLoggedIn = authStore?.loginForm?.lastUserLoggedIn || null;

    return {
      hasCredentials: Object.keys(savedCredentials).length > 0,
      lastUser: lastUserLoggedIn,
      userCount: Object.keys(savedCredentials).length,
    };
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = RetryAutoLoginPlugin;
