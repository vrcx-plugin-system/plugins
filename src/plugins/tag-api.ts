// 
class TagAPIPlugin extends CustomModule {
  customWorldTags: Map<string, any[]>; // worldId -> array of tags
  customUserTags: Map<string, any[]>; // userId -> array of tags
  customAvatarTags: Map<string, any[]>; // avatarId -> array of tags

  constructor() {
    super({
      name: "Tag API 🏷️",
      description: "Provides custom tag API for users, worlds, and avatars",
      authors: [{
        name: "Bluscream",
        description: "VRCX Plugin System Maintainer",
        userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
      }],
      tags: ["API", "Enhancement"],
      required_dependencies: ["dialog-events-api"],
    });

    this.customWorldTags = new Map();
    this.customUserTags = new Map();
    this.customAvatarTags = new Map();
  }

  async load() {
    this.registerEvent('world-tag-added', {
      description: 'Fired when a custom world tag is added',
      payload: {
        worldId: 'string - World ID',
        tag: 'string - Tag text',
        color: 'string - Tag color',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: false
    });

    this.registerEvent('user-tag-added', {
      description: 'Fired when a custom user tag is added',
      payload: {
        userId: 'string - User ID',
        tag: 'string - Tag text',
        color: 'string - Tag color',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: false
    });

    this.registerEvent('avatar-tag-added', {
      description: 'Fired when a custom avatar tag is added',
      payload: {
        avatarId: 'string - Avatar ID',
        tag: 'string - Tag text',
        color: 'string - Tag color',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: false
    });

    this.loaded = true;
    this.logger.log("Tag API plugin loaded");
  }

  async start() {
    this.patchWorldStore();
    this.patchUserStore();
    this.patchAvatarStore();
    this.setupWorldDialogWatcher();
    this.setupUserDialogWatcher();
    this.setupAvatarDialogWatcher();
    this.enabled = true;
    this.started = true;
    this.logger.log("Tag API started");
  }

  patchWorldStore() {
    const worldStore = window.$pinia?.world;
    if (!worldStore) {
      this.logger.warn("World store not available");
      return;
    }

    // Inject custom world tag functionality
    const self = this;
    
    worldStore.addCustomWorldTag = function(worldTag: any) {
      if (!worldTag || !worldTag.WorldId) {
        return;
      }

      const worldId = worldTag.WorldId;
      const tagData = {
        tag: worldTag.Tag || '',
        colour: worldTag.TagColour || '#FF0000',
        url: worldTag.Url || '',
        tooltip: worldTag.Tooltip || '',
        timestamp: Date.now()
      };

      // Get existing tags or create new array
      const existingTags = self.customWorldTags.get(worldId) || [];
      
      // Check if tag already exists
      const tagExists = existingTags.some((t: any) => t.tag === tagData.tag);
      if (!tagExists) {
        existingTags.push(tagData);
        self.customWorldTags.set(worldId, existingTags);

        self.emit('world-tag-added', {
          worldId: worldId,
          tag: tagData.tag,
          color: tagData.colour,
          timestamp: Date.now()
        });
      }
    };

    worldStore.getCustomWorldTags = function(worldId: string) {
      return self.customWorldTags.get(worldId) || [];
    };

    worldStore.removeCustomWorldTag = function(worldId: string, tag: string) {
      const tags = self.customWorldTags.get(worldId);
      if (!tags) return false;

      const filtered = tags.filter((t: any) => t.tag !== tag);
      if (filtered.length === 0) {
        self.customWorldTags.delete(worldId);
      } else {
        self.customWorldTags.set(worldId, filtered);
      }
      return true;
    };

    worldStore.getAllCustomWorldTags = function() {
      return Array.from(self.customWorldTags.entries()).map(([worldId, tags]) => ({
        worldId,
        tags
      }));
    };

    this.logger.log("World store patched with custom tag support");
  }

  patchUserStore() {
    const userStore = window.$pinia?.user;
    if (!userStore) {
      this.logger.warn("User store not available");
      return;
    }

    // Inject custom user tag functionality
    const self = this;
    
    userStore.addCustomUserTag = function(userTag: any) {
      if (!userTag || !userTag.UserId) {
        return;
      }

      const userId = userTag.UserId;
      const tagData = {
        tag: userTag.Tag || '',
        colour: userTag.TagColour || '#FF00C6',
        url: userTag.Url || '',
        tooltip: userTag.Tooltip || '',
        timestamp: Date.now()
      };

      // Get existing tags or create new array
      const existingTags = self.customUserTags.get(userId) || [];
      
      // Check if tag already exists
      const tagExists = existingTags.some((t: any) => t.tag === tagData.tag);
      if (!tagExists) {
        existingTags.push(tagData);
        self.customUserTags.set(userId, existingTags);

        self.emit('user-tag-added', {
          userId: userId,
          tag: tagData.tag,
          color: tagData.colour,
          timestamp: Date.now()
        });
      }
    };

    userStore.getCustomUserTags = function(userId: string) {
      return self.customUserTags.get(userId) || [];
    };

    userStore.removeCustomUserTag = function(userId: string, tag: string) {
      const tags = self.customUserTags.get(userId);
      if (!tags) return false;

      const filtered = tags.filter((t: any) => t.tag !== tag);
      if (filtered.length === 0) {
        self.customUserTags.delete(userId);
      } else {
        self.customUserTags.set(userId, filtered);
      }
      return true;
    };

    userStore.getAllCustomUserTags = function() {
      return Array.from(self.customUserTags.entries()).map(([userId, tags]) => ({
        userId,
        tags
      }));
    };

    this.logger.log("User store patched with custom tag support");
  }

  setupWorldDialogWatcher() {
    // Listen for ShowWorldDialog event from dialog-events-api
    this.on('ShowWorldDialog', (data) => {
      this.logger.log(`[DEBUG] ShowWorldDialog event received for worldId: ${data?.worldId}`);
      if (data?.worldId) {
        const tags = this.customWorldTags.get(data.worldId);
        this.logger.log(`[DEBUG] World has ${tags?.length || 0} custom tags`);
        setTimeout(() => this.injectCustomWorldTag(data.worldId), 100);
      }
    });

    this.logger.log("World dialog watcher setup");
  }

  patchAvatarStore() {
    const avatarStore = window.$pinia?.avatar;
    if (!avatarStore) {
      this.logger.warn("Avatar store not available");
      return;
    }

    // Inject custom avatar tag functionality
    const self = this;
    
    avatarStore.addCustomAvatarTag = function(avatarTag: any) {
      if (!avatarTag || !avatarTag.AvatarId) {
        return;
      }

      const avatarId = avatarTag.AvatarId;
      const tagData = {
        tag: avatarTag.Tag || '',
        colour: avatarTag.TagColour || '#00C6FF',
        url: avatarTag.Url || '',
        tooltip: avatarTag.Tooltip || '',
        timestamp: Date.now()
      };

      // Get existing tags or create new array
      const existingTags = self.customAvatarTags.get(avatarId) || [];
      
      // Check if tag already exists
      const tagExists = existingTags.some((t: any) => t.tag === tagData.tag);
      if (!tagExists) {
        existingTags.push(tagData);
        self.customAvatarTags.set(avatarId, existingTags);

        self.emit('avatar-tag-added', {
          avatarId: avatarId,
          tag: tagData.tag,
          color: tagData.colour,
          timestamp: Date.now()
        });
      }
    };

    avatarStore.getCustomAvatarTags = function(avatarId: string) {
      return self.customAvatarTags.get(avatarId) || [];
    };

    avatarStore.removeCustomAvatarTag = function(avatarId: string, tag: string) {
      const tags = self.customAvatarTags.get(avatarId);
      if (!tags) return false;

      const filtered = tags.filter((t: any) => t.tag !== tag);
      if (filtered.length === 0) {
        self.customAvatarTags.delete(avatarId);
      } else {
        self.customAvatarTags.set(avatarId, filtered);
      }
      return true;
    };

    avatarStore.getAllCustomAvatarTags = function() {
      return Array.from(self.customAvatarTags.entries()).map(([avatarId, tags]) => ({
        avatarId,
        tags
      }));
    };

    this.logger.log("Avatar store patched with custom tag support");
  }

  setupUserDialogWatcher() {
    // Listen for ShowUserDialog event from dialog-events-api
    this.on('ShowUserDialog', (data) => {
      this.logger.log(`[DEBUG] ShowUserDialog event received for userId: ${data?.userId}`);
      if (data?.userId) {
        const tags = this.customUserTags.get(data.userId);
        this.logger.log(`[DEBUG] User has ${tags?.length || 0} custom tags`);
        setTimeout(() => this.injectCustomUserTags(data.userId), 100);
      }
    });

    this.logger.log("User dialog watcher setup");
  }

  setupAvatarDialogWatcher() {
    // Listen for ShowAvatarDialog event from dialog-events-api
    this.on('ShowAvatarDialog', (data) => {
      this.logger.log(`[DEBUG] ShowAvatarDialog event received for avatarId: ${data?.avatarId}`);
      if (data?.avatarId) {
        const tags = this.customAvatarTags.get(data.avatarId);
        this.logger.log(`[DEBUG] Avatar has ${tags?.length || 0} custom tags`);
        setTimeout(() => this.injectCustomAvatarTags(data.avatarId), 100);
      }
    });

    this.logger.log("Avatar dialog watcher setup");
  }

  injectCustomWorldTag(worldId: string) {
    // Find the world dialog specifically (not user dialog)
    const worldDialog = document.querySelector('.x-world-dialog');
    if (!worldDialog) {
      this.logger.log(`[DEBUG] World dialog not found in DOM, skipping injection`);
      return;
    }

    // Find the div that contains native tags (Public, PC, etc.)
    // It's a div with margin-top: 5px containing .el-tag elements
    const allDivs = worldDialog.querySelectorAll('div[style*="margin-top: 5px"]');
    let tagContainer = null;
    
    for (const div of allDivs) {
      if (div.querySelector('.el-tag')) {
        tagContainer = div;
        break;
      }
    }

    if (!tagContainer) {
      this.logger.log(`[DEBUG] Native tag container not found in world dialog`);
      return;
    }

    // ALWAYS remove old tags first (even if current world has no tags)
    const existingCustomTags = tagContainer.querySelectorAll('.vrcx-custom-world-tag');
    existingCustomTags.forEach(el => el.remove());

    // Now check if current world has tags to inject
    const tags = this.customWorldTags.get(worldId);
    if (!tags || tags.length === 0) return;

    this.logger.log(`[DEBUG] Injecting ${tags.length} world tags into dialog`);

    // Inject each custom tag
    for (const tag of tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'el-tag el-tag--danger el-tag--plain el-tag--small vrcx-custom-world-tag';
      tagEl.style.marginRight = '5px';
      tagEl.style.marginTop = '5px';
      tagEl.style.color = tag.colour;
      tagEl.style.borderColor = tag.colour;
      tagEl.textContent = tag.tag;

      // Add tooltip if provided
      if (tag.tooltip) {
        tagEl.title = tag.tooltip;
      }

      // Add click handler if URL provided
      if (tag.url) {
        tagEl.style.cursor = 'pointer';
        tagEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(tag.url, '_blank');
        });
      }

      // Append to tag container (after native tags like Public, PC)
      tagContainer.appendChild(tagEl);
    }
  }

  injectCustomUserTags(userId: string) {
    this.logger.log(`[DEBUG] injectCustomUserTags called for userId: ${userId}`);

    // Find the user dialog specifically (not world dialog)
    const userDialog = document.querySelector('.x-user-dialog');
    if (!userDialog) {
      this.logger.log(`[DEBUG] User dialog not found in DOM, skipping injection`);
      return;
    }

    // Find the tag container (the div with margin-top: 5px that contains the platform/status tags)
    // It's the second div with style containing "margin-top: 5px" in the user info section
    const allDivs = userDialog.querySelectorAll('div[style*="margin-top: 5px"]');
    let tagContainer = null;
    
    // Find the one that contains .el-tag elements (Trusted User, PC tags)
    for (const div of allDivs) {
      if (div.querySelector('.el-tag')) {
        tagContainer = div;
        break;
      }
    }

    if (!tagContainer) {
      this.logger.log(`[DEBUG] Native tag container not found in user dialog`);
      return;
    }

    // ALWAYS remove old tags first (even if current user has no tags)
    const existingCustomTags = tagContainer.querySelectorAll('.vrcx-custom-user-tag');
    existingCustomTags.forEach(el => el.remove());

    // Now check if current user has tags to inject
    const tags = this.customUserTags.get(userId);
    this.logger.log(`[DEBUG] Found ${tags?.length || 0} tags to inject`);
    if (!tags || tags.length === 0) return;

    this.logger.log(`[DEBUG] Injecting ${tags.length} user tags into dialog`);

    // Find the <br> element that separates tags from badges
    const brElement = tagContainer.querySelector('br');

    // Inject each custom tag
    for (const tag of tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'el-tag el-tag--info el-tag--plain el-tag--small vrcx-custom-user-tag';
      tagEl.style.marginRight = '5px';
      tagEl.style.marginTop = '5px';
      tagEl.style.color = tag.colour;
      tagEl.style.borderColor = tag.colour;
      tagEl.textContent = tag.tag;

      // Add tooltip if provided
      if (tag.tooltip) {
        tagEl.title = tag.tooltip;
      }

      // Add click handler if URL provided
      if (tag.url) {
        tagEl.style.cursor = 'pointer';
        tagEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(tag.url, '_blank');
        });
      }

      // Insert before <br> (so custom tags appear after native tags but before badges)
      if (brElement) {
        tagContainer.insertBefore(tagEl, brElement);
      } else {
        // Fallback: append if no <br> found
        tagContainer.appendChild(tagEl);
      }
    }
  }

  injectCustomAvatarTags(avatarId: string) {
    // Find the avatar dialog specifically
    const avatarDialog = document.querySelector('.x-avatar-dialog');
    if (!avatarDialog) {
      this.logger.log(`[DEBUG] Avatar dialog not found in DOM, skipping injection`);
      return;
    }

    // Find tag container within avatar dialog
    const tagContainer = avatarDialog.querySelector('.el-dialog__body > div > div:nth-child(2)');
    if (!tagContainer) {
      this.logger.log(`[DEBUG] Tag container not found in avatar dialog`);
      return;
    }

    // ALWAYS remove old tags first (even if current avatar has no tags)
    const existingCustomTags = tagContainer.querySelectorAll('.vrcx-custom-avatar-tag');
    existingCustomTags.forEach(el => el.remove());

    // Now check if current avatar has tags to inject
    const tags = this.customAvatarTags.get(avatarId);
    if (!tags || tags.length === 0) return;

    this.logger.log(`[DEBUG] Injecting ${tags.length} avatar tags into dialog`);

    // Inject each custom tag
    for (const tag of tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'el-tag el-tag--success el-tag--plain el-tag--small vrcx-custom-avatar-tag';
      tagEl.style.marginRight = '5px';
      tagEl.style.marginTop = '5px';
      tagEl.style.color = tag.colour;
      tagEl.style.borderColor = tag.colour;
      tagEl.textContent = tag.tag;

      // Add tooltip if provided
      if (tag.tooltip) {
        tagEl.title = tag.tooltip;
      }

      // Add click handler if URL provided
      if (tag.url) {
        tagEl.style.cursor = 'pointer';
        tagEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(tag.url, '_blank');
        });
      }

      // Append to tag container
      tagContainer.appendChild(tagEl);
    }
  }

  /**
   * Add a custom tag to a world (supports multiple tags per world)
   */
  addWorldTag(worldId: string, tag: string, color: string = '#FF0000', url: string = '', tooltip: string = '') {
    const worldStore = window.$pinia?.world;
    if (!worldStore || !worldStore.addCustomWorldTag) {
      this.logger.error("World store not available or not patched");
      return false;
    }

    try {
      worldStore.addCustomWorldTag({
        WorldId: worldId,
        Tag: tag,
        TagColour: color,
        Url: url,
        Tooltip: tooltip
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add world tag: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all custom tags for a world
   */
  getWorldTags(worldId: string) {
    return this.customWorldTags.get(worldId) || [];
  }

  /**
   * Remove a specific custom tag from a world
   */
  removeWorldTag(worldId: string, tag: string) {
    const tags = this.customWorldTags.get(worldId);
    if (!tags) return false;

    const filtered = tags.filter((t: any) => t.tag !== tag);
    if (filtered.length === 0) {
      this.customWorldTags.delete(worldId);
    } else {
      this.customWorldTags.set(worldId, filtered);
    }
    return true;
  }

  /**
   * Remove all custom tags from a world
   */
  removeAllWorldTags(worldId: string) {
    return this.customWorldTags.delete(worldId);
  }

  /**
   * Get all custom world tags
   */
  getAllWorldTags() {
    return Array.from(this.customWorldTags.entries()).map(([worldId, tags]) => ({
      worldId,
      tags: tags.map(t => ({
        tag: t.tag,
        colour: t.colour,
        timestamp: t.timestamp
      }))
    }));
  }

  /**
   * Clear all custom world tags
   */
  clearAllWorldTags() {
    this.customWorldTags.clear();
    this.logger.log("All custom world tags cleared");
  }

  /**
   * Add a custom tag to a user (supports multiple tags per user)
   */
  addUserTag(userId: string, tag: string, color: string = '#FF00C6', url: string = '', tooltip: string = '') {
    const userStore = window.$pinia?.user;
    if (!userStore || !userStore.addCustomUserTag) {
      this.logger.error("User store not available or not patched");
      return false;
    }

    try {
      userStore.addCustomUserTag({
        UserId: userId,
        Tag: tag,
        TagColour: color,
        Url: url,
        Tooltip: tooltip
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add user tag: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all custom tags for a user
   */
  getUserTags(userId: string) {
    return this.customUserTags.get(userId) || [];
  }

  /**
   * Remove a specific custom tag from a user
   */
  removeUserTag(userId: string, tag: string) {
    const tags = this.customUserTags.get(userId);
    if (!tags) return false;

    const filtered = tags.filter((t: any) => t.tag !== tag);
    if (filtered.length === 0) {
      this.customUserTags.delete(userId);
    } else {
      this.customUserTags.set(userId, filtered);
    }
    return true;
  }

  /**
   * Remove all custom tags from a user
   */
  removeAllUserTags(userId: string) {
    return this.customUserTags.delete(userId);
  }

  /**
   * Get all custom user tags
   */
  getAllUserTags() {
    return Array.from(this.customUserTags.entries()).map(([userId, tags]) => ({
      userId,
      tags: tags.map(t => ({
        tag: t.tag,
        colour: t.colour,
        timestamp: t.timestamp
      }))
    }));
  }

  /**
   * Clear all custom user tags
   */
  clearAllUserTags() {
    this.customUserTags.clear();
    this.logger.log("All custom user tags cleared");
  }

  /**
   * Add a custom tag to an avatar (supports multiple tags per avatar)
   */
  addAvatarTag(avatarId: string, tag: string, color: string = '#00C6FF', url: string = '', tooltip: string = '') {
    const avatarStore = window.$pinia?.avatar;
    if (!avatarStore || !avatarStore.addCustomAvatarTag) {
      this.logger.error("Avatar store not available or not patched");
      return false;
    }

    try {
      avatarStore.addCustomAvatarTag({
        AvatarId: avatarId,
        Tag: tag,
        TagColour: color,
        Url: url,
        Tooltip: tooltip
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add avatar tag: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get all custom tags for an avatar
   */
  getAvatarTags(avatarId: string) {
    return this.customAvatarTags.get(avatarId) || [];
  }

  /**
   * Remove a specific custom tag from an avatar
   */
  removeAvatarTag(avatarId: string, tag: string) {
    const tags = this.customAvatarTags.get(avatarId);
    if (!tags) return false;

    const filtered = tags.filter((t: any) => t.tag !== tag);
    if (filtered.length === 0) {
      this.customAvatarTags.delete(avatarId);
    } else {
      this.customAvatarTags.set(avatarId, filtered);
    }
    return true;
  }

  /**
   * Remove all custom tags from an avatar
   */
  removeAllAvatarTags(avatarId: string) {
    return this.customAvatarTags.delete(avatarId);
  }

  /**
   * Get all custom avatar tags
   */
  getAllAvatarTags() {
    return Array.from(this.customAvatarTags.entries()).map(([avatarId, tags]) => ({
      avatarId,
      tags: tags.map(t => ({
        tag: t.tag,
        colour: t.colour,
        timestamp: t.timestamp
      }))
    }));
  }

  /**
   * Clear all custom avatar tags
   */
  clearAllAvatarTags() {
    this.customAvatarTags.clear();
    this.logger.log("All custom avatar tags cleared");
  }

  async stop() {
    await super.stop();
    this.logger.log("Tag API stopped");
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = TagAPIPlugin;
