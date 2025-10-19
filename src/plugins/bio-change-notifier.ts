// 
class BioChangeNotifierPlugin extends CustomModule {
  constructor() {
    super({
      name: "🔔 Bio Change Notifier",
      description:
        "Get notified when friends change their bio with a detailed diff view",
      authors: [
        {
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }
      ],
      tags: ["Notifications", "Social"],
      dependencies: [],
    });

    this.feedStore = null;
  }

  /**
   * Define custom action buttons for the plugin manager UI
   * @returns {Array} Array of button definitions
   */
  getActionButtons() {
    return [
      {
        label: "Open Bio Feed",
        color: "primary",
        icon: "ri-file-list-3-line",
        title: "Open feed filtered by bio changes with entries expanded",
        callback: async () => {
          await this.openBioFeed();
        },
      },
    ];
  }

  async load() {
    // Define settings using new Equicord-style system
    const SettingType = window.customjs.types.SettingType;

    // Define category metadata
    this.categories = this.defineSettingsCategories({
      notifications: {
        name: "🔔 Notification Settings",
        description: "Control when and how bio change notifications appear",
      },
      filters: {
        name: "🔍 Filter Settings",
        description: "Filter which bio changes trigger notifications",
      },
      display: {
        name: "🎨 Display Settings",
        description: "Customize how bio changes are displayed",
      },
    });

    this.settings = this.defineSettings({
      enabled: {
        type: SettingType.BOOLEAN,
        description: "Enable bio change notifications",
        category: "notifications",
        default: true,
      },
      notifyFriendsOnly: {
        type: SettingType.BOOLEAN,
        description: "Only notify for friends (not all users)",
        category: "filters",
        default: true,
      },
      notifyVIPOnly: {
        type: SettingType.BOOLEAN,
        description: "Only notify for VIP/favorite users",
        category: "filters",
        default: false,
      },
      showDesktopNotification: {
        type: SettingType.BOOLEAN,
        description: "Show desktop toast notification",
        category: "notifications",
        default: true,
      },
      showVRNotification: {
        type: SettingType.BOOLEAN,
        description: "Show VR overlay notification",
        category: "notifications",
        default: true,
      },
      maxDiffLines: {
        type: SettingType.NUMBER,
        description: "Maximum number of diff lines to show in notification (0 = show all)",
        category: "display",
        default: 5,
      },
      ignoreEmptyBio: {
        type: SettingType.BOOLEAN,
        description: "Don't notify when bio becomes empty",
        category: "filters",
        default: true,
      },
      minBioLength: {
        type: SettingType.NUMBER,
        description: "Minimum bio length to trigger notification (0 = no minimum)",
        category: "filters",
        default: 0,
      },
    });

    this.logger.log("Bio Change Notifier settings loaded");
    this.loaded = true;
  }

  async start() {
    this.enabled = true;

    // Access feed store from pinia
    if (window.$pinia) {
      this.feedStore = window.$pinia.feed;
    }

    // Hook into the feed store's addFeed method to intercept bio changes
    this.registerPostHook("$pinia.feed.addFeed", (result, args) => {
      const feed = args[0];
      if (feed && feed.type === "Bio") {
        this.handleBioChange(feed);
      }
    });

    // Hook into VRCX's playNotyTTS to add Bio support
    this.registerVoidHook("$pinia.notification.playNotyTTS", (args) => {
      const [noty, displayName, message] = args;
      if (noty.type === 'Bio' && window.$pinia?.notification?.state?.notificationsSettingsStore) {
        const settingsStore = window.$pinia.notification.state.notificationsSettingsStore;
        if (settingsStore?.speak) {
          settingsStore.speak(`${displayName} changed their bio`);
        }
      }
    });

    // Hook into desktop notifications to add Bio support
    this.registerVoidHook("$pinia.notification.displayDesktopToast", (args) => {
      const [noty, message, image] = args;
      if (noty.type === 'Bio') {
        this.displayBioDesktopNotification(noty, message, image);
      }
    });

    // Hook into XS notifications to add Bio support
    this.registerVoidHook("$pinia.notification.displayXSNotification", (args) => {
      const [noty, message, image] = args;
      if (noty.type === 'Bio' && window.AppApi?.XSNotification) {
        this.displayBioXSNotification(noty, message, image);
      }
    });

    // Hook into OVRT notifications to add Bio support
    this.registerVoidHook("$pinia.notification.displayOvrtNotification", (args) => {
      const [playOvrtHudNotifications, playOvrtWristNotifications, noty, message, image] = args;
      if (noty.type === 'Bio' && window.AppApi?.OVRTNotification) {
        this.displayBioOvrtNotification(playOvrtHudNotifications, playOvrtWristNotifications, noty, message, image);
      }
    });

    this.started = true;
    this.logger.log("Bio Change Notifier started");
  }

