// 
class PluginManagerUIPlugin extends CustomModule {
  settingsModal: HTMLElement | null;
  searchValue: { value: string; filter: string };
  togglingPlugins: Set<string>;
  utils: any;
  navMenuApi: any;
  dialogApi: any;
  pluginAnalyzer: any;
  pluginGridContainer?: HTMLElement;

  constructor() {
    super({
      name: "🧩 Plugin Manager UI",
      description:
        "Visual UI for managing VRCX custom plugins - Equicord inspired",
      authors: [        {
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }      ],
      tags: ["UI", "Core", "Settings"],
      dependencies: ["nav-menu-api", "dialog-api", "plugin-analyzer"],
    });

    this.settingsModal = null;
    this.searchValue = { value: "", filter: "all" };
    this.togglingPlugins = new Set();
  }

  async load() {
    this.logger.log("Plugin Manager UI ready");
    this.loaded = true;
  }

  async start() {
    this.utils = window.customjs.utils;

    this.navMenuApi = await window.customjs.waitForModule("nav-menu-api");
    this.dialogApi = await window.customjs.waitForModule("dialog-api");
    this.pluginAnalyzer = await window.customjs.waitForModule("plugin-analyzer");

    if (!this.navMenuApi) {
      this.logger.error("Nav Menu API plugin not found");
      return;
    }

    if (!this.dialogApi) {
      this.logger.error("Dialog API plugin not found");
      return;
    }

    if (!this.pluginAnalyzer) {
      this.logger.error("Plugin Analyzer plugin not found");
      return;
    }

    this.setupNavMenuItem();

    this.enabled = true;
    this.started = true;
    this.logger.log("Plugin Manager UI started");
  }

  async onLogin(user) {
    // No login-specific logic needed for plugin manager UI
  }

  async stop() {
    this.logger.log("Stopping Plugin Manager UI");

    if (this.navMenuApi) {
      this.navMenuApi.removeItem("plugins");
    }

    // Clean up settings modal if open
    if (this.settingsModal) {
      this.settingsModal.remove();
      this.settingsModal = null;
    }

    await super.stop();
  }

  setupNavMenuItem() {
    if (!this.navMenuApi) {
      this.logger.error("NavMenu plugin not found!");
      return;
    }

    this.logger.log("Setting up Plugins nav menu item");
    this.navMenuApi.addItem("plugins", {
      label: "Plugins",
      icon: "ri-plug-line",
      content: () => this.createPanelContent(),
      before: "settings",
      onShow: () => this.onPluginsTabShown(),
      onHide: () => this.onPluginsTabHidden(),
    });
    this.logger.log("✓ Plugins nav menu item registered");
  }

  onPluginsTabShown() {
    this.logger.log("🎯 Plugins tab shown - user navigated to Plugins view");
    setTimeout(() => this.refreshPluginGrid(), 50);
  }

  onPluginsTabHidden() {
    this.logger.log(
      "👋 Plugins tab hidden - user navigated away from Plugins view"
    );
    // Could pause any active operations here if needed
  }

  createPanelContent() {
    this.logger.log("🎨 Creating plugin manager panel content");
    const container = document.createElement("div");
    container.style.cssText = `
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    `;

    try {
      // Build all content immediately - nav-menu-api handles visibility
      this.logger.log("  → Building stats section");
      container.appendChild(this.createStatsSection());
      this.logger.log("  → Building repository management section");
      container.appendChild(this.createRepoManagementSection());
      this.logger.log("  → Building config sync section");
      container.appendChild(this.createConfigSyncSection());
      this.logger.log("  → Building load plugin section");
      container.appendChild(this.createLoadPluginSection());
      this.logger.log("  → Building filter section");
      container.appendChild(this.createFilterSection());

      // Plugin grid container
      const pluginGrid = document.createElement("div");
      pluginGrid.id = "plugin-grid-container";
      pluginGrid.className = "vc-plugins-grid";
      container.appendChild(pluginGrid);

      // Store reference for later refreshing
      this.pluginGridContainer = pluginGrid;
      this.logger.log("✓ Plugin manager panel content created successfully");
    } catch (error) {
      this.logger.error("Error creating plugin manager content:", error);
      const errorDiv = document.createElement("div");
      errorDiv.style.cssText =
        "padding: 20px; text-align: center; color: #dc3545;";

      const errorTitle = document.createElement("h3");
      errorTitle.textContent = "❌ Error Loading Plugin Manager";

      const errorMsg = document.createElement("p");
      errorMsg.textContent = error.message;

      const reloadBtn = document.createElement("button");
      reloadBtn.className = "el-button el-button--primary";
      reloadBtn.innerHTML = '<i class="ri-restart-line"></i> Reload VRCX';
      this.registerListener(reloadBtn, "click", () => location.reload());

      errorDiv.appendChild(errorTitle);
      errorDiv.appendChild(errorMsg);
      errorDiv.appendChild(reloadBtn);
      container.appendChild(errorDiv);
    }

    return container;
  }

  createStatsSection() {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 12px;";

    // Stats container
    const statsContainer = document.createElement("div");
    statsContainer.style.cssText =
      "display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px; margin-bottom: 10px;";

    // Get plugin data
    const allPlugins = window.customjs?.modules || [];
    const coreModules = window.customjs?.coreModules || [];
    const failedUrls = new Set();
    
    const repoCount = (window.customjs.repos || []).length;
    const enabledRepoCount = (window.customjs.repos || []).filter(r => r.enabled).length;

    const enabledCount = allPlugins.filter((p) => p.enabled).length;
    const startedCount = allPlugins.filter((p) => p.started).length;

    // Create stat cards
    const stats = [
      {
        label: "Repos",
        value: `${enabledRepoCount}/${repoCount}`,
        color: "#9c27b0",
      },
      { label: "Plugins", value: allPlugins.length, color: "#28a745" },
      { label: "Core Modules", value: coreModules instanceof Map ? coreModules.size : (coreModules as any[]).length, color: "#28a745" },
    ];

    stats.forEach((stat) => {
      const card = this.createStatCard(stat.label, stat.value, stat.color);
      statsContainer.appendChild(card);
    });

    section.appendChild(statsContainer);
    return section;
  }

