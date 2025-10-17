/**
 * API Retry Patch Plugin
 * Patches VRChat API request methods to add automatic retry logic for transient errors
 *
 * Features:
 * - Automatically retries failed API requests for SSL errors, timeouts, and network failures
 * - Exponential backoff with jitter to prevent thundering herd
 * - Configurable retry attempts and delays
 * - Smart detection of retryable vs non-retryable errors
 *
 * Configuration:
 * - maxRetries: Maximum number of retry attempts (default: 3)
 * - baseDelay: Base delay in milliseconds between retries (default: 1000)
 * - maxDelay: Maximum delay in milliseconds (default: 10000)
 * - useJitter: Add random jitter to delays (default: true)
 */
class ApiRetryPatchPlugin extends Plugin {
  constructor() {
    super({
      name: "🔄 API Retry Patch",
      description:
        "Automatically retries failed API requests for transient network errors",
      author: "Bluscream",
      build: "1729018400",
      tags: ["Network", "API", "Utility", "Patch", "Fix"],
      dependencies: [],
    });

    // Track original methods
    this.originalMethods = new Map();
    this.retryStats = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
    };
  }

  async load() {
    const SettingType = window.customjs.SettingType;

    this.settings = this.defineSettings({
      maxRetries: {
        type: SettingType.NUMBER,
        description: "Maximum number of retry attempts",
        default: 3,
        min: 1,
        max: 10,
      },
      baseDelay: {
        type: SettingType.NUMBER,
        description: "Base delay between retries (ms)",
        default: 1000,
        min: 100,
        max: 5000,
      },
      maxDelay: {
        type: SettingType.NUMBER,
        description: "Maximum delay between retries (ms)",
        default: 10000,
        min: 1000,
        max: 60000,
      },
      useJitter: {
        type: SettingType.BOOLEAN,
        description: "Add random jitter to retry delays",
        default: true,
      },
      retryOnSSLErrors: {
        type: SettingType.BOOLEAN,
        description: "Retry on SSL connection errors",
        default: true,
      },
      retryOnTimeouts: {
        type: SettingType.BOOLEAN,
        description: "Retry on timeout errors",
        default: true,
      },
      retryOn5xx: {
        type: SettingType.BOOLEAN,
        description: "Retry on 5xx server errors",
        default: true,
      },
      retryOn429: {
        type: SettingType.BOOLEAN,
        description: "Retry on 429 rate limit errors",
        default: true,
      },
    });

    this.logger.log("API Retry Patch plugin loaded");
    this.loaded = true;
  }

  async start() {
    // Patch API request methods
    this.patchApiMethods();

    this.enabled = true;
    this.started = true;
    this.logger.log("API Retry Patch plugin started");
    this.logger.showSuccess("API retry mechanism enabled");
  }

  async stop() {
    this.logger.log("Stopping API Retry Patch plugin");

    // Restore original methods
    this.restoreOriginalMethods();

    // Log final stats
    this.logger.log(
      `Retry stats - Total: ${this.retryStats.totalRetries}, ` +
        `Successful: ${this.retryStats.successfulRetries}, ` +
        `Failed: ${this.retryStats.failedRetries}`
    );

    await super.stop();
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    const settings = this.settings.store;
    const errorMsg = error?.message || String(error);
    const status = error?.status || 0;

    // SSL connection errors
    if (settings.retryOnSSLErrors) {
      if (
        errorMsg.includes("SSL connection could not be established") ||
        errorMsg.includes("ECONNRESET") ||
        errorMsg.includes("ETIMEDOUT") ||
        errorMsg.includes("ENOTFOUND") ||
        errorMsg.includes("EHOSTUNREACH") ||
        errorMsg.includes("ENETUNREACH") ||
        errorMsg.includes("certificate")
      ) {
        return true;
      }
    }

    // Timeout errors
    if (settings.retryOnTimeouts) {
      if (
        errorMsg.includes("timeout") ||
        errorMsg.includes("timed out") ||
        status === 408
      ) {
        return true;
      }
    }

    // 5xx server errors
    if (settings.retryOn5xx) {
      if (status >= 500 && status < 600) {
        return true;
      }
    }

    // 429 rate limit
    if (settings.retryOn429 && status === 429) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   */
  calculateDelay(attempt) {
    const settings = this.settings.store;
    const baseDelay = settings.baseDelay || 1000;
    const maxDelay = settings.maxDelay || 10000;
    const useJitter = settings.useJitter !== false;

    // Exponential backoff: baseDelay * (2 ^ attempt)
    let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter (randomness) to prevent thundering herd
    if (useJitter) {
      const jitter = Math.random() * 0.3 * delay; // ±30% jitter
      delay = delay + jitter - 0.15 * delay;
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wrap a function with retry logic
   */
  wrapWithRetry(originalFunc, funcName) {
    const self = this;

    return async function wrappedWithRetry(...args) {
      const maxRetries = self.settings.store.maxRetries || 3;
      let lastError = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Call the original function
          const result = await originalFunc.apply(this, args);

          // Success - log if this was a retry
          if (attempt > 0) {
            self.retryStats.successfulRetries++;
            self.logger.log(
              `✓ Retry successful for ${funcName} after ${attempt} attempt(s)`
            );
          }

          return result;
        } catch (error) {
          lastError = error;

          // Check if we should retry
          const isRetryable = self.isRetryableError(error);
          const isLastAttempt = attempt >= maxRetries;

          if (!isRetryable || isLastAttempt) {
            // Don't retry, throw the error
            if (attempt > 0) {
              self.retryStats.failedRetries++;
            }
            throw error;
          }

          // Log retry attempt
          self.retryStats.totalRetries++;
          const delay = self.calculateDelay(attempt);
          const errorMsg = error?.message || String(error);
          const shortError =
            errorMsg.length > 100
              ? errorMsg.substring(0, 100) + "..."
              : errorMsg;

          self.logger.log(
            `⟳ Retry attempt ${attempt + 1}/${maxRetries} for ${funcName} ` +
              `(${shortError}) - waiting ${delay}ms`
          );

          // Wait before retrying
          await self.sleep(delay);
        }
      }

      // Should never reach here, but just in case
      throw lastError;
    };
  }

  // ============================================================================
  // METHOD PATCHING
  // ============================================================================

  /**
   * Patch API request methods with retry logic
   */
  patchApiMethods() {
    try {
      const apiRequests = window.request;
      if (!apiRequests) {
        this.logger.error("window.request not found, cannot patch API methods");
        return;
      }

      // Methods to patch - comprehensive list of API methods
      const methodsToPatch = [
        // Auth methods
        { obj: apiRequests.authRequest, name: "🔄 verifyOTP" },
        { obj: apiRequests.authRequest, name: "🔄 verifyTOTP" },
        { obj: apiRequests.authRequest, name: "🔄 verifyEmailOTP" },
        { obj: apiRequests.authRequest, name: "🔄 getConfig" },

        // User methods
        { obj: apiRequests.userRequest, name: "🔄 getUser" },
        { obj: apiRequests.userRequest, name: "🔄 getCachedUser" },
        { obj: apiRequests.userRequest, name: "🔄 getUsers" },
        { obj: apiRequests.userRequest, name: "🔄 saveCurrentUser" },
        { obj: apiRequests.userRequest, name: "🔄 getCurrentUser" },

        // World methods
        { obj: apiRequests.worldRequest, name: "🔄 getWorld" },
        { obj: apiRequests.worldRequest, name: "🔄 getCachedWorld" },
        { obj: apiRequests.worldRequest, name: "🔄 saveWorld" },

        // Instance methods
        { obj: apiRequests.instanceRequest, name: "🔄 getInstance" },
        { obj: apiRequests.instanceRequest, name: "🔄 getCachedInstance" },
        { obj: apiRequests.instanceRequest, name: "🔄 selfInvite" },
        { obj: apiRequests.instanceRequest, name: "🔄 createInstance" },

        // Friend methods
        { obj: apiRequests.friendRequest, name: "🔄 getFriends" },
        { obj: apiRequests.friendRequest, name: "🔄 sendFriendRequest" },
        { obj: apiRequests.friendRequest, name: "🔄 deleteFriend" },

        // Notification methods
        { obj: apiRequests.notificationRequest, name: "🔄 sendInvite" },
        { obj: apiRequests.notificationRequest, name: "🔄 sendRequestInvite" },
        { obj: apiRequests.notificationRequest, name: "🔄 getNotifications" },
        { obj: apiRequests.notificationRequest, name: "🔄 getNotificationsV2" },

        // Avatar methods
        { obj: apiRequests.avatarRequest, name: "🔄 getAvatar" },
        { obj: apiRequests.avatarRequest, name: "🔄 saveAvatar" },

        // Group methods
        { obj: apiRequests.groupRequest, name: "🔄 getGroup" },
        { obj: apiRequests.groupRequest, name: "🔄 getGroupMember" },
      ];

      let patchedCount = 0;

      for (const { obj, name } of methodsToPatch) {
        if (obj && typeof obj[name] === "function") {
          // Store original method
          const key = `${obj.constructor.name || "unknown"}.${name}`;
          this.originalMethods.set(key, obj[name]);

          // Patch with retry logic
          obj[name] = this.wrapWithRetry(obj[name], name);
          patchedCount++;

          this.logger.log(`Patched ${name} with retry logic`);
        }
      }

      this.logger.log(`Successfully patched ${patchedCount} API methods`);
    } catch (error) {
      this.logger.error(`Failed to patch API methods: ${error.message}`);
    }
  }

  /**
   * Restore original methods
   */
  restoreOriginalMethods() {
    try {
      const apiRequests = window.request;
      if (!apiRequests) return;

      for (const [key, originalMethod] of this.originalMethods.entries()) {
        const [objName, methodName] = key.split(".");

        // Find the object and restore the method
        const candidates = [
          apiRequests.authRequest,
          apiRequests.userRequest,
          apiRequests.worldRequest,
          apiRequests.instanceRequest,
          apiRequests.notificationRequest,
          apiRequests.friendRequest,
          apiRequests.avatarRequest,
          apiRequests.groupRequest,
        ];

        for (const obj of candidates) {
          if (obj && typeof obj[methodName] !== "undefined") {
            obj[methodName] = originalMethod;
            this.logger.log(`Restored ${methodName}`);
            break;
          }
        }
      }

      this.originalMethods.clear();
    } catch (error) {
      this.logger.error(`Failed to restore methods: ${error.message}`);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return { ...this.retryStats };
  }

  /**
   * Reset retry statistics
   */
  resetRetryStats() {
    this.retryStats = {
      totalRetries: 0,
      successfulRetries: 0,
      failedRetries: 0,
    };
    this.logger.log("Retry statistics reset");
  }

  /**
   * Wrap any async function with retry logic
   * @param {Function} func - Async function to wrap
   * @param {string} name - Name for logging
   * @returns {Function} Wrapped function with retry logic
   */
  wrapFunctionWithRetry(func, name = "custom") {
    return this.wrapWithRetry(func, name);
  }
}

// Export plugin class for PluginLoader
window.customjs.__LAST_PLUGIN_CLASS__ = ApiRetryPatchPlugin;
