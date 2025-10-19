// 
class PluginAnalyzerPlugin extends CustomModule {
  dialogApi: any;

  constructor() {
    super({
      name: "🔍 Plugin Analyzer",
      description: "Analyzes plugin code and shows detailed metadata and statistics",
      authors: [
        {
          name: "Bluscream",
        }
      ],
      tags: ["Tool", "Utility", "Analysis"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/dialog-api.js",
      ],
    });
  }

  async load() {
    this.logger.log("Plugin Analyzer ready");
    this.loaded = true;
  }

  async start() {
    // Wait for dialog API to be available
    this.dialogApi = await window.customjs.waitForModule("dialog-api");

    if (!this.dialogApi) {
      this.logger.error("Dialog API not found! Please enable the Dialog API plugin.");
      return;
    }

    this.enabled = true;
    this.started = true;
    this.logger.log("Plugin Analyzer started");
  }

  async stop() {
    this.logger.log("Stopping Plugin Analyzer");

    // Clean up any open analysis dialogs
    if (this.dialogApi) {
      const dialogIds = this.dialogApi.getAllDialogIds();
      for (const id of dialogIds) {
        if (id.startsWith("plugin-analysis-")) {
          this.dialogApi.destroyDialog(id);
        }
      }
    }

    await super.stop();
  }

  /**
   * Analyze a plugin from URL and show results dialog
   */
  async analyzePlugin(pluginUrl: string): Promise<void> {
    if (!pluginUrl) {
      this.logger.warn("No URL provided for analysis");
      this.logger.showWarning("Plugin URL not available");
      return;
    }

    try {
      this.logger.log(`🔍 Analyzing plugin: ${pluginUrl}`);
      this.logger.showInfo("Analyzing plugin code...");

      // Try to get module from repository first for metadata
      let repoMetadata = null;
      let sourceUrl = null;
      let loadedModule = null;

      // Check if module is currently loaded
      if (window.customjs?.modules) {
        loadedModule = window.customjs.modules.find((m: any) => m.metadata?.url === pluginUrl);
        if (loadedModule) {
          this.logger.log(`✓ Found loaded module instance: ${loadedModule.metadata.name}`);
        }
      }

      // Find module in repositories using the repository system
      if (window.customjs?.repos) {
        for (const repo of window.customjs.repos) {
          if (!repo.getModules) continue;
          
          const modules = repo.getModules();
          const module = modules.find((m: any) => m.url === pluginUrl);
          
          if (module) {
            repoMetadata = module;
            sourceUrl = module.sourceUrl;
            this.logger.log(`✓ Found module in repository: ${repo.url}`);
            this.logger.log(`  → Source URL: ${sourceUrl || 'Not available'}`);
            break;
          }
        }
        
        if (!repoMetadata) {
          this.logger.log("Module not found in any repository, using URL-only analysis");
        }
      }

      // Use CustomModule static method to fetch detailed analysis
      const CustomModuleClass = window.customjs.classes.CustomModule as any;
      if (!CustomModuleClass?.fetchMetadata) {
        this.logger.error("CustomModule.fetchMetadata not available");
        this.logger.showError("Analysis feature not available");
        return;
      }

      const codeMetadata = await CustomModuleClass.fetchMetadata(pluginUrl);

      if (codeMetadata) {
        // Merge repo metadata with code analysis and runtime info
        const metadata = {
          ...codeMetadata,
          sourceUrl: sourceUrl || codeMetadata.sourceUrl,
          repoData: repoMetadata,
          loadedModule: loadedModule,
          isLoaded: !!loadedModule,
          isStarted: loadedModule?.started || false,
          isEnabled: loadedModule?.enabled || false,
        };

        this.logger.log("Plugin analysis complete", metadata);
        this.showAnalysisDialog(metadata);
      } else {
        this.logger.error("Failed to extract metadata");
        this.logger.showError("Failed to analyze plugin");
      }
    } catch (error: any) {
      this.logger.error("Error analyzing plugin:", error);
      this.logger.showError(`Analysis error: ${error.message}`);
    }
  }

  /**
   * Show analysis dialog with plugin metadata
   */
  showAnalysisDialog(metadata: any): void {
    const dialogId = `plugin-analysis-${Date.now()}`;

    // Build the dialog content
    const content = this.buildAnalysisContent(metadata);

    // Register and show dialog
    const controller = this.dialogApi.registerDialog(dialogId, {
      title: `🔍 Plugin Analysis: ${metadata.name || "Unknown"}`,
      content: content,
      width: "900px",
      modal: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
      onClose: () => {
        this.dialogApi.destroyDialog(dialogId);
      },
    });

    controller.show();
    this.logger.showSuccess("Analysis complete");
  }

  /**
   * Build the analysis content HTML element
   */
  buildAnalysisContent(metadata: any): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = "padding: 0;";

    // Build basic info data object
    const basicInfo: Record<string, any> = {
      Name: metadata.name,
      Description: metadata.description,
      Authors: metadata.authors?.map((a: any) => a.name).join(", ") || "Unknown",
      Build: metadata.build,
      "Class Name": metadata.className,
      URL: metadata.url,
    };

    // Add source URL if available
    if (metadata.sourceUrl) {
      basicInfo["Source URL"] = metadata.sourceUrl;
    }