  createStatCard(label, value, color) {
    const card = document.createElement("div");
    card.style.cssText = `
      text-align: center;
      padding: 6px 8px;
      background: ${color};
      border-radius: 3px;
      color: white;
      box-shadow: 0 1px 2px ${window.customjs.utils.hexToRgba(color, 0.3)};
      transition: transform 0.15s, box-shadow 0.15s;
    `;

    const valueEl = document.createElement("div");
    valueEl.style.cssText = "font-size: 16px; font-weight: 600;";
    valueEl.textContent = value;

    const labelEl = document.createElement("div");
    labelEl.style.cssText = "font-size: 9px; opacity: 0.85; margin-top: 1px;";
    labelEl.textContent = label;

    card.appendChild(valueEl);
    card.appendChild(labelEl);

    // Hover effect
    this.registerListener(card, "mouseenter", () => {
      card.style.transform = "translateY(-1px)";
      card.style.boxShadow = `0 2px 6px ${window.customjs.utils.hexToRgba(
        color,
        0.4
      )}`;
    });
    this.registerListener(card, "mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = `0 1px 3px ${window.customjs.utils.hexToRgba(
        color,
        0.3
      )}`;
    });

    return card;
  }

  createRepoManagementSection() {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 20px;";

    // Title
    const title = document.createElement("h5");
    title.style.cssText =
      "margin: 0 0 12px 0; font-size: 16px; font-weight: 600;";
    title.textContent = "📦 Plugin Repositories";
    section.appendChild(title);

    // Description
    const description = document.createElement("p");
    description.style.cssText =
      "margin: 0 0 12px 0; font-size: 14px; color: #6c757d;";
    description.textContent =
      "Manage plugin repositories to install and update plugins";
    section.appendChild(description);

    // Repository list container
    const repoListContainer = document.createElement("div");
    repoListContainer.id = "repo-list-container";
    repoListContainer.style.cssText = "margin-bottom: 12px;";
    section.appendChild(repoListContainer);

    // Add repository form
    const addRepoForm = document.createElement("div");
    addRepoForm.style.cssText =
      "display: flex; gap: 10px; margin-bottom: 10px;";

    const repoUrlInput = document.createElement("input");
    repoUrlInput.type = "text";
    repoUrlInput.placeholder = "https://example.com/repo.json";
    repoUrlInput.className = "el-input__inner";
    repoUrlInput.style.cssText =
      "flex: 1; padding: 8px 12px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 13px; font-family: 'Consolas', monospace; background: #1e1e1e; color: #e0e0e0;";

    const addRepoBtn = document.createElement("button");
    addRepoBtn.className = "el-button el-button--primary";
    addRepoBtn.innerHTML = '<i class="ri-add-line"></i> Add Repository';
    this.registerListener(addRepoBtn, "click", async () => {
      await this.handleAddRepository(repoUrlInput);
    });

    const refreshReposBtn = document.createElement("button");
    refreshReposBtn.className = "el-button el-button--success";
    refreshReposBtn.innerHTML = '<i class="ri-refresh-line"></i> Refresh All';
    refreshReposBtn.title = "Refresh all repositories";
    this.registerListener(refreshReposBtn, "click", async () => {
      await this.handleRefreshRepositories(refreshReposBtn);
    });

    addRepoForm.appendChild(repoUrlInput);
    addRepoForm.appendChild(addRepoBtn);
    addRepoForm.appendChild(refreshReposBtn);
    section.appendChild(addRepoForm);

    // Render existing repositories
    this.renderRepositoryList(repoListContainer);

    return section;
  }

  renderRepositoryList(container) {
    container.innerHTML = "";

    const repositories = window.customjs.repos || [];

    if (repositories.length === 0) {
      const noRepos = document.createElement("div");
      noRepos.style.cssText = "padding: 10px; color: #6c757d;";
      noRepos.textContent = "No repositories configured";
      container.appendChild(noRepos);
      return;
    }

    repositories.forEach((repo) => {
      const repoCard = this.createRepositoryCard(repo);
      container.appendChild(repoCard);
    });
  }

  createRepositoryCard(repo) {
    const card = document.createElement("div");
    card.style.cssText = `
      background: ${repo.enabled ? "#2d2d2d" : "#1e1e1e"};
      border: 1px solid ${repo.enabled ? "#4a4a4a" : "#333"};
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      opacity: ${repo.enabled ? "1" : "0.6"};
      transition: all 0.2s;
    `;

    // Left side - repo info
    const infoSection = document.createElement("div");
    infoSection.style.cssText = "flex: 1; min-width: 0;";

    const repoName = document.createElement("div");
    repoName.style.cssText =
      "font-size: 14px; font-weight: 600; color: #e8e8e8; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    repoName.textContent = repo.data?.name || "Loading...";

    const repoDescription = document.createElement("div");
    repoDescription.style.cssText =
      "font-size: 12px; color: #b0b0b0; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    repoDescription.textContent = repo.data?.description || "";

    const repoMeta = document.createElement("div");
    repoMeta.style.cssText =
      "font-size: 11px; color: #909090; margin-bottom: 2px;";
    const author = repo.data?.authors?.[0]?.name || "Unknown";
    repoMeta.innerHTML = `<span style="color: #6c757d;">by</span> ${author}`;

    const repoStats = document.createElement("div");
    repoStats.style.cssText =
      "font-size: 11px; color: #6c757d; margin-top: 4px;";
    const pluginCount = repo.data?.modules?.length || repo.data?.plugins?.length || 0;
    repoStats.textContent = `${pluginCount} modules • ${
      repo.loaded ? "✓ Loaded" : "⏳ Loading..."
    }`;

    infoSection.appendChild(repoName);
    infoSection.appendChild(repoDescription);
    infoSection.appendChild(repoMeta);
    infoSection.appendChild(repoStats);

    // Right side - actions
    const actionsSection = document.createElement("div");
    actionsSection.style.cssText =
      "display: flex; gap: 8px; align-items: center;";

    // Toggle switch
    const switchContainer = document.createElement("label");
    switchContainer.className = "el-switch";
    switchContainer.style.cssText =
      "cursor: pointer; display: flex; align-items: center;";
    switchContainer.title = repo.enabled
      ? "Disable repository"
      : "Enable repository";

    const switchInput = document.createElement("input");
    switchInput.type = "checkbox";
    switchInput.checked = repo.enabled;
    switchInput.style.display = "none";

    const switchCore = document.createElement("span");
    switchCore.style.cssText = `
      display: inline-block;
      position: relative;
      width: 40px;
      height: 20px;
      border-radius: 10px;
      background: ${repo.enabled ? "#409eff" : "#dcdfe6"};
      transition: background-color 0.3s;
      cursor: pointer;
    `;

    const switchAction = document.createElement("span");
    switchAction.style.cssText = `
      position: absolute;
      top: 1px;
      left: ${repo.enabled ? "21px" : "1px"};
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      transition: all 0.3s;
    `;

    switchCore.appendChild(switchAction);
    switchContainer.appendChild(switchInput);
    switchContainer.appendChild(switchCore);

    this.registerListener(switchContainer, "click", async (e) => {
      e.stopPropagation();
      await this.handleToggleRepository(repo.url, !repo.enabled);
    });

    // Copy URL button
    const copyBtn = document.createElement("button");
    copyBtn.className = "el-button el-button--small";
    copyBtn.innerHTML = '<i class="ri-file-copy-line"></i>';
    copyBtn.title = "Copy repository URL";
    this.registerListener(copyBtn, "click", async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(repo.url);
        this.logger.showSuccess(`Copied URL: ${repo.url}`);
      } catch (error) {
        this.logger.showError("Failed to copy URL");
      }
    });

    // Refresh button
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "el-button el-button--small el-button--info";
    refreshBtn.innerHTML = '<i class="ri-refresh-line"></i>';
    refreshBtn.title = "Refresh repository";
    this.registerListener(refreshBtn, "click", async (e) => {
      e.stopPropagation();
      await this.handleRefreshRepository(repo.url, refreshBtn);
    });

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "el-button el-button--small el-button--danger";
    removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
    removeBtn.title = "Remove repository";
    this.registerListener(removeBtn, "click", async (e) => {
      e.stopPropagation();
      await this.handleRemoveRepository(repo.url);
    });

    actionsSection.appendChild(switchContainer);
    actionsSection.appendChild(copyBtn);
    actionsSection.appendChild(refreshBtn);
    actionsSection.appendChild(removeBtn);

    card.appendChild(infoSection);
    card.appendChild(actionsSection);

    return card;
  }

  async handleAddRepository(input) {
    const url = input.value.trim();

    this.logger.log(`📦 User requested to add repository: ${url}`);

    if (!url) {
      this.logger.showWarning("Please enter a repository URL");
      return;
    }

    if (!url.endsWith(".json")) {
      this.logger.showWarning("Repository URL must end with .json");
      return;
    }

    

    try {
      this.logger.log(`  → Adding repository via RepoManager...`);
      this.logger.showInfo("Adding repository...");
      const result = await window.customjs.addRepository(url);

      if (result.success) {
        this.logger.showSuccess(
          `Repository added: ${result.repo?.data?.name || url}`
        );
        input.value = "";

        // Refresh the repository list
        const repoListContainer = document.getElementById(
          "repo-list-container"
        );
        if (repoListContainer) {
          this.renderRepositoryList(repoListContainer);
        }

        // Refresh plugin grid to show new available plugins
        this.refreshPluginGrid();
      } else {
        this.logger.showError(`Failed to add repository: ${result.message}`);
      }
    } catch (error) {
      this.logger.error("Error adding repository:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  async handleToggleRepository(url, enabled) {
    this.logger.log(
      `🔘 User toggled repository: ${url} (${enabled ? "enable" : "disable"})`
    );

    

    try {
      const repo = window.customjs.getRepo(url);
      if (repo) {
        repo.enabled = enabled;
        const config = window.customjs.configManager.get('repositories') || {};
        config[url] = enabled;
        window.customjs.configManager.set('repositories', config);
      }
      const success = !!repo;

      if (success) {
        this.logger.showSuccess(
          `Repository ${enabled ? "enabled" : "disabled"}`
        );

        // Refresh the repository list
        const repoListContainer = document.getElementById(
          "repo-list-container"
        );
        if (repoListContainer) {
          this.renderRepositoryList(repoListContainer);
        }

        // Refresh plugin grid
        this.refreshPluginGrid();
      } else {
        this.logger.showError("Failed to toggle repository");
      }
    } catch (error) {
      this.logger.error("Error toggling repository:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  async handleRefreshRepository(url, button) {
    this.logger.log(`🔄 User clicked refresh for repository: ${url}`);

    

    const originalHTML = button.innerHTML;
    try {
      button.disabled = true;
      button.innerHTML = '<i class="ri-loader-4-line ri-spin"></i>';

      this.logger.log(`  → Refreshing repository...`);
      const repo = window.customjs.getRepo(url);
      const success = repo ? await repo.fetch() : false;

      if (success) {
        button.innerHTML = '<i class="ri-check-line"></i>';
        this.logger.showSuccess("Repository refreshed");

        // Refresh the repository list
        const repoListContainer = document.getElementById(
          "repo-list-container"
        );
        if (repoListContainer) {
          this.renderRepositoryList(repoListContainer);
        }

        // Refresh plugin grid
        this.refreshPluginGrid();

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.disabled = false;
        }, 1000);
      } else {
        button.innerHTML = '<i class="ri-error-warning-line"></i>';
        this.logger.showError("Failed to refresh repository");

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      this.logger.error("Error refreshing repository:", error);
      this.logger.showError(`Error: ${error.message}`);
      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  }

  async handleRefreshRepositories(button) {
    this.logger.log(`🔄 User clicked refresh all repositories`);

    

    const originalHTML = button.innerHTML;
    try {
      button.disabled = true;
      button.innerHTML =
        '<i class="ri-loader-4-line ri-spin"></i> Refreshing...';

      this.logger.log(`  → Refreshing all repositories...`);
      const repos = window.customjs.repos || [];
      await Promise.all(repos.map(r => r.fetch()));

      button.innerHTML = '<i class="ri-check-line"></i> Refreshed!';
      this.logger.showSuccess("All repositories refreshed");

      // Refresh the repository list
      const repoListContainer = document.getElementById("repo-list-container");
      if (repoListContainer) {
        this.renderRepositoryList(repoListContainer);
      }

      // Refresh plugin grid
      this.refreshPluginGrid();

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2000);
    } catch (error) {
      this.logger.error("Error refreshing repositories:", error);
      this.logger.showError(`Error: ${error.message}`);
      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  }

  async handleRemoveRepository(url) {
    this.logger.log(`🗑️ User clicked remove for repository: ${url}`);

    if (
      !confirm(`Are you sure you want to remove this repository?\n\n${url}`)
    ) {
      this.logger.log("  → User cancelled removal");
      return;
    }

    

    try {
      this.logger.log(`  → Removing repository...`);
      const success = window.customjs.removeRepository(url);

      if (success) {
        this.logger.showSuccess("Repository removed");

        // Refresh the repository list
        const repoListContainer = document.getElementById(
          "repo-list-container"
        );
        if (repoListContainer) {
          this.renderRepositoryList(repoListContainer);
        }

        // Refresh plugin grid
        this.refreshPluginGrid();
      } else {
        this.logger.showError("Failed to remove repository");
      }
    } catch (error) {
      this.logger.error("Error removing repository:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  createConfigSyncSection() {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 20px;";

    // Title
    const title = document.createElement("h5");
    title.style.cssText =
      "margin: 0 0 12px 0; font-size: 16px; font-weight: 600;";
    title.textContent = "⚙️ Config Sync";
    section.appendChild(title);

    // Description
    const description = document.createElement("p");
    description.style.cssText =
      "margin: 0 0 12px 0; font-size: 14px; color: #6c757d;";
    description.textContent =
      "Sync settings between browser localStorage and VRChat config.json (vrcx.customjs path)";
    section.appendChild(description);

    // Buttons container
    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.cssText = "display: flex; gap: 12px;";

    // Import button
    const importBtn = document.createElement("button");
    importBtn.className = "el-button el-button--primary";
    importBtn.innerHTML =
      '<i class="ri-download-cloud-line"></i> Import from VRChat Config';
    this.registerListener(importBtn, "click", async () => {
      await this.handleImportConfig(importBtn);
    });

    // Export button
    const exportBtn = document.createElement("button");
    exportBtn.className = "el-button el-button--success";
    exportBtn.innerHTML =
      '<i class="ri-upload-cloud-line"></i> Export to VRChat Config';
    this.registerListener(exportBtn, "click", async () => {
      await this.handleExportConfig(exportBtn);
    });

    buttonsContainer.appendChild(importBtn);
    buttonsContainer.appendChild(exportBtn);
    section.appendChild(buttonsContainer);

    return section;
  }

  async handleImportConfig(button) {
    this.logger.log(`📥 User clicked import from VRChat config`);

    const originalHTML = button.innerHTML;
    try {
      button.disabled = true;
      button.innerHTML =
        '<i class="ri-loader-4-line ri-spin"></i> Importing...';

      this.logger.log(`  → Importing config from VRChat config.json...`);
      const result =
        await window.customjs.configManager.importFromVRChatConfig();

      if (result && result.importCount > 0) {
        button.innerHTML = '<i class="ri-check-line"></i> Imported!';
        button.className = "el-button el-button--success";

        this.logger.showSuccess(
          `Successfully imported ${result.importCount} settings from VRChat config.json!`
        );

        // Refresh the UI after a short delay
        setTimeout(() => {
          this.refreshPluginGrid();
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--primary";
          button.disabled = false;
        }, 2000);
      } else if (result && result.importCount === 0) {
        button.innerHTML = '<i class="ri-information-line"></i> No settings';
        button.className = "el-button el-button--warning";

        this.logger.showWarning(
          "No settings found to import from VRChat config.json"
        );

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--primary";
          button.disabled = false;
        }, 2000);
      } else {
        button.innerHTML = '<i class="ri-error-warning-line"></i> Failed';
        button.className = "el-button el-button--danger";

        this.logger.showError(
          "Failed to import settings from VRChat config.json"
        );

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--primary";
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      this.logger.error("Error importing config:", error);
      button.innerHTML = '<i class="ri-error-warning-line"></i> Error';
      button.className = "el-button el-button--danger";

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = "el-button el-button--primary";
        button.disabled = false;
      }, 2000);
    }
  }

  async handleExportConfig(button) {
    this.logger.log(`📤 User clicked export to VRChat config`);

    const originalHTML = button.innerHTML;
    try {
      button.disabled = true;
      button.innerHTML =
        '<i class="ri-loader-4-line ri-spin"></i> Exporting...';

      this.logger.log(`  → Exporting config to VRChat config.json...`);
      const result = await window.customjs.configManager.exportToVRChatConfig();

      if (result && result.success) {
        button.innerHTML = '<i class="ri-check-line"></i> Exported!';
        button.className = "el-button el-button--success";

        // Copy file path to clipboard
        const configPath =
          result.filePath || window.customjs.configManager.vrchatConfigPath;
        await this.utils.copyToClipboard(configPath, "VRChat config.json path");

        // Log export details
        this.logger.log(`Exported to: ${configPath}`);
        this.logger.log(`Exported ${result.settingsCount} settings`);

        this.logger.showSuccess(
          `Settings exported successfully! Path copied to clipboard.`
        );

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--success";
          button.disabled = false;
        }, 2000);
      } else {
        button.innerHTML = '<i class="ri-error-warning-line"></i> Failed';
        button.className = "el-button el-button--danger";

        this.logger.showError(
          "Failed to export settings to VRChat config.json"
        );

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--success";
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      this.logger.error("Error exporting config:", error);
      button.innerHTML = '<i class="ri-error-warning-line"></i> Error';
      button.className = "el-button el-button--danger";

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = "el-button el-button--success";
        button.disabled = false;
      }, 2000);
    }
  }

  createFilterSection() {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 20px;";

    // Title
    const title = document.createElement("h5");
    title.style.cssText =
      "margin: 0 0 12px 0; font-size: 16px; font-weight: 600;";
    title.textContent = "🔧 Filters";
    section.appendChild(title);

    // Filter controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.style.cssText =
      "display: flex; gap: 12px; margin-bottom: 16px;";

    // Search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search for a plugin...";
    searchInput.className = "el-input__inner";
    searchInput.style.cssText =
      "flex: 2; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;";
    searchInput.value = this.searchValue.value;

    this.registerListener(searchInput, "input", (e) => {
      this.searchValue.value = (e.target as HTMLInputElement).value.toLowerCase();
      this.logger.log(
        `🔍 User changed search query to: "${this.searchValue.value}"`
      );
      this.refreshPluginGrid();
    });

    // Filter dropdown
    const filterSelect = document.createElement("select");
    filterSelect.className = "el-select";
    filterSelect.style.cssText =
      "padding: 8px 24px 8px 12px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 14px; width: 180px; background: #2d2d2d; color: #e0e0e0; cursor: pointer;";

    const filters = [
      { value: "all", label: "Show All" },
      { value: "enabled", label: "Enabled" },
      { value: "disabled", label: "Disabled" },
      { value: "available", label: "Available (Not Installed)" },
      { value: "core", label: "Core" },
      { value: "failed", label: "Failed" },
    ];

    filters.forEach((filter) => {
      const option = document.createElement("option");
      option.value = filter.value;
      option.textContent = filter.label;
      if (filter.value === this.searchValue.filter) {
        option.selected = true;
      }
      filterSelect.appendChild(option);
    });

    this.registerListener(filterSelect, "change", (e) => {
      this.searchValue.filter = (e.target as HTMLInputElement).value;
      this.logger.log(`🔽 User changed filter to: ${this.searchValue.filter}`);
      this.refreshPluginGrid();
    });

    controlsContainer.appendChild(searchInput);
    controlsContainer.appendChild(filterSelect);
    section.appendChild(controlsContainer);

    return section;
  }

  createLoadPluginSection() {
    const section = document.createElement("div");
    section.style.cssText = `
      background: #2d2d2d;
      border: 2px dashed #4a4a4a;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    `;