  async stop() {
    this.logger.log("Stopping Bio Change Notifier");
    await super.stop(); // This will clean up all hooks automatically
  }

  /**
   * Handle bio change event
   * @param {Object} feed - Feed entry containing bio change data
   */
  async handleBioChange(feed) {
    try {
      if (!this.settings.store.enabled) {
        return;
      }

      // Apply filters
      if (!this.shouldNotify(feed)) {
        return;
      }

      // Generate notification
      await this.sendBioChangeNotification(feed);
    } catch (error) {
      this.logger.error(`Error handling bio change: ${error.message}`);
    }
  }

  /**
   * Check if we should notify for this bio change
   * @param {Object} feed - Feed entry
   * @returns {boolean}
   */
  shouldNotify(feed) {
    const friendStore = window.$pinia?.friend;
    const favoriteStore = window.$pinia?.favorite;

    // Check VIP filter
    if (this.settings.store.notifyVIPOnly) {
      if (!favoriteStore?.localFavoriteFriends?.has(feed.userId)) {
        return false;
      }
    }

    // Check friends filter
    if (this.settings.store.notifyFriendsOnly) {
      if (!friendStore?.friends?.has(feed.userId)) {
        return false;
      }
    }

    // Check empty bio filter
    if (this.settings.store.ignoreEmptyBio) {
      if (!feed.bio || feed.bio.trim().length === 0) {
        return false;
      }
    }

    // Check minimum bio length
    if (this.settings.store.minBioLength > 0) {
      if (!feed.bio || feed.bio.length < this.settings.store.minBioLength) {
        return false;
      }
    }

    return true;
  }

  /**
   * Send bio change notification
   * @param {Object} feed - Feed entry containing bio change
   */
  async sendBioChangeNotification(feed) {
    const userName = feed.displayName || "Unknown User";
    const oldBio = feed.previousBio || "";
    const newBio = feed.bio || "";

    // Generate diff text
    const diffText = this.generateBioDiff(oldBio, newBio);

    // Create notification payload
    const noty = {
      type: "Bio",
      displayName: userName,
      userId: feed.userId,
      bio: newBio,
      previousBio: oldBio,
      created_at: feed.created_at || new Date().toJSON(),
      message: diffText,
    };

    // Send to notification system using VRCX's playNoty
    if (window.$pinia?.notification?.playNoty) {
      // Check user settings for desktop/VR notifications
      if (this.settings.store.showDesktopNotification || this.settings.store.showVRNotification) {
        // Temporarily override notification settings if needed
        const notificationStore = window.$pinia.notification;
        const originalSettings = {};

        try {
          // Queue the notification through VRCX's system
          this.queueBioNoty(noty);
        } catch (error) {
          this.logger.error(`Error sending notification: ${error.message}`);
        }
      }
    }

    this.logger.log(`Bio change notification sent for ${userName}`);
  }

  /**
   * Queue bio notification through VRCX notification system
   * @param {Object} noty - Notification object
   */
  queueBioNoty(noty) {
    const friendStore = window.$pinia?.friend;
    
    noty.isFriend = friendStore?.friends?.has(noty.userId) || false;
    noty.isFavorite = friendStore?.localFavoriteFriends?.has(noty.userId) || false;

    // Call VRCX's playNoty directly
    if (window.$pinia?.notification?.playNoty) {
      window.$pinia.notification.playNoty(noty);
    }
  }

  /**
   * Generate human-readable bio diff
   * @param {string} oldBio - Previous bio
   * @param {string} newBio - New bio
   * @returns {string} Formatted diff text
   */
  generateBioDiff(oldBio, newBio) {
    const maxLines = this.settings.store.maxDiffLines;
    
    // Simple line-by-line diff
    const oldLines = oldBio.split('\n');
    const newLines = newBio.split('\n');
    
    const diffLines = [];
    const maxCompareLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxCompareLines; i++) {
      const oldLine = oldLines[i] || "";
      const newLine = newLines[i] || "";
      
      if (oldLine !== newLine) {
        if (oldLine && newLine) {
          diffLines.push(`${oldLine} → ${newLine}`);
        } else if (oldLine) {
          diffLines.push(`- ${oldLine}`);
        } else if (newLine) {
          diffLines.push(`+ ${newLine}`);
        }
      }
    }
    
