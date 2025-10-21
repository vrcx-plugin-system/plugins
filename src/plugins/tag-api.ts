// 
class TagAPIPlugin extends CustomModule {
  customWorldTags: Map<string, any>;

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
      required_dependencies: [],
    });

    this.customWorldTags = new Map();
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

    this.loaded = true;
    this.logger.log("Tag API plugin loaded");
  }

  async start() {
    this.patchWorldStore();
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

  async stop() {
    await super.stop();
    this.logger.log("Tag API stopped");
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = TagAPIPlugin;