    // Title with icon
    const titleContainer = document.createElement("h3");
    titleContainer.style.cssText =
      "margin: 0 0 12px 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; color: #e0e0e0;";

    const icon = document.createElement("i");
    icon.className = "ri-download-cloud-line";
    icon.style.cssText = "color: #61afef; margin-right: 8px; font-size: 18px;";

    const titleText = document.createTextNode("Load Plugin from URL");

    titleContainer.appendChild(icon);
    titleContainer.appendChild(titleText);
    section.appendChild(titleContainer);

    // Input container
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText =
      "display: flex; gap: 10px; margin-bottom: 10px;";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.id = "plugin-url-input";
    urlInput.placeholder =
      "https://github.com/USER/REPO/raw/refs/heads/main/js/plugins/my-plugin.js";
    urlInput.className = "el-input__inner";
    urlInput.style.cssText =
      "flex: 1; padding: 8px 12px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 13px; font-family: 'Consolas', monospace; background: #1e1e1e; color: #e0e0e0;";

    const loadButton = document.createElement("button");
    loadButton.id = "load-plugin-btn";
    loadButton.className = "el-button el-button--primary";
    loadButton.style.cssText = "padding: 8px 16px;";
    loadButton.innerHTML = '<i class="ri-download-line"></i> Load';

    inputContainer.appendChild(urlInput);
    inputContainer.appendChild(loadButton);
    section.appendChild(inputContainer);

    // Status message
    const statusDiv = document.createElement("div");
    statusDiv.id = "load-plugin-status";
    statusDiv.style.cssText =
      "margin-top: 8px; font-size: 12px; color: #a0a0a0;";
    section.appendChild(statusDiv);

    setTimeout(() => {
      const input = section.querySelector("#plugin-url-input");
      const button = section.querySelector("#load-plugin-btn");
      const status = section.querySelector("#load-plugin-status");

      if (button) {
        this.registerListener(button, "click", async () => {
          await this.handleLoadPlugin(input, status);
        });
      }

      if (input) {
        this.registerListener(input, "keypress", async (e) => {
          if ((e as KeyboardEvent).key === "Enter") {
            await this.handleLoadPlugin(input, status);
          }
        });
      }
    }, 0);