    // Limit number of lines if configured
    if (maxLines > 0 && diffLines.length > maxLines) {
      const truncated = diffLines.slice(0, maxLines);
      truncated.push(`... (${diffLines.length - maxLines} more changes)`);
      return truncated.join('\n');
    }
    
    return diffLines.length > 0 ? diffLines.join('\n') : "Bio changed";
  }

  /**
   * Format bio diff using VRCX's formatDifference algorithm
   * @param {string} oldBio - Previous bio
   * @param {string} newBio - New bio
   * @returns {string} HTML formatted diff
   */
  formatDifference(oldBio, newBio) {
    const markerAddition = '<span class="x-text-added">{{text}}</span>';
    const markerDeletion = '<span class="x-text-removed">{{text}}</span>';

    [oldBio, newBio] = [oldBio, newBio].map((s) =>
      s
        .replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;')
        .replaceAll(/"/g, '&quot;')
        .replaceAll(/'/g, '&#039;')
        .replaceAll(/\n/g, '<br>')
    );

    const oldWords = oldBio.split(/\s+/).flatMap((word) => word.split(/(<br>)/));
    const newWords = newBio.split(/\s+/).flatMap((word) => word.split(/(<br>)/));

    const findLongestMatch = (oldStart, oldEnd, newStart, newEnd) => {
      let bestOldStart = oldStart;
      let bestNewStart = newStart;
      let bestSize = 0;

      const lookup = new Map();
      for (let i = oldStart; i < oldEnd; i++) {
        const word = oldWords[i];
        if (!lookup.has(word)) lookup.set(word, []);
        lookup.get(word).push(i);
      }

      for (let j = newStart; j < newEnd; j++) {
        const word = newWords[j];
        if (!lookup.has(word)) continue;

        for (const i of lookup.get(word)) {
          let size = 0;
          while (i + size < oldEnd && j + size < newEnd && oldWords[i + size] === newWords[j + size]) {
            size++;
          }
          if (size > bestSize) {
            bestOldStart = i;
            bestNewStart = j;
            bestSize = size;
          }
        }
      }

      return {
        oldStart: bestOldStart,
        newStart: bestNewStart,
        size: bestSize
      };
    };

    const buildDiff = (oldStart, oldEnd, newStart, newEnd) => {
      const result = [];
      const match = findLongestMatch(oldStart, oldEnd, newStart, newEnd);

      if (match.size > 0) {
        if (oldStart < match.oldStart || newStart < match.newStart) {
          result.push(...buildDiff(oldStart, match.oldStart, newStart, match.newStart));
        }

        result.push(oldWords.slice(match.oldStart, match.oldStart + match.size).join(' '));

        if (match.oldStart + match.size < oldEnd || match.newStart + match.size < newEnd) {
          result.push(...buildDiff(match.oldStart + match.size, oldEnd, match.newStart + match.size, newEnd));
        }
      } else {
        const build = (words, start, end, pattern) => {
          let r = [];
          let ts = words
            .slice(start, end)
            .filter((w) => w.length > 0)
            .join(' ')
            .split('<br>');
          for (let i = 0; i < ts.length; i++) {
            if (i > 0) r.push('<br>');
            if (ts[i].length < 1) continue;
            r.push(pattern.replace('{{text}}', ts[i]));
          }
          return r;
        };

        if (oldStart < oldEnd) result.push(...build(oldWords, oldStart, oldEnd, markerDeletion));
        if (newStart < newEnd) result.push(...build(newWords, newStart, newEnd, markerAddition));
      }

      return result;
    };

    return buildDiff(0, oldWords.length, 0, newWords.length)
      .join(' ')
      .replaceAll(/<br>\s+/g, '<br>')
      .replaceAll(/\s+<br>/g, '<br>');
  }

  /**
   * Display Bio notification in desktop toast
   * @param {Object} noty - Notification object
   * @param {string} message - Message text
   * @param {string} image - Image URL
   */
  displayBioDesktopNotification(noty, message, image) {
    try {
      const notificationStore = window.$pinia?.notification;
      if (!notificationStore?.state?.desktopNotification) {
        return;
      }

      const diffPreview = this.generateBioDiff(noty.previousBio, noty.bio);
      const desktopNotification = notificationStore.state.desktopNotification;
      
      desktopNotification(
        noty.displayName,
        `changed bio:\n${diffPreview}`,
        image
      );
    } catch (error) {
      this.logger.error(`Error displaying desktop notification: ${error.message}`);
    }
  }

  /**
   * Display Bio notification in XS overlay
   * @param {Object} noty - Notification object
   * @param {string} message - Message text
   * @param {string} image - Image URL
   */
  displayBioXSNotification(noty, message, image) {
    try {
      const notificationStore = window.$pinia?.notification;
      const advancedSettingsStore = window.$pinia?.advancedSettings;
      const notificationsSettingsStore = window.$pinia?.notificationsSettings;
      
      if (!window.AppApi?.XSNotification) {
        return;
      }

      const timeout = Math.floor(
        parseInt(notificationsSettingsStore?.notificationTimeout || 5000, 10) / 1000
      );
      const opacity = parseFloat(advancedSettingsStore?.notificationOpacity || 100) / 100;

      const diffPreview = this.generateBioDiff(noty.previousBio, noty.bio);
      
      window.AppApi.XSNotification(
        'VRCX',
        `${noty.displayName} changed bio:\n${diffPreview}`,
        timeout,
        opacity,
        image
      );
    } catch (error) {
      this.logger.error(`Error displaying XS notification: ${error.message}`);
    }
  }

  /**
   * Display Bio notification in OVRT overlay
   * @param {boolean} playOvrtHudNotifications - Show on HUD
   * @param {boolean} playOvrtWristNotifications - Show on wrist
   * @param {Object} noty - Notification object
   * @param {string} message - Message text
   * @param {string} image - Image URL
   */
  displayBioOvrtNotification(playOvrtHudNotifications, playOvrtWristNotifications, noty, message, image) {
    try {
      const notificationStore = window.$pinia?.notification;
      const advancedSettingsStore = window.$pinia?.advancedSettings;
      const notificationsSettingsStore = window.$pinia?.notificationsSettings;
      
      if (!window.AppApi?.OVRTNotification) {
        return;
      }

      const timeout = Math.floor(
        parseInt(notificationsSettingsStore?.notificationTimeout || 5000, 10) / 1000
      );
      const opacity = parseFloat(advancedSettingsStore?.notificationOpacity || 100) / 100;

      const diffPreview = this.generateBioDiff(noty.previousBio, noty.bio);
      
      window.AppApi.OVRTNotification(
        playOvrtHudNotifications,
        playOvrtWristNotifications,
        'VRCX',
        `${noty.displayName} changed bio:\n${diffPreview}`,
        timeout,
        opacity,
        image
      );
    } catch (error) {
      this.logger.error(`Error displaying OVRT notification: ${error.message}`);
    }
  }

  /**
   * Open feed tab filtered by bio changes with entries expanded
   */
  async openBioFeed() {
    try {
      const uiStore = window.$pinia?.ui;
      const feedStore = window.$pinia?.feed;

      if (!uiStore || !feedStore) {
        this.logger.showError("Cannot access UI or Feed store");
        return;
      }

      // Switch to feed tab
      uiStore.menuActiveIndex = "feed";

      // Set filter to Bio only
      feedStore.feedTable.filter = ["Bio"];

      // Clear search
      feedStore.feedTable.search = "";

      // Trigger feed lookup to apply filters
      await feedStore.feedTableLookup();

      // Expand all rows after a short delay to let table render
      setTimeout(() => {
        try {
          // Find all expand toggle buttons and click them
          const expandButtons = document.querySelectorAll('.el-table__expand-icon:not(.el-table__expand-icon--expanded)');
          expandButtons.forEach(button => {
            button.click();
          });
          
          this.logger.showSuccess(`Opened Bio feed with ${expandButtons.length} entries`);
        } catch (error) {
          this.logger.warn(`Could not auto-expand entries: ${error.message}`);
        }
      }, 500);

      this.logger.showInfo("Opening Bio feed...");
    } catch (error) {
      this.logger.error(`Error opening bio feed: ${error.message}`);
      this.logger.showError("Failed to open bio feed");
    }
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = BioChangeNotifierPlugin;
