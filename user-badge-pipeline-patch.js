/**
 * User Badge Pipeline Patch Plugin
 * Adds support for the 'user-badge-assigned' pipeline event type
 *
 * Fixes the error: "Unknown pipeline type {type: 'user-badge-assigned', content: {...}}"
 * This happens when VRChat sends badge assignment notifications that VRCX doesn't handle yet
 */
class UserBadgePipelinePatchPlugin extends Plugin {
  constructor() {
    super({
      name: "User Badge Pipeline Patch",
      description:
        "Adds support for user-badge-assigned pipeline events and displays badge notifications",
      author: "Bluscream",
      version: "1.0.0",
      build: "1729018400",
      tags: ["Bugfix", "Notifications"],
      dependencies: [],
    });

    this.patched = false;
    this.originalHandler = null;
  }

  async load() {
    this.logger.log("User Badge Pipeline Patch plugin loaded");
    this.loaded = true;
  }

  async start() {
    // Wait for stores to be available
    this.waitForStores();

    this.enabled = true;
    this.started = true;
    this.logger.log("User Badge Pipeline Patch plugin started");
  }

  async stop() {
    this.logger.log("Stopping User Badge Pipeline Patch plugin");

    await super.stop();
  }

  // ============================================================================
  // PATCHING LOGIC
  // ============================================================================

  /**
   * Wait for Pinia stores to be available, then patch
   */
  waitForStores() {
    const checkStores = () => {
      try {
        if (window.$pinia && window.$pinia._s) {
          // Stores are available, set up our custom pipeline handler
          this.setupPipelineHandler();
          this.logger.log("✓ Stores available, pipeline handler ready");
          return;
        }
      } catch (e) {
        // Stores not ready yet
      }

      // Try again in 500ms
      setTimeout(checkStores, 500);
    };

    checkStores();
  }

  /**
   * Set up a custom pipeline handler using console intercept
   */
  setupPipelineHandler() {
    try {
      // Intercept console.log to catch the "Unknown pipeline type" message
      // and handle user-badge-assigned events
      const originalConsoleLog = console.log;
      const self = this;

      console.log = function (...args) {
        // Check if this is the "Unknown pipeline type" message
        if (
          args.length >= 2 &&
          args[0] === "Unknown pipeline type" &&
          typeof args[1] === "object" &&
          args[1]?.type === "user-badge-assigned"
        ) {
          // Handle the badge assignment instead of logging unknown type
          self.handleBadgeAssignment(args[1]);
          return; // Don't log the error
        }

        // Pass through all other console.log calls
        return originalConsoleLog.apply(console, args);
      };

      this.originalHandler = originalConsoleLog;
      this.patched = true;

      this.logger.log("✓ Successfully patched console.log for pipeline events");
      this.logger.showSuccess(
        "User badge pipeline patch applied - badge notifications will now work!"
      );
    } catch (error) {
      this.logger.error(`Failed to patch pipeline handler: ${error.message}`);
    }
  }

  /**
   * Handle user-badge-assigned pipeline event
   */
  handleBadgeAssignment(pipelineData) {
    try {
      const { content } = pipelineData;

      if (!content || !content.badge) {
        this.logger.warn("Badge assignment event missing badge data");
        return;
      }

      const badge = content.badge;

      // Log the badge assignment
      this.logger.log(`🏅 Badge Earned: ${badge.badgeName || "Unknown Badge"}`);
      console.log("user-badge-assigned", content);

      // Get stores
      const notificationStore = window.$pinia._s.get("Notification");
      const sharedFeedStore = window.$pinia._s.get("SharedFeed");
      const uiStore = window.$pinia._s.get("Ui");

      if (!notificationStore || !sharedFeedStore || !uiStore) {
        this.logger.warn(
          "Stores not available, showing basic notification instead"
        );
        this.showBasicNotification(badge);
        return;
      }

      // Create a notification entry
      const badgeNoty = {
        type: "user.badge.assigned",
        badgeId: badge.badgeId,
        badgeName: badge.badgeName,
        badgeDescription: badge.badgeDescription,
        badgeImageUrl: badge.badgeImageUrl,
        message: `Badge Earned: ${badge.badgeName}`,
        created_at: new Date().toJSON(),
      };

      // Check if notification filtering allows this type
      const filters = notificationStore.notificationTable?.filters?.[0]?.value;
      if (
        !filters ||
        filters.length === 0 ||
        filters.includes(badgeNoty.type)
      ) {
        uiStore.notifyMenu("notification");
      }

      // Add to notification queue
      if (typeof notificationStore.queueNotificationNoty === "function") {
        notificationStore.queueNotificationNoty(badgeNoty);
      }

      // Add to notification table
      if (notificationStore.notificationTable?.data) {
        notificationStore.notificationTable.data.push(badgeNoty);
      }

      // Update shared feed
      if (typeof sharedFeedStore.updateSharedFeed === "function") {
        sharedFeedStore.updateSharedFeed(true);
      }

      // Show a nice notification
      this.logger.showSuccess(
        `🏅 Badge Earned: ${badge.badgeName}`,
        badge.badgeDescription
      );
    } catch (error) {
      this.logger.error(`Error handling badge assignment: ${error.message}`);
      console.error(error);
    }
  }

  /**
   * Show a basic notification if stores aren't available
   */
  showBasicNotification(badge) {
    try {
      this.logger.showInfo(
        `🏅 Badge Earned: ${badge.badgeName}`,
        badge.badgeDescription
      );
    } catch (error) {
      this.logger.error(`Failed to show notification: ${error.message}`);
    }
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Restore original console.log when plugin stops
   */
  async stop() {
    if (this.patched && this.originalHandler) {
      try {
        console.log = this.originalHandler;
        this.patched = false;
        this.originalHandler = null;
        this.logger.log("Restored original console.log");
      } catch (error) {
        this.logger.error(`Failed to restore console.log: ${error.message}`);
      }
    }

    await super.stop();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Check if the patch is currently applied
   */
  isPatchApplied() {
    return this.patched;
  }

  /**
   * Get statistics about handled badge events
   */
  getStats() {
    return {
      patched: this.patched,
      enabled: this.enabled,
      started: this.started,
    };
  }
}

// Export plugin class for PluginLoader
window.customjs.__LAST_PLUGIN_CLASS__ = UserBadgePipelinePatchPlugin;