    return section;
  }

  async handleLoadPlugin(input, status) {
    const url = input.value.trim();

    this.logger.log(`📥 User requested to load plugin from URL: ${url}`);

    if (!url) {
      status.textContent = "⚠️ Please enter a URL";
      status.style.color = "#ffc107";
      return;
    }

    status.textContent = `⏳ Loading plugin from ${url}...`;
    status.style.color = "#007bff";

    try {
      this.logger.log(`  → Loading module from URL...`);
      const result = await window.customjs.loadModule(url);

      if (result.success) {
        status.textContent = `✅ Plugin loaded successfully!`;
        status.style.color = "#28a745";
        input.value = "";
        setTimeout(() => this.refreshPluginGrid(), 500);
      } else {
        status.textContent = `❌ Failed to load: ${result.message}`;
        status.style.color = "#dc3545";
      }
    } catch (error) {
      status.textContent = `❌ Error: ${error.message}`;
      status.style.color = "#dc3545";
    }
  }

  refreshPluginGrid() {
    this.logger.log("🔄 Refreshing plugin grid...");
    try {
      const gridContainer = this.pluginGridContainer;

      if (!gridContainer) {
        this.logger.warn("Plugin grid container not available");
        return;
      }

      gridContainer.innerHTML = "";

      // Get all plugins (loaded) and plugins from config (including disabled)
      const loadedPlugins = window.customjs?.modules || [];
      const coreModules = window.customjs?.coreModules || new Map();
      const failedUrls = new Set();
      const repos = window.customjs.repos || [];
      

      this.logger.log(
        `  → Loaded plugins: ${loadedPlugins.length}, Core modules: ${coreModules instanceof Map ? coreModules.size : (coreModules as any[]).length}, Failed: ${failedUrls.size}`
      );

      // Get plugin config to include disabled plugins
      const pluginConfig = window.customjs?.configManager?.get("plugins") || {};

      // Start with plugins from repositories (this gives us rich metadata)
      let allPlugins = [];

      if (repos.length > 0) {
        const repoPlugins = (window.customjs.repos || []).flatMap(r => r.enabled ? r.getModules() : []);

        // Create plugin objects from repo data
        allPlugins = repoPlugins.map((repoPlugin) => {
          // Check if this plugin is actually loaded
          const loadedPlugin = loadedPlugins.find(
            (p) => p.metadata.url === repoPlugin.url
          );

          if (loadedPlugin) {
            // Plugin is loaded - use loaded data but enrich with repo metadata
            return {
              ...loadedPlugin,
              metadata: {
                ...repoPlugin, // Start with repo metadata (better descriptions, tags)
                ...loadedPlugin.metadata, // Override with actual loaded metadata
              },
            };
          } else {
            // Plugin not loaded - use repo data
            const isEnabled =
              pluginConfig[repoPlugin.url] !== undefined
                ? pluginConfig[repoPlugin.url]
                : false;

            return {
              metadata: repoPlugin,
              enabled: isEnabled,
              loaded: false,
              started: false,
              _isStub: true,
            };
          }
        });
      } else {
        // Fallback to old behavior if no repo manager
        const loadedUrls = new Set(loadedPlugins.map((p) => p.metadata.url));
        const disabledPlugins = Object.entries(pluginConfig)
          .filter(([url, enabled]) => !enabled && !loadedUrls.has(url))
          .map(([url]) => this.createUnloadedPluginStub(url));

        allPlugins = [...loadedPlugins, ...disabledPlugins];
      }

      const filteredPlugins = this.filterPlugins(
        allPlugins,
        coreModules,
        failedUrls
      );

      // Create title
      const pluginsTitle = document.createElement("h5");
      pluginsTitle.style.cssText =
        "margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #e0e0e0;";
      pluginsTitle.textContent = `🧩 Plugins (${filteredPlugins.length})`;
      gridContainer.appendChild(pluginsTitle);

      // Create grid
      const grid = document.createElement("div");
      grid.style.cssText =
        "display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; margin-bottom: 20px;";

      if (filteredPlugins.length === 0) {
        const noResults = document.createElement("div");
        noResults.style.cssText =
          "padding: 40px; text-align: center; color: #909090;";
        noResults.textContent = "No plugins meet the search criteria.";
        gridContainer.appendChild(noResults);
        return;
      }

      // Show all plugins at once (no pagination needed)
      filteredPlugins.forEach((plugin) => {
        grid.appendChild(this.createPluginCard(plugin));
      });

      gridContainer.appendChild(grid);
      this.logger.log(
        `✓ Plugin grid refreshed - showing ${filteredPlugins.length} plugins (filter: ${this.searchValue.filter}, search: "${this.searchValue.value}")`
      );
    } catch (error) {
      this.logger.error("Error refreshing plugin grid:", error);
    }
  }

  createUnloadedPluginStub(url) {
    // Extract plugin name from URL
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const pluginId = filename.replace(/\.js$/, "");
    const pluginName = pluginId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return {
      metadata: {
        id: pluginId,
        name: pluginName,
        description: "(Not loaded - enable to see details)",
        authors: [{ name: "Unknown" }],
        url: url,
        tags: [],
      },
      enabled: false,
      loaded: false,
      started: false,
      _isStub: true, // Mark as stub so we know it's not a real loaded plugin
    };
  }

  filterPlugins(allPlugins, coreModules, failedUrls) {
    const { value: search, filter } = this.searchValue;

    let plugins = [...allPlugins];

    // Apply filter
    if (filter === "enabled") {
      plugins = plugins.filter((p) => p.enabled);
    } else if (filter === "disabled") {
      plugins = plugins.filter((p) => !p.enabled);
    } else if (filter === "core") {
      // Return empty for core since we show them separately if needed
      plugins = [];
    } else if (filter === "failed") {
      plugins = [];
    } else if (filter === "available") {
      // Show plugins from repos that aren't installed
      
      if (window.customjs.repos && window.customjs.repos.length > 0) {
        const installedUrls = new Set(allPlugins.map((p) => p.metadata.url));
        const availablePlugins = (window.customjs.repos || []).flatMap(r => r.enabled ? r.getModules() : [])
          .filter((repoPlugin) => !installedUrls.has(repoPlugin.url))
          .map((repoPlugin) => ({
            metadata: repoPlugin,
            enabled: false,
            loaded: false,
            started: false,
            _isAvailable: true, // Mark as available plugin
          }));
        plugins = availablePlugins;
      } else {
        plugins = [];
      }
    }

    // Apply search
    if (search) {
      plugins = plugins.filter(
        (p) =>
          p.metadata.name.toLowerCase().includes(search) ||
          p.metadata.description.toLowerCase().includes(search) ||
          p.metadata.id.toLowerCase().includes(search) ||
          p.metadata.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Sort alphabetically
    plugins.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));

    return plugins;
  }

  createPluginCard(plugin) {
    const card = document.createElement("div");
    card.className = "vc-plugin-card";
    card.style.cssText = `
      background: #2d2d2d;
      border: 2px solid ${plugin.enabled ? "#28a745" : "#5a5a5a"};
      border-radius: 6px;
      padding: 14px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
    `;

    // Header with name, switch, and info button
    const header = document.createElement("div");
    header.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;";

    // Name and author section
    const nameSection = document.createElement("div");
    nameSection.style.cssText = "flex: 1; min-width: 0;";

    const name = document.createElement("div");
    name.style.cssText =
      "font-size: 16px; font-weight: 600; color: #e8e8e8; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    name.textContent = plugin.getDisplayName ? plugin.getDisplayName() : (plugin.metadata?.name || "Unknown Plugin");

    const meta = document.createElement("div");
    meta.style.cssText =
      "font-size: 11px; color: #909090; font-family: monospace; display: flex; align-items: center; gap: 4px;";
    
    // Create author section
    const authorInfo = plugin.metadata?.authors?.[0];
    if (authorInfo?.name) {
      const byText = document.createTextNode("by ");
      meta.appendChild(byText);
      
      if (authorInfo.userId) {
        // Make author name clickable if userId exists
        const authorLink = document.createElement("span");
        authorLink.textContent = authorInfo.name;
        authorLink.style.cssText = "color: #409eff; cursor: pointer; text-decoration: underline;";
        authorLink.title = `${authorInfo.description || 'Click to view profile'}`;
        
        this.registerListener(authorLink, "click", (e) => {
          e.stopPropagation();
          try {
            if (window.$pinia?.user?.showUserDialog) {
              window.$pinia.user.showUserDialog(authorInfo.userId);
              this.logger.log(`Opening user dialog for: ${authorInfo.name} (${authorInfo.userId})`);
            } else {
              this.logger.showWarning("User dialog not available");
            }
          } catch (error) {
            this.logger.error("Error opening user dialog:", error);
          }
        });
        
        meta.appendChild(authorLink);
      } else {
        // No userId, just show author name
        const authorText = document.createTextNode(authorInfo.name);
        meta.appendChild(authorText);
      }
    }
    
    // Build date
    if (plugin.metadata?.build) {
      const buildText = document.createTextNode(` • ${this.formatBuildDate(plugin.metadata.build)}`);
      meta.appendChild(buildText);
    }

    // Show repository source if available
    if (plugin.metadata?.url) {
        let result = null;
        for (const repo of window.customjs.repos || []) {
          if (repo.enabled) {
            const module = repo.getModuleByUrl(plugin.metadata.url);
            if (module) {
              result = { module, repo };
              break;
            }
          }
        }
        if (result) {
          const repoText = document.createTextNode(` • 📦 ${result.repo.data?.name || "Repository"}`);
          meta.appendChild(repoText);
        }
    }

    nameSection.appendChild(name);
    nameSection.appendChild(meta);

    // Toggle switch or Install button
    if (plugin._isAvailable) {
      // Available plugin - show Install button
      const installBtn = document.createElement("button");
      installBtn.className = "el-button el-button--small el-button--success";
      installBtn.innerHTML = '<i class="ri-download-line"></i> Install';
      installBtn.title = "Install this plugin";
      this.registerListener(installBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleInstallPlugin(plugin.metadata.url, installBtn);
      });
      header.appendChild(nameSection);
      header.appendChild(installBtn);
    } else {
      // Installed plugin - show toggle switch
      const switchContainer = document.createElement("label");
      switchContainer.className = "el-switch";
      switchContainer.style.cssText =
        "cursor: pointer; display: flex; align-items: center;";

      const switchInput = document.createElement("input");
      switchInput.type = "checkbox";
      switchInput.checked = plugin.enabled;
      switchInput.style.display = "none";

      const switchCore = document.createElement("span");
      switchCore.style.cssText = `
        display: inline-block;
        position: relative;
        width: 40px;
        height: 20px;
        border-radius: 10px;
        background: ${plugin.enabled ? "#409eff" : "#dcdfe6"};
        transition: background-color 0.3s;
        cursor: pointer;
      `;

      const switchAction = document.createElement("span");
      switchAction.style.cssText = `
        position: absolute;
        top: 1px;
        left: ${plugin.enabled ? "21px" : "1px"};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: white;
        transition: all 0.3s;
      `;

      switchCore.appendChild(switchAction);
      switchContainer.appendChild(switchInput);
      switchContainer.appendChild(switchCore);

      this.registerListener(switchContainer, "click", async (e) => {
        e.stopPropagation();
        await this.handleTogglePlugin(plugin.metadata.id);
      });

      header.appendChild(nameSection);
      header.appendChild(switchContainer);
    }

    // Description
    const description = document.createElement("div");
    description.style.cssText =
      "font-size: 13px; color: #b0b0b0; line-height: 1.4; margin-bottom: 12px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;";
    description.textContent = plugin.getDisplayDescription ? plugin.getDisplayDescription() : (plugin.metadata?.description || "No description available");

    // Tags as badges
    const badgesContainer = document.createElement("div");
    badgesContainer.style.cssText =
      "display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;";

    // Show plugin tags if available
    if (plugin.metadata?.tags && plugin.metadata.tags.length > 0) {
      plugin.metadata.tags.forEach((tag) => {
        const color = this.getTagColor(tag);
        const badge = this.createBadge(tag, color);
        badgesContainer.appendChild(badge);
      });
    }

    // Custom action buttons
    let customActions = null;
    if (plugin.actionButtons && plugin.actionButtons.length > 0) {
      customActions = this.createCustomActionButtons(plugin, plugin.actionButtons);
    }

    // Standard action buttons
    const actions = document.createElement("div");
    actions.style.cssText =
      "display: flex; gap: 8px; margin-top: auto; padding-top: 12px; border-top: 1px solid #404040;";

    if (plugin._isAvailable) {
      // Available plugin - only show analyze button
      const analyzeBtn = document.createElement("button");
      analyzeBtn.className = "el-button el-button--small el-button--success";
      analyzeBtn.style.cssText = "flex: 1;";
      analyzeBtn.innerHTML =
        '<i class="ri-search-eye-line"></i> Plugin Details';
      analyzeBtn.title = "Fetch Plugin Details";
      this.registerListener(analyzeBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleAnalyzePlugin(plugin.metadata.url);
      });
      actions.appendChild(analyzeBtn);
    } else {
      // Installed plugin - show all buttons
      const reloadBtn = document.createElement("button");
      reloadBtn.className = "el-button el-button--small el-button--info";
      reloadBtn.style.cssText = "flex: 1;";
      reloadBtn.innerHTML = '<i class="ri-restart-line"></i> Reload';
      this.registerListener(reloadBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleReloadPlugin(plugin.metadata.url);
      });

      // Check if plugin has settings before showing settings button
      const hasSettings =
        plugin.settings?.def && Object.keys(plugin.settings.def).length > 0;

      const analyzeBtn = document.createElement("button");
      analyzeBtn.className = "el-button el-button--small el-button--success";
      analyzeBtn.innerHTML = '<i class="ri-search-eye-line"></i>';
      analyzeBtn.title = "Fetch Plugin Details";
      this.registerListener(analyzeBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleAnalyzePlugin(plugin.metadata.url);
      });

      const infoBtn = document.createElement("button");
      infoBtn.className = "el-button el-button--small";
      infoBtn.innerHTML = '<i class="ri-information-line"></i>';
      infoBtn.title = "Plugin Details";
      this.registerListener(infoBtn, "click", (e) => {
        e.stopPropagation();
        this.handleShowDetails(plugin);
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "el-button el-button--small el-button--danger";
      removeBtn.innerHTML = '<i class="ri-delete-bin-line"></i>';
      removeBtn.title = "Remove Plugin";
      this.registerListener(removeBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleRemovePlugin(plugin.metadata.url);
      });

      actions.appendChild(reloadBtn);

      // Only show settings button if plugin has settings
      if (hasSettings) {
        const settingsBtn = document.createElement("button");
        settingsBtn.className = "el-button el-button--small el-button--primary";
        settingsBtn.innerHTML = '<i class="ri-settings-3-line"></i>';
        settingsBtn.title = "Plugin Settings";
        this.registerListener(settingsBtn, "click", async (e) => {
          e.stopPropagation();
          await this.handleShowPluginSettings(plugin);
        });
        actions.appendChild(settingsBtn);
      }

      actions.appendChild(analyzeBtn);
      actions.appendChild(infoBtn);
      actions.appendChild(removeBtn);
    }

    // Assemble card
    card.appendChild(header);
    card.appendChild(description);
    if (badgesContainer.children.length > 0) {
      card.appendChild(badgesContainer);
    }
    if (customActions) {
      card.appendChild(customActions);
    }
    card.appendChild(actions);

    // Hover effects
    this.registerListener(card, "mouseenter", () => {
      card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
      card.style.transform = "translateY(-2px)";
    });

    this.registerListener(card, "mouseleave", () => {
      card.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      card.style.transform = "translateY(0)";
    });

    return card;
  }

  createCustomActionButtons(plugin, buttons) {
    const container = document.createElement("div");
    container.style.cssText =
      "display: flex; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #404040; flex-wrap: wrap;";

    buttons.forEach((buttonDef) => {
      try {
        const button = document.createElement("button");

        // Map color names to element plus button variants
        const colorClassMap = {
          primary: "el-button--primary",
          success: "el-button--success",
          warning: "el-button--warning",
          danger: "el-button--danger",
          info: "el-button--info",
        };

        const colorClass =
          colorClassMap[buttonDef.color] || colorClassMap.primary;
        button.className = `el-button el-button--small ${colorClass}`;
        button.style.cssText = "flex: 1;";

        // Build button content with icon if provided
        let innerHTML = "";
        if (buttonDef.icon) {
          innerHTML += `<i class="${buttonDef.icon}"></i> `;
        }
        innerHTML += buttonDef.title || "Action";
        button.innerHTML = innerHTML;

        // Set tooltip if provided
        if (buttonDef.description) {
          button.title = buttonDef.description;
        }

        // Register click handler
        if (buttonDef.callback && typeof buttonDef.callback === "function") {
          this.registerListener(button, "click", async (e) => {
            e.stopPropagation();
            try {
              await buttonDef.callback();
            } catch (error) {
              this.logger.error(
                `Error executing custom button callback for ${plugin.metadata.id}:`,
                error
              );
              this.logger.showError(`Button action failed: ${error.message}`);
            }
          });
        }

        container.appendChild(button);
      } catch (error) {
        this.logger.error(
          `Error creating custom button for ${plugin.metadata.id}:`,
          error
        );
      }
    });

    return container;
  }

  createBadge(text, color) {
    const badge = document.createElement("span");
    badge.style.cssText = `
      background: ${color};
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    `;
    badge.textContent = text;
    return badge;
  }

  getTagColor(tag) {
    // Simple hash function to convert string to consistent number
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert hash to hue (0-360 degrees)
    const hue = Math.abs(hash % 360);

    // Use HSL with consistent saturation and lightness for vibrant, readable colors
    // Saturation: 65-75% for vibrant but not overpowering colors
    // Lightness: 45-55% for good contrast on dark backgrounds
    const saturation = 65 + (Math.abs(hash >> 8) % 11); // 65-75%
    const lightness = 45 + (Math.abs(hash >> 16) % 11); // 45-55%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  createFailedSection(failedUrls) {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 30px;";

    const header = document.createElement("h3");
    header.style.cssText = `
      margin: 0 0 15px 0;
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      color: #dc3545;
    `;
    header.innerHTML = `<i class="ri-error-warning-line" style="margin-right: 8px;"></i>Failed to Load (${failedUrls.length})`;

    section.appendChild(header);

    const list = document.createElement("div");
    list.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

    failedUrls.forEach((url) => {
      const item = document.createElement("div");
      item.style.cssText = `
        background: #fff5f5;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 12px 15px;
        font-size: 13px;
        font-family: 'Consolas', monospace;
        color: #dc3545;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;

      const urlText = document.createElement("span");
      urlText.textContent = url;
      urlText.style.flex = "1";

      const retryBtn = document.createElement("button");
      retryBtn.className = "el-button el-button--small el-button--danger";
      retryBtn.innerHTML = '<i class="ri-restart-line"></i> Retry';

      item.appendChild(urlText);
      item.appendChild(retryBtn);

      this.registerListener(item, "mouseenter", () => {
        item.style.background = "#ffe6e6";
      });

      this.registerListener(item, "mouseleave", () => {
        item.style.background = "#fff5f5";
      });

      this.registerListener(urlText, "click", () => {
        if (this.utils) {
          this.utils.copyToClipboard(url, "Failed plugin URL");
        }
      });

      this.registerListener(retryBtn, "click", async (e) => {
        e.stopPropagation();
        await this.handleRetryFailedPlugin(url);
      });

      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  async handleTogglePlugin(pluginId) {
    this.logger.log(`🔘 User clicked toggle for plugin: ${pluginId}`);

    // Prevent concurrent toggles of the same plugin
    if (this.togglingPlugins.has(pluginId)) {
      this.logger.warn(
        `Plugin ${pluginId} is already being toggled, ignoring duplicate request`
      );
      return;
    }

    this.togglingPlugins.add(pluginId);

    try {
      const plugin = window.customjs.getModule(pluginId);

      if (!plugin) {
        // Plugin not loaded - it's a disabled plugin stub
        // Find the plugin URL from config
        const config = window.customjs.configManager.getPluginConfig();
        const pluginUrl = Object.keys(config).find((url) => {
          const urlParts = url.split("/");
          const filename = urlParts[urlParts.length - 1];
          const id = filename.replace(/\.js$/, "");
          return id === pluginId;
        });

        if (!pluginUrl) {
          this.logger.error(`Plugin URL not found for: ${pluginId}`);
          this.logger.showError(`Plugin URL not found: ${pluginId}`);
          return;
        }

        // Enable in config and load the plugin
        this.logger.log(
          `Enabling disabled plugin ${pluginId} from ${pluginUrl}`
        );
        this.logger.showInfo(`Enabling plugin...`);

        config[pluginUrl] = true;
        window.customjs.configManager.setPluginConfig(config);

        // Load the plugin (use loadModule since it's not loaded yet)
        const loadResult = await window.customjs.loadModule(pluginUrl);

        if (loadResult.success) {
          this.logger.log(`Plugin ${pluginId} enabled and loaded`);
          this.logger.showSuccess(`Plugin enabled successfully`);
        } else {
          this.logger.error(`Failed to load plugin: ${loadResult.message}`);
          this.logger.showError(`Failed to load plugin: ${loadResult.message}`);
        }

        // Refresh grid
        setTimeout(() => this.refreshPluginGrid(), 500);
        return;
      }

      // Plugin exists - toggle it normally
      await plugin.toggle();
      this.logger.log(
        `Toggled plugin ${pluginId}: ${plugin.enabled ? "enabled" : "disabled"}`
      );

      // Update plugin config and save
      if (plugin.metadata.url && window.customjs.configManager) {
        const config = window.customjs.configManager.getPluginConfig();
        config[plugin.metadata.url] = plugin.enabled;
        window.customjs.configManager.setPluginConfig(config);
      }

      const statusMsg = plugin.enabled ? "enabled" : "disabled";
      const displayName = (plugin as any).getDisplayName ? (plugin as any).getDisplayName() : plugin.metadata.name;
      this.logger.showSuccess(`${displayName} ${statusMsg}`);

      // Refresh after toggle completes
      setTimeout(() => this.refreshPluginGrid(), 200);
    } catch (error) {
      this.logger.error(`Error toggling plugin ${pluginId}:`, error);
      this.logger.showError(`Error: ${error.message}`);
    } finally {
      // Remove lock after a delay to ensure no race conditions
      setTimeout(() => {
        this.togglingPlugins.delete(pluginId);
      }, 500);
    }
  }

  async handleReloadPlugin(pluginUrl) {
    this.logger.log(`🔄 User clicked reload for plugin: ${pluginUrl}`);

    if (!pluginUrl) {
      this.logger.warn("No URL available for reload");
      this.logger.showWarning("Plugin URL not available");
      return;
    }

    try {
      this.logger.log(`  → Reloading plugin from ${pluginUrl}`);
      this.logger.showInfo("Reloading plugin...");

      // Check if plugin is disabled in config
      const config = window.customjs.configManager.getPluginConfig();
      if (config[pluginUrl] === false) {
        // Enable it first
        this.logger.log("Plugin is disabled, enabling before reload");
        config[pluginUrl] = true;
        window.customjs.configManager.setPluginConfig(config);
      }

      const result = await window.customjs.reloadModule(
        pluginUrl
      );

      if (result.success) {
        this.logger.log("Plugin reloaded successfully");
        this.logger.showSuccess("Plugin reloaded successfully");
        setTimeout(() => this.refreshPluginGrid(), 500);
      } else {
        this.logger.error(`Reload failed: ${result.message}`);
        this.logger.showError(`Reload failed: ${result.message}`);
      }
    } catch (error) {
      this.logger.error("Error reloading plugin:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  async handleAnalyzePlugin(pluginUrl) {
    this.logger.log(`🔍 User clicked analyze for plugin: ${pluginUrl}`);

    if (!this.pluginAnalyzer) {
      this.logger.error("Plugin Analyzer not available");
      this.logger.showError("Plugin Analyzer is not loaded");
      return;
    }

    // Delegate to plugin analyzer
    await this.pluginAnalyzer.analyzePlugin(pluginUrl);
  }


  handleShowDetails(plugin) {
    this.logger.log(`ℹ️ User clicked info for plugin: ${plugin.metadata.id}`);
    // Dump to console and open devtools
    this.logger.log("  → Plugin details:", plugin);
    if (window.AppApi?.ShowDevTools) {
      window.AppApi.ShowDevTools();
    }
  }

  async handleShowPluginSettings(plugin) {
    this.logger.log(
      `⚙️ User clicked settings for plugin: ${plugin.metadata.id}`
    );

    // Check if plugin has settings
    const hasSettings =
      plugin.settings?.def && Object.keys(plugin.settings.def).length > 0;

    if (hasSettings) {
      this.logger.log(
        `  → Opening settings modal (${
          Object.keys(plugin.settings.def).length
        } settings)`
      );
      // Show settings modal
      this.showSettingsModal(plugin);
    } else {
      this.logger.log("  → Plugin has no configurable settings");
      // Show message that no settings are available
      this.logger.showInfo(
        `${plugin.getDisplayName()} has no configurable settings`
      );
    }
  }

  async handleRemovePlugin(pluginUrl) {
    this.logger.log(`🗑️ User clicked remove for plugin: ${pluginUrl}`);

    if (!pluginUrl) {
      this.logger.warn("No URL available for removal");
      this.logger.showWarning("Plugin URL not available");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove this plugin?\n\nNote: Code will remain in memory until VRCX restart.`
      )
    ) {
      this.logger.log("  → User cancelled removal");
      return;
    }

    try {
      this.logger.log(`  → Removing plugin from ${pluginUrl}`);

      const result = await window.customjs.unloadModule(
        pluginUrl
      );

      if (result.success) {
        this.logger.log("Plugin removed successfully");
        this.logger.showSuccess(
          "Plugin removed (restart VRCX to fully unload)"
        );
        setTimeout(() => this.refreshPluginGrid(), 500);
      } else {
        this.logger.error(`Removal failed: ${result.message}`);
        this.logger.showError(`Removal failed: ${result.message}`);
      }
    } catch (error) {
      this.logger.error("Error removing plugin:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  async handleInstallPlugin(pluginUrl, button) {
    this.logger.log(`📥 User clicked install for plugin: ${pluginUrl}`);

    if (!pluginUrl) {
      this.logger.showWarning("No URL available for installation");
      return;
    }

    const originalHTML = button.innerHTML;
    try {
      button.disabled = true;
      button.innerHTML =
        '<i class="ri-loader-4-line ri-spin"></i> Installing...';

      this.logger.log(`  → Installing plugin from ${pluginUrl}`);
      const result = await window.customjs.loadModule(pluginUrl);

      if (result.success) {
        button.innerHTML = '<i class="ri-check-line"></i> Installed!';
        button.className = "el-button el-button--small el-button--success";
        this.logger.showSuccess("Plugin installed successfully");

        setTimeout(() => {
          this.refreshPluginGrid();
        }, 1000);
      } else {
        button.innerHTML = '<i class="ri-error-warning-line"></i> Failed';
        button.className = "el-button el-button--small el-button--danger";
        this.logger.showError(`Installation failed: ${result.message}`);

        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.className = "el-button el-button--small el-button--success";
          button.disabled = false;
        }, 2000);
      }
    } catch (error) {
      this.logger.error("Error installing plugin:", error);
      this.logger.showError(`Error: ${error.message}`);
      button.innerHTML = originalHTML;
      button.className = "el-button el-button--small el-button--success";
      button.disabled = false;
    }
  }

  async handleRetryFailedPlugin(url) {
    try {
      this.logger.log(`Retrying failed plugin: ${url}`);
      this.logger.showInfo("Retrying plugin load...");

      // Try loading again
      const result = await window.customjs.loadModule(url);

      if (result.success) {
        this.logger.showSuccess("Plugin loaded successfully!");
        setTimeout(() => this.refreshPluginGrid(), 500);
      } else {
        this.logger.showError(`Failed again: ${result.message}`);
      }
    } catch (error) {
      this.logger.error("Error retrying plugin:", error);
      this.logger.showError(`Error: ${error.message}`);
    }
  }

  showSettingsModal(plugin) {
    // Remove existing modal if any
    if (this.settingsModal) {
      this.settingsModal.remove();
      this.settingsModal = null;
    }

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;

    // Create modal container
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #2d2d2d;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 700px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 20px 25px;
      border-bottom: 1px solid #404040;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 20px; font-weight: 600;">
        <i class="ri-settings-3-line"></i> ${plugin.getDisplayName()} Settings
      </h3>
      <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">
        Configure plugin settings • Changes are saved automatically
      </p>
    `;

    // Create content area
    const content = document.createElement("div");
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px 25px;
    `;

    // Build settings UI
    content.appendChild(this.buildSettingsUI(plugin));

    // Create footer
    const footer = document.createElement("div");
    footer.style.cssText = `
      padding: 15px 25px;
      border-top: 1px solid #404040;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #252525;
    `;

    const infoText = document.createElement("span");
    infoText.style.cssText = "font-size: 12px; color: #b0b0b0;";
    infoText.textContent = "Settings are automatically saved";

    const buttonGroup = document.createElement("div");
    buttonGroup.style.cssText = "display: flex; gap: 10px;";

    const resetBtn = document.createElement("button");
    resetBtn.className = "el-button el-button--small el-button--warning";
    resetBtn.innerHTML = '<i class="ri-restart-line"></i> Reset to Defaults';

    const closeBtn = document.createElement("button");
    closeBtn.className = "el-button el-button--small el-button--primary";
    closeBtn.innerHTML = '<i class="ri-close-line"></i> Close';

    buttonGroup.appendChild(resetBtn);
    buttonGroup.appendChild(closeBtn);

    footer.appendChild(infoText);
    footer.appendChild(buttonGroup);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Event handlers
    this.registerListener(closeBtn, "click", () => {
      overlay.remove();
      this.settingsModal = null;
    });

    this.registerListener(resetBtn, "click", async () => {
      if (
        confirm(
          `Reset all settings for "${plugin.getDisplayName()}" to their default values?`
        )
      ) {
        // Reset settings using new API if available
        if (plugin.settings?.resetAll) {
          plugin.settings.resetAll();
        } else {
          // Legacy: clear all settings
          plugin.clearAllSettings();
        }
        this.logger.showSuccess("Settings reset to defaults");
        // Refresh the modal
        content.innerHTML = "";
        content.appendChild(this.buildSettingsUI(plugin));
      }
    });

    this.registerListener(overlay, "click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.settingsModal = null;
      }
    });

    // Add to DOM
    document.body.appendChild(overlay);
    this.settingsModal = overlay;
  }

  buildSettingsUI(plugin) {
    const container = document.createElement("div");
    container.style.cssText = "padding: 12px 0;";

    // Check if plugin uses new definePluginSettings (has settings.def)
    if (plugin.settings?.def && Object.keys(plugin.settings.def).length > 0) {
      // New SettingsStore API with category support
      const settingsDef = plugin.settings.def;
      const visibleSettings = {};

      // Filter out hidden settings
      for (const key in settingsDef) {
        if (!settingsDef[key].hidden) {
          visibleSettings[key] = settingsDef[key];
        }
      }

      if (Object.keys(visibleSettings).length === 0) {
        const noSettings = document.createElement("div");
        noSettings.style.cssText =
          "text-align: center; padding: 20px; color: #909090;";

        const icon = document.createElement("i");
        icon.className = "ri-inbox-line";
        icon.style.cssText =
          "font-size: 32px; opacity: 0.5; display: block; margin-bottom: 8px; color: #909090;";

        const text = document.createElement("p");
        text.style.cssText = "margin: 0; font-size: 13px; color: #b0b0b0;";
        text.textContent = "This plugin has no configurable settings";

        noSettings.appendChild(icon);
        noSettings.appendChild(text);
        container.appendChild(noSettings);
        return container;
      }

      // Group settings by category
      const categorizedSettings = {};
      for (const key in visibleSettings) {
        const category = visibleSettings[key].category || "general";
        if (!categorizedSettings[category]) {
          categorizedSettings[category] = {};
        }
        categorizedSettings[category][key] = visibleSettings[key];
      }

      // Get category metadata if defined
      const categoryMeta = plugin.categories || {};

      // Render each category
      Object.entries(categorizedSettings).forEach(([categoryKey, settings]) => {
        // Create category section
        const categorySection = document.createElement("div");
        categorySection.style.cssText = "margin-bottom: 20px;";

        // Category header
        const categoryHeader = document.createElement("div");
        categoryHeader.style.cssText = `
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #404040;
        `;

        const categoryTitle = document.createElement("h4");
        categoryTitle.style.cssText = `
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #e0e0e0;
        `;
        categoryTitle.textContent =
          categoryMeta[categoryKey]?.name ||
          this.formatCategoryName(categoryKey);

        categoryHeader.appendChild(categoryTitle);

        // Category description if available
        if (categoryMeta[categoryKey]?.description) {
          const categoryDesc = document.createElement("p");
          categoryDesc.style.cssText = `
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #b0b0b0;
          `;
          categoryDesc.textContent = categoryMeta[categoryKey].description;
          categoryHeader.appendChild(categoryDesc);
        }

        categorySection.appendChild(categoryHeader);

        // Render settings in this category
        Object.entries(settings).forEach(([key, settingDef]) => {
          const settingRow = this.createSettingRow(plugin, key, settingDef);
          categorySection.appendChild(settingRow);
        });

        container.appendChild(categorySection);
      });

      return container;
    }

    // No settings found
    const noSettings = document.createElement("div");
    noSettings.style.cssText =
      "text-align: center; padding: 20px; color: #909090;";

    const icon = document.createElement("i");
    icon.className = "ri-inbox-line";
    icon.style.cssText =
      "font-size: 32px; opacity: 0.5; display: block; margin-bottom: 8px; color: #909090;";

    const text = document.createElement("p");
    text.style.cssText = "margin: 0; font-size: 13px; color: #b0b0b0;";
    text.textContent = "This plugin has no configurable settings";

    noSettings.appendChild(icon);
    noSettings.appendChild(text);
    container.appendChild(noSettings);
    return container;
  }

  createSettingRow(plugin, key, settingDef) {
    const container = document.createElement("div");
    container.style.cssText = "margin-bottom: 8px;";

    const row = document.createElement("div");
    row.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #353535;
      border-radius: 6px;
      border: 1px solid #4a4a4a;
    `;

    // Label section
    const labelSection = document.createElement("div");
    labelSection.style.cssText = "flex: 1; min-width: 0; margin-right: 12px;";

    const label = document.createElement("div");
    label.style.cssText =
      "font-size: 13px; font-weight: 500; color: #e8e8e8; margin-bottom: 2px;";
    label.textContent = settingDef.description || key;

    // if (settingDef.placeholder) {
    //   const placeholder = document.createElement("div");
    //   placeholder.style.cssText = "font-size: 11px; color: #b0b0b0;";
    //   placeholder.textContent = settingDef.placeholder;
    //   labelSection.appendChild(label);
    //   labelSection.appendChild(placeholder);
    // } else {
    labelSection.appendChild(label);
    // }

    // Input section
    const inputSection = document.createElement("div");
    inputSection.style.cssText =
      "min-width: 140px; display: flex; justify-content: flex-end;";

    const input = this.createInputForSetting(plugin, key, settingDef);
    inputSection.appendChild(input);

    row.appendChild(labelSection);
    row.appendChild(inputSection);
    container.appendChild(row);

    // Add variables display if they exist
    if (settingDef.variables && Object.keys(settingDef.variables).length > 0) {
      const variablesSection = this.createVariablesDisplay(
        settingDef.variables
      );
      container.appendChild(variablesSection);
    }

    return container;
  }

  createVariablesDisplay(variables) {
    const container = document.createElement("div");
    container.style.cssText = `
      margin-top: 4px;
      padding: 8px 12px;
      background: #2a2a2a;
      border-radius: 4px;
      border-left: 3px solid #409eff;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      font-size: 11px;
      font-weight: 600;
      color: #409eff;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    header.textContent = "Available Variables";

    const variablesList = document.createElement("div");
    variablesList.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 4px;
      font-size: 11px;
    `;

    Object.entries(variables).forEach(([placeholder, description]) => {
      const varItem = document.createElement("div");
      varItem.style.cssText = `
        display: flex;
        align-items: baseline;
        gap: 6px;
        padding: 2px 0;
      `;

      const varPlaceholder = document.createElement("code");
      varPlaceholder.style.cssText = `
        color: #67c23a;
        background: #1e1e1e;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 10px;
        white-space: nowrap;
        cursor: pointer;
        border: 1px solid #3a3a3a;
      `;
      varPlaceholder.textContent = placeholder;
      varPlaceholder.title = "Click to copy";

      // Copy to clipboard on click
      this.registerListener(varPlaceholder, "click", () => {
        if (this.utils) {
          this.utils.copyToClipboard(placeholder);
          // Visual feedback
          const originalBg = varPlaceholder.style.background;
          varPlaceholder.style.background = "#67c23a";
          setTimeout(() => {
            varPlaceholder.style.background = originalBg;
          }, 200);
        }
      });

      const varDesc = document.createElement("span");
      varDesc.style.cssText = "color: #909090; flex: 1;";
      varDesc.textContent = description as string;

      varItem.appendChild(varPlaceholder);
      varItem.appendChild(varDesc);
      variablesList.appendChild(varItem);
    });

    container.appendChild(header);
    container.appendChild(variablesList);

    return container;
  }

  createInputForSetting(plugin, key, settingDef) {
    const currentValue = plugin.settings.store[key];
    const SettingType = window.customjs.types.SettingType;

    switch (settingDef.type) {
      case SettingType.BOOLEAN:
        return this.createBooleanInput(plugin, key, currentValue);

      case SettingType.NUMBER:
      case SettingType.BIGINT:
        return this.createNumberInput(plugin, key, currentValue);

      case SettingType.STRING:
        return this.createStringInput(
          plugin,
          key,
          currentValue,
          settingDef.placeholder
        );

      case SettingType.SELECT:
        return this.createSelectInput(
          plugin,
          key,
          currentValue,
          settingDef.options || []
        );

      case SettingType.SLIDER:
        return this.createSliderInput(
          plugin,
          key,
          currentValue,
          settingDef.markers || []
        );

      case SettingType.TIMESPAN:
        return this.createTimespanInput(plugin, key, currentValue);

      case SettingType.CUSTOM:
        return this.createCustomInput(plugin, key, currentValue);

      default:
        const span = document.createElement("span");
        span.style.cssText = "color: #f56c6c; font-size: 12px;";
        span.textContent = `Unsupported type: ${settingDef.type}`;
        return span;
    }
  }

  createBooleanInput(plugin, key, currentValue) {
    const label = document.createElement("label");
    label.className = "el-switch";
    label.style.cssText =
      "cursor: pointer; display: flex; align-items: center;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = currentValue;
    checkbox.style.display = "none";

    const core = document.createElement("span");
    core.style.cssText = `
      display: inline-block;
      position: relative;
      width: 40px;
      height: 20px;
      border-radius: 10px;
      background: ${currentValue ? "#409eff" : "#dcdfe6"};
      transition: background-color 0.3s;
      cursor: pointer;
    `;

    const action = document.createElement("span");
    action.style.cssText = `
      position: absolute;
      top: 1px;
      left: ${currentValue ? "21px" : "1px"};
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: white;
      transition: all 0.3s;
      cursor: pointer;
    `;

    core.appendChild(action);
    label.appendChild(checkbox);
    label.appendChild(core);

    this.registerListener(label, "click", (e) => {
      e.stopPropagation();

      try {
        // Read current state from checkbox instead of store to avoid Proxy issues
        const newValue = !checkbox.checked;

        // Update the store
        plugin.settings.store[key] = newValue;

        // Update UI elements
        checkbox.checked = newValue;
        core.style.background = newValue ? "#409eff" : "#dcdfe6";
        action.style.left = newValue ? "21px" : "1px";

        this.logger.log(
          `Setting ${key} changed to ${newValue} (old: ${!newValue})`
        );
      } catch (error) {
        this.logger.error(`Error toggling ${key}:`, error);
      }
    });

    return label;
  }

  createNumberInput(plugin, key, currentValue) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "el-input__inner";
    input.value = currentValue ?? "";
    input.style.cssText =
      "width: 100%; padding: 6px 10px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 13px; background: #1e1e1e; color: #e0e0e0;";

    this.registerListener(input, "change", (e) => {
      try {
        const newValue = parseFloat(input.value);
        if (!isNaN(newValue)) {
          plugin.settings.store[key] = newValue;
          this.logger.log(`Setting ${key} changed to ${newValue}`);
        }
      } catch (error) {
        this.logger.error(`Error updating ${key}:`, error);
      }
    });

    return input;
  }

  createStringInput(plugin, key, currentValue, placeholder) {
    const stringValue = currentValue || "";
    const hasNewlines = stringValue.includes("\n");

    // If string contains newlines, use multiline textarea
    if (hasNewlines) {
      return this.createMultilineTextarea(plugin, key, stringValue, {
        placeholder: placeholder,
        maxLines: 30,
        minLines: 3,
        validateJson: false,
      });
    }

    // Single line input (no newlines)
    const input = document.createElement("input");
    input.type = "text";
    input.className = "el-input__inner";
    input.value = stringValue;
    input.placeholder = placeholder || "";
    input.style.cssText =
      "width: 100%; padding: 6px 10px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 13px; background: #1e1e1e; color: #e0e0e0;";

    this.registerListener(input, "change", (e) => {
      try {
        plugin.settings.store[key] = input.value;
        this.logger.log(`Setting ${key} changed to "${input.value}"`);
      } catch (error) {
        this.logger.error(`Error updating ${key}:`, error);
      }
    });

    return input;
  }

  createMultilineTextarea(plugin: any, key: any, value: any, options: any = {}) {
    const placeholder = options.placeholder || "";
    const maxLines = options.maxLines || 30;
    const minLines = options.minLines || 3;
    const validateJson = options.validateJson || false;

    const container = document.createElement("div");
    container.style.cssText = "width: 100%;";

    const stringValue = validateJson
      ? JSON.stringify(value, null, 2)
      : value || "";
    const lineCount = Math.min(
      (stringValue.match(/\n/g) || []).length + 1,
      maxLines
    );

    const textarea = document.createElement("textarea");
    textarea.className = "el-textarea__inner";
    textarea.value = stringValue;
    textarea.placeholder = placeholder;
    textarea.rows = Math.max(lineCount, minLines);
    textarea.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #5a5a5a;
      border-radius: 4px;
      font-size: 13px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      background: #1e1e1e;
      color: #e0e0e0;
      resize: vertical;
      min-height: ${minLines * 20}px;
      max-height: ${maxLines * 20}px;
      line-height: 1.5;
    `;

    // Message containers for JSON validation
    let errorMsg, successMsg;
    if (validateJson) {
      errorMsg = document.createElement("div");
      errorMsg.style.cssText = `
        font-size: 11px;
        color: #f56c6c;
        margin-top: 4px;
        display: none;
      `;

      successMsg = document.createElement("div");
      successMsg.style.cssText = `
        font-size: 11px;
        color: #67c23a;
        margin-top: 4px;
        display: none;
      `;
    }

    // Auto-adjust height on input
    this.registerListener(textarea, "input", () => {
      const newLineCount = Math.min(
        (textarea.value.match(/\n/g) || []).length + 1,
        maxLines
      );
      textarea.rows = Math.max(newLineCount, minLines);

      if (validateJson && errorMsg && successMsg) {
        errorMsg.style.display = "none";
        successMsg.style.display = "none";
      }
    });

    // Update border color on focus
    this.registerListener(textarea, "focus", () => {
      textarea.style.borderColor = "#409eff";
    });

    // Save on blur
    this.registerListener(textarea, "blur", () => {
      textarea.style.borderColor = "#5a5a5a";

      if (validateJson) {
        // JSON validation mode
        try {
          const parsed = JSON.parse(textarea.value);
          plugin.settings.store[key] = parsed;

          // Show success
          if (successMsg) {
            successMsg.textContent = "✓ Valid JSON saved";
            successMsg.style.display = "block";
          }
          if (errorMsg) {
            errorMsg.style.display = "none";
          }

          // Re-format the JSON
          const formatted = JSON.stringify(parsed, null, 2);
          textarea.value = formatted;
          const newLineCount = Math.min(
            (formatted.match(/\n/g) || []).length + 1,
            maxLines
          );
          textarea.rows = Math.max(newLineCount, minLines);

          // Hide success message after 2 seconds
          setTimeout(() => {
            if (successMsg) successMsg.style.display = "none";
          }, 2000);
        } catch (error) {
          // Show error
          if (errorMsg) {
            errorMsg.textContent = `✗ Invalid JSON: ${error.message}`;
            errorMsg.style.display = "block";
          }
          if (successMsg) {
            successMsg.style.display = "none";
          }
          textarea.style.borderColor = "#f56c6c";
        }
      } else {
        // Plain text mode
        try {
          plugin.settings.store[key] = textarea.value;
          this.logger.log(`Setting ${key} updated (multiline)`);
        } catch (error) {
          this.logger.error(`Error updating ${key}:`, error);
        }
      }
    });

    container.appendChild(textarea);
    if (validateJson && errorMsg && successMsg) {
      container.appendChild(errorMsg);
      container.appendChild(successMsg);
    }

    return container;
  }

  createSelectInput(plugin, key, currentValue, options) {
    const select = document.createElement("select");
    select.className = "el-select";
    select.style.cssText =
      "padding: 6px 28px 6px 10px; border: 1px solid #5a5a5a; border-radius: 4px; font-size: 13px; background: #1e1e1e; color: #e0e0e0; cursor: pointer;";

    options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label || opt.value;
      if (opt.value === currentValue || opt.default) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    this.registerListener(select, "change", (e) => {
      try {
        plugin.settings.store[key] = select.value;
        this.logger.log(`Setting ${key} changed to "${select.value}"`);
      } catch (error) {
        this.logger.error(`Error updating ${key}:`, error);
      }
    });

    return select;
  }

  createSliderInput(plugin, key, currentValue, markers) {
    const container = document.createElement("div");
    container.style.cssText = "width: 100%; min-width: 120px;";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = String(markers[0] ?? 0);
    slider.max = String(markers[markers.length - 1] ?? 1);
    slider.step = String(markers.length > 1 ? markers[1] - markers[0] : 0.1);
    slider.value = String(currentValue ?? markers[0] ?? 0);
    slider.style.cssText = "width: 100%; cursor: pointer;";

    const valueDisplay = document.createElement("div");
    valueDisplay.style.cssText =
      "text-align: center; font-size: 12px; color: #b0b0b0; margin-top: 4px;";
    valueDisplay.textContent = slider.value;

    this.registerListener(slider, "input", (e) => {
      try {
        valueDisplay.textContent = slider.value;
        plugin.settings.store[key] = parseFloat(slider.value);
        this.logger.log(`Setting ${key} changed to ${slider.value}`);
      } catch (error) {
        this.logger.error(`Error updating ${key}:`, error);
      }
    });

    container.appendChild(slider);
    container.appendChild(valueDisplay);

    return container;
  }

  createTimespanInput(plugin, key, currentValue) {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: center; gap: 8px; width: 100%;";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "el-input__inner";
    input.style.cssText = "flex: 1; min-width: 120px; padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;";
    
    // Display current value in human-readable format
    const displayValue = this.utils?.formatTimespan ? this.utils.formatTimespan(currentValue) : `${currentValue}ms`;
    input.value = displayValue;
    input.placeholder = "e.g., 1h 20m, 00:50.100, or 5000";

    const valueLabel = document.createElement("span");
    valueLabel.style.cssText = "color: #909090; font-size: 12px; min-width: 80px;";
    valueLabel.textContent = `(${currentValue}ms)`;

    this.registerListener(input, "blur", (e) => {
      try {
        const inputValue = (e.target as HTMLInputElement).value;
        const parsedMs = this.utils?.parseTimespan ? this.utils.parseTimespan(inputValue) : parseInt(inputValue, 10);
        
        if (isNaN(parsedMs) || parsedMs < 0) {
          this.logger.showWarning("Invalid timespan format");
          input.value = displayValue;
          return;
        }

        plugin.settings.store[key] = parsedMs;
        
        // Update display
        const newDisplay = this.utils?.formatTimespan ? this.utils.formatTimespan(parsedMs) : `${parsedMs}ms`;
        input.value = newDisplay;
        valueLabel.textContent = `(${parsedMs}ms)`;
        
        this.logger.log(`Timespan ${key} changed to ${parsedMs}ms (${newDisplay})`);
      } catch (error) {
        this.logger.error(`Error updating timespan ${key}:`, error);
        input.value = displayValue;
      }
    });

    this.registerListener(input, "keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        input.blur();
      }
    });

    container.appendChild(input);
    container.appendChild(valueLabel);
    return container;
  }

  createCustomInput(plugin, key, currentValue) {
    // Use shared multiline textarea with JSON validation
    return this.createMultilineTextarea(plugin, key, currentValue, {
      placeholder: "",
      maxLines: 50,
      minLines: 2,
      validateJson: true,
    });
  }

  /**
   * Format build date from Unix timestamp
   * @param {string|number} build - Build timestamp (Unix timestamp in seconds or milliseconds)
   * @returns {string} Formatted date or unparsed value if parsing fails
   */
  formatBuildDate(build) {
    if (!build) return "Unknown";

    try {
      // Convert to number if string
      let timestamp = typeof build === "string" ? parseInt(build, 10) : build;

      // Check if it's a valid number
      if (isNaN(timestamp)) {
        return build.toString();
      }

      // Convert to milliseconds if it's in seconds (Unix timestamp is usually in seconds)
      // Timestamps in seconds are typically 10 digits, milliseconds are 13 digits
      if (timestamp.toString().length === 10) {
        timestamp = timestamp * 1000;
      }

      // Create date object
      const date = new Date(timestamp);

      // Check if date is valid and reasonable (between 2020 and 2050)
      const year = date.getFullYear();
      if (
        isNaN(date.getTime()) ||
        year < 2020 ||
        year > 2050 ||
        date.getTime() < 0
      ) {
        return build.toString();
      }

      // Format: "Jan 15, 2024 14:30"
      const options = {
        year: "numeric" as const,
        month: "short" as const,
        day: "numeric" as const,
        hour: "2-digit" as const,
        minute: "2-digit" as const,
      };
      return date.toLocaleString("en-US", options);
    } catch (error) {
      // If any error occurs during parsing, return the unparsed value
      return build.toString();
    }
  }

  /**
   * Format category name for display
   * @param {string} key - Category key
   * @returns {string} Formatted name
   */
  formatCategoryName(key) {
    // Convert camelCase or snake_case to Title Case
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format setting name for display
   * @param {string} key - Setting key
   * @returns {string} Formatted name
   */
  formatSettingName(key) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Infer type from value
   * @param {any} value - Value to check
   * @returns {string} Type name
   */
  inferType(value) {
    if (value === null || value === undefined) return "string";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return "string";
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = PluginManagerUIPlugin;