    // Add repo data if available
    if (metadata.repoData) {
      if (metadata.repoData.id) {
        basicInfo["Module ID"] = metadata.repoData.id;
      }
      if (metadata.repoData.enabled !== undefined) {
        basicInfo["Enabled by Default"] = metadata.repoData.enabled ? "Yes" : "No";
      }
    }

    // Add runtime status if module is loaded
    if (metadata.isLoaded) {
      basicInfo["Status"] = metadata.isStarted 
        ? (metadata.isEnabled ? "✓ Running" : "Stopped") 
        : "Loaded (not started)";
    } else {
      basicInfo["Status"] = "Not loaded";
    }

    // Create sections
    const sections = [
      {
        title: "Basic Information",
        data: basicInfo,
      },
      {
        title: "Code Metrics",
        data: {
          Size: metadata.sizeFormatted,
          "Line Count": metadata.lineCount,
          "Function Count": metadata.functionCount,
          "Event Handlers": metadata.eventHandlerCount,
        },
      },
      {
        title: "Settings",
        data: {
          "Settings Count": metadata.settingsCount,
          "Categories Count": metadata.categoriesCount,
        },
      },
      {
        title: "Resource Registrations",
        data: {
          Observers: metadata.observerCount,
          Listeners: metadata.listenerCount,
          Subscriptions: metadata.subscriptionCount,
          Hooks: metadata.hookCount,
          Timers: metadata.timerCount,
        },
      },
      {
        title: "Lifecycle Methods",
        data: {
          "Has load()": metadata.lifecycle?.hasLoad ? "✓" : "✗",
          "Has start()": metadata.lifecycle?.hasStart ? "✓" : "✗",
          "Has stop()": metadata.lifecycle?.hasStop ? "✓" : "✗",
          "Has onLogin()": metadata.lifecycle?.hasOnLogin ? "✓" : "✗",
        },
      },
      {
        title: "External APIs",
        data: {
          AppApi: metadata.externalApis?.usesAppApi ? "✓" : "✗",
          Pinia: metadata.externalApis?.usesPinia ? "✓" : "✗",
          "Vue Router": metadata.externalApis?.usesVueRouter ? "✓" : "✗",
          "VRCX API": metadata.externalApis?.usesVRCXAPI ? "✓" : "✗",
          "Web API": metadata.externalApis?.usesWebAPI ? "✓" : "✗",
        },
      },
      {
        title: "Resource Usage",
        data: {
          "Creates DOM": metadata.resourceUsage?.createsDomElements ? "✓" : "✗",
          "Modifies DOM": metadata.resourceUsage?.modifiesDom ? "✓" : "✗",
          localStorage: metadata.resourceUsage?.usesLocalStorage ? "✓" : "✗",
          sessionStorage: metadata.resourceUsage?.usesSessionStorage ? "✓" : "✗",
          WebSocket: metadata.resourceUsage?.usesWebSocket ? "✓" : "✗",
        },
      },
    ];

    if (metadata.tags && metadata.tags.length > 0) {
      sections.push({
        title: "Tags",
        data: { "Tag List": metadata.tags.join(", ") },
      });
    }

    if (metadata.dependencies && metadata.dependencies.length > 0) {
      sections.push({
        title: "Dependencies",
        data: { "Dependency Count": metadata.dependencies.length },
      });
    }

    sections.forEach((section) => {
      const sectionEl = this.createAnalysisSection(section.title, section.data);
      container.appendChild(sectionEl);
    });

    // Source code section
    if (metadata.sourceCode) {
      const sourceSection = document.createElement("div");
      sourceSection.style.cssText = "margin-top: 20px;";

      const sourceHeader = document.createElement("h4");
      sourceHeader.style.cssText =
        "margin: 0 0 10px 0; color: #409eff; font-size: 14px; text-transform: uppercase;";
      sourceHeader.textContent = "Source Code";

      const sourceCode = document.createElement("pre");
      sourceCode.style.cssText = `
        background: #1e1e1e;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        max-height: 400px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        color: #d4d4d4;
        line-height: 1.5;
      `;
      sourceCode.textContent = metadata.sourceCode;

      sourceSection.appendChild(sourceHeader);
      sourceSection.appendChild(sourceCode);
      container.appendChild(sourceSection);
    }

    return container;
  }

  /**
   * Create a section for analysis display
   */
  createAnalysisSection(title: string, data: Record<string, any>): HTMLElement {
    const section = document.createElement("div");
    section.style.cssText = "margin-bottom: 15px;";

    const header = document.createElement("h4");
    header.style.cssText =
      "margin: 0 0 8px 0; color: #409eff; font-size: 14px; text-transform: uppercase;";
    header.textContent = title;

    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 8px;
      font-size: 13px;
    `;

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const keyEl = document.createElement("div");
      keyEl.style.cssText = "color: #909090; font-weight: 500;";
      keyEl.textContent = key + ":";

      const valueEl = document.createElement("div");
      valueEl.style.cssText = "color: #e0e0e0;";
      valueEl.textContent = String(value);

      grid.appendChild(keyEl);
      grid.appendChild(valueEl);
    });

    section.appendChild(header);
    section.appendChild(grid);

    return section;
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = PluginAnalyzerPlugin;
