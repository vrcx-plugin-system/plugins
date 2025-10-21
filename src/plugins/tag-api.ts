// 
class TagAPIPlugin extends CustomModule {
  customWorldTags: Map<string, any>;
  customUserTags: Map<string, any[]>; // userId -> array of tags

  constructor() {
    super({
      name: "Tag API 🏷️",
      description: "Provides custom tag API for users and worlds",
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

    this.loaded = true;
    this.logger.log("Tag API plugin loaded");
  }

  async start() {
    this.patchWorldStore();
    this.patchUserStore();
    this.setupWorldDialogWatcher();
    this.setupUserDialogWatcher();
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

      self.customWorldTags.set(worldTag.WorldId, {
        tag: worldTag.Tag || '',
        colour: worldTag.TagColour || '#FF0000',
        timestamp: Date.now()
      });

      self.emit('world-tag-added', {
        worldId: worldTag.WorldId,
        tag: worldTag.Tag,
        color: worldTag.TagColour,
        timestamp: Date.now()
      });
    };

    worldStore.getCustomWorldTag = function(worldId: string) {
      return self.customWorldTags.get(worldId);
    };

    worldStore.removeCustomWorldTag = function(worldId: string) {
      return self.customWorldTags.delete(worldId);
    };

    worldStore.getAllCustomWorldTags = function() {
      return Array.from(self.customWorldTags.entries()).map(([worldId, tag]) => ({
        worldId,
        ...tag
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
      if (data?.worldId) {
        setTimeout(() => this.injectCustomWorldTag(data.worldId), 100);
      }
    });

    this.logger.log("World dialog watcher setup");
  }

  setupUserDialogWatcher() {
    // Listen for ShowUserDialog event from dialog-events-api
    this.on('ShowUserDialog', (data) => {
      if (data?.userId) {
        setTimeout(() => this.injectCustomUserTags(data.userId), 100);
      }
    });

    this.logger.log("User dialog watcher setup");
  }

  injectCustomWorldTag(worldId: string) {
    const tag = this.customWorldTags.get(worldId);
    if (!tag) return;

    // Find the world dialog tag container
    const tagContainers = document.querySelectorAll('.el-dialog__body > div > div > div');
    if (tagContainers.length < 2) return;

    const tagContainer = tagContainers[1]; // Second div usually has the tags

    // Check if we already injected this tag
    if (tagContainer.querySelector('.vrcx-custom-world-tag')) {
      return;
    }

    // Create custom tag element
    const tagEl = document.createElement('span');
    tagEl.className = 'el-tag el-tag--danger el-tag--plain el-tag--small vrcx-custom-world-tag';
    tagEl.style.marginRight = '5px';
    tagEl.style.marginTop = '5px';
    tagEl.style.color = tag.colour;
    tagEl.style.borderColor = tag.colour;
    tagEl.textContent = tag.tag;

    // Insert at the beginning of tag container
    if (tagContainer.firstChild) {
      tagContainer.insertBefore(tagEl, tagContainer.firstChild);
    } else {
      tagContainer.appendChild(tagEl);
    }
  }

  injectCustomUserTags(userId: string) {
    const tags = this.customUserTags.get(userId);
    if (!tags || tags.length === 0) return;

    // Find the user dialog tag container (usually after user info)
    const tagContainers = document.querySelectorAll('.el-dialog__body > div > div');
    if (tagContainers.length < 2) return;

    const tagContainer = tagContainers[1]; // Second div usually has the user tags

    // Remove any previously injected custom tags
    const existingCustomTags = tagContainer.querySelectorAll('.vrcx-custom-user-tag');
    existingCustomTags.forEach(el => el.remove());

    // Inject each custom tag
    for (const tag of tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'el-tag el-tag--info el-tag--plain el-tag--small vrcx-custom-user-tag';
      tagEl.style.marginRight = '5px';
      tagEl.style.marginTop = '5px';
      tagEl.style.color = tag.colour;
      tagEl.style.borderColor = tag.colour;
      tagEl.textContent = tag.tag;

      // Append to tag container
      tagContainer.appendChild(tagEl);
    }
  }

  /**
   * Add a custom tag to a world
   */
  addWorldTag(worldId: string, tag: string, color: string = '#FF0000') {
    const worldStore = window.$pinia?.world;
    if (!worldStore || !worldStore.addCustomWorldTag) {
      this.logger.error("World store not available or not patched");
      return false;
    }

    try {
      worldStore.addCustomWorldTag({
        WorldId: worldId,
        Tag: tag,
        TagColour: color
      });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to add world tag: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Get a custom tag for a world
   */
  getWorldTag(worldId: string) {
    return this.customWorldTags.get(worldId);
  }

  /**
   * Remove a custom tag from a world
   */
  removeWorldTag(worldId: string) {
    return this.customWorldTags.delete(worldId);
  }

  /**
   * Get all custom world tags
   */
  getAllWorldTags() {
    return Array.from(this.customWorldTags.entries()).map(([worldId, tag]) => ({
      worldId,
      tag: tag.tag,
      colour: tag.colour,
      timestamp: tag.timestamp
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
  addUserTag(userId: string, tag: string, color: string = '#FF00C6') {
    const userStore = window.$pinia?.user;
    if (!userStore || !userStore.addCustomUserTag) {
      this.logger.error("User store not available or not patched");
      return false;
    }

    try {
      userStore.addCustomUserTag({
        UserId: userId,
        Tag: tag,
        TagColour: color
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

  async stop() {
    await super.stop();
    this.logger.log("Tag API stopped");
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = TagAPIPlugin;
