// @ts-nocheck
// TODO: Remove @ts-nocheck and fix type definitions properly

class ProtocolLinksPlugin extends Plugin {
  utils: any;
  contextMenuApi: any;

  constructor() {
    super({
      name: "🔗 VRCX Protocol Links",
      description:
        "Adds context menu items to copy VRCX protocol links for users, avatars, worlds, groups, and instances",
      authors: [
      {
        name: "Bluscream",
      }
    ],
      tags: ["Utility", "Integration"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/context-menu-api.js",
      ],
    });
  }

  async load() {
    this.logger.log("Protocol Links plugin ready");
    this.loaded = true;
  }

  async start() {
    // Setup utils shortcut
    this.utils = (window as any).customjs.utils;

    // Wait for dependencies
    this.contextMenuApi = await window.customjs.pluginManager.waitForPlugin(
      "context-menu-api"
    );

    if (!this.contextMenuApi) {
      this.logger.error("Context Menu API plugin not found after waiting");
      return;
    }

    // Setup context menu items
    this.setupContextMenuItems();

    this.enabled = true;
    this.started = true;
    this.logger.log("Protocol Links plugin started, menu items added");
  }

  async onLogin(user: any) {
    // No login-specific logic needed for protocol links plugin
  }

  async stop() {
    this.logger.log("Stopping Protocol Links plugin");

    // Remove all context menu items
    this.removeContextMenuItems();

    await super.stop();
  }

  setupContextMenuItems() {
    if (!this.contextMenuApi) {
      this.logger.error("Context Menu API plugin not available");
      return;
    }

    // User dialog items
    this.contextMenuApi.addUserItem("copy-user-link", {
      text: "Copy User Link",
      icon: "el-icon-link",
      onClick: (userData: any) => this.copyUserLink(userData),
    });

    this.contextMenuApi.addUserItem("copy-user-import", {
      text: "Copy User Import Link",
      icon: "el-icon-download",
      onClick: (userData: any) => this.copyUserImportLink(userData),
    });

    // Avatar dialog items
    this.contextMenuApi.addAvatarItem("copy-avatar-link", {
      text: "Copy Avatar Link",
      icon: "el-icon-link",
      onClick: (avatarData: any) => this.copyAvatarLink(avatarData),
    });

    this.contextMenuApi.addAvatarItem("copy-avatar-import", {
      text: "Copy Avatar Import Link",
      icon: "el-icon-download",
      onClick: (avatarData: any) => this.copyAvatarImportLink(avatarData),
    });

    // World dialog items
    this.contextMenuApi.addWorldItem("copy-world-link", {
      text: "Copy World Link",
      icon: "el-icon-link",
      onClick: (worldData: any) => this.copyWorldLink(worldData),
    });

    this.contextMenuApi.addWorldItem("copy-world-import", {
      text: "Copy World Import Link",
      icon: "el-icon-download",
      onClick: (worldData: any) => this.copyWorldImportLink(worldData),
    });

    // Group dialog items
    this.contextMenuApi.addGroupItem("copy-group-link", {
      text: "Copy Group Link",
      icon: "el-icon-link",
      onClick: (groupData: any) => this.copyGroupLink(groupData),
    });

    this.logger.log("All context menu items added");
  }

  removeContextMenuItems() {
    if (!this.contextMenuApi) return;

    // Remove user items
    this.contextMenuApi.removeUserItem("copy-user-link");
    this.contextMenuApi.removeUserItem("copy-user-import");

    // Remove avatar items
    this.contextMenuApi.removeAvatarItem("copy-avatar-link");
    this.contextMenuApi.removeAvatarItem("copy-avatar-import");

    // Remove world items
    this.contextMenuApi.removeWorldItem("copy-world-link");
    this.contextMenuApi.removeWorldItem("copy-world-import");

    // Remove group items
    this.contextMenuApi.removeGroupItem("copy-group-link");

    this.logger.log("All context menu items removed");
  }

  copyUserLink(userData: any) {
    if (!userData || !userData.id) {
      this.logger.showError("No user data available");
      return;
    }
    this.utils.copyToClipboard(`vrcx://user/${userData.id}`, "User link");
  }

  copyUserImportLink(userData: any) {
    if (!userData || !userData.id) {
      this.logger.showError("No user data available");
      return;
    }
    this.utils.copyToClipboard(
      `vrcx://import/friend/${userData.id}`,
      "User import link"
    );
  }

  copyAvatarLink(avatarData: any) {
    if (!avatarData || !avatarData.id) {
      this.logger.showError("No avatar data available");
      return;
    }
    this.utils.copyToClipboard(`vrcx://avatar/${avatarData.id}`, "Avatar link");
  }

  copyAvatarImportLink(avatarData: any) {
    if (!avatarData || !avatarData.id) {
      this.logger.showError("No avatar data available");
      return;
    }
    this.utils.copyToClipboard(
      `vrcx://import/avatar/${avatarData.id}`,
      "Avatar import link"
    );
  }

  copyWorldLink(worldData: any) {
    if (!worldData || !worldData.id) {
      this.logger.showError("No world data available");
      return;
    }
    this.utils.copyToClipboard(`vrcx://world/${worldData.id}`, "World link");
  }

  copyWorldImportLink(worldData: any) {
    if (!worldData || !worldData.id) {
      this.logger.showError("No world data available");
      return;
    }
    this.utils.copyToClipboard(
      `vrcx://import/world/${worldData.id}`,
      "World import link"
    );
  }

  copyGroupLink(groupData: any) {
    if (!groupData || !groupData.id) {
      this.logger.showError("No group data available");
      return;
    }
    this.utils.copyToClipboard(`vrcx://group/${groupData.id}`, "Group link");
  }

  /**
   * Add a custom avatar database provider link
   * @param url - URL of the avatar database provider
   */
  addAvatarDatabaseProvider(url: string) {
    this.utils.copyToClipboard(
      `vrcx://addavatardb/${url}`,
      "Avatar database provider link"
    );
  }

  /**
   * Create multi-item import links
   * @param type - Import type (avatar, world, friend)
   * @param ids - Array of IDs to import
   */
  createMultiImportLink(type: string, ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      this.logger.showError("No IDs provided for import");
      return;
    }

    const validTypes = ["avatar", "world", "friend"];
    if (!validTypes.includes(type)) {
      this.logger.showError(
        `Invalid import type. Must be one of: ${validTypes.join(", ")}`
      );
      return;
    }

    const link = `vrcx://import/${type}/${ids.join(",")}`;
    this.utils.copyToClipboard(
      link,
      `${type} import link (${ids.length} items)`
    );
  }
}

// Export plugin class for PluginLoader
window.customjs.__LAST_PLUGIN_CLASS__ = ProtocolLinksPlugin;
