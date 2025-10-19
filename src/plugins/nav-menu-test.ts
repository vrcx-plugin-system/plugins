// @ts-nocheck
// TODO: Remove @ts-nocheck and fix type definitions properly

class NavMenuTestPlugin extends Plugin {
  constructor() {
    super({
      name: "🧪 Nav Menu API Test",
      description:
        "Test plugin to verify nav-menu-api functionality with extensive debug logging",
      authors: [
      {
        name: "Bluscream",
      }
    ],
      build: "1760847187",
      tags: ["Debug", "Experimental"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/nav-menu-api.js",
      ],
    });

    this.navMenuApi = null;
    this.tabShowCount = 0;
    this.tabHideCount = 0;
    this.buttonClickCount = 0;
  }

  async load() {
    this.logger.log("📦 Nav Menu Test Plugin ready");
    this.loaded = true;
  }

  async start() {
    this.logger.log("🚀 Starting Nav Menu Test Plugin...");

    // Wait for nav-menu-api dependency
    this.logger.log("⏳ Waiting for nav-menu-api plugin...");
    this.navMenuApi = await window.customjs.pluginManager.waitForPlugin(
      "nav-menu-api"
    );

    if (!this.navMenuApi) {
      this.logger.error("❌ Nav Menu API plugin not found after waiting");
      return;
    }
    this.logger.log("✅ nav-menu-api plugin found!");

    // Test 1: Add a tab item with content and lifecycle callbacks
    this.logger.log("🧪 TEST 1: Adding tab item with content...");
    this.navMenuApi.addItem("test-tab", {
      label: "Test Tab",
      icon: "ri-flask-line",
      content: () => this.createTestTabContent(),
      before: "settings",
      onShow: () => this.onTestTabShown(),
      onHide: () => this.onTestTabHidden(),
    });
    this.logger.log("✅ TEST 1: Tab item added");

    // Test 2: Add a button item without content
    this.logger.log("🧪 TEST 2: Adding button item without content...");
    this.navMenuApi.addItem("test-button", {
      label: "Test Button",
      icon: "ri-flashlight-line",
      onClick: () => this.onTestButtonClick(),
      after: "test-tab",
      // No content = button only
    });
    this.logger.log("✅ TEST 2: Button item added");

    // Test 3: Check if items were registered
    this.logger.log("🧪 TEST 3: Checking registered items...");
    const hasTab = this.navMenuApi.hasItem("test-tab");
    const hasButton = this.navMenuApi.hasItem("test-button");
    this.logger.log(
      `✅ TEST 3: test-tab exists: ${hasTab}, test-button exists: ${hasButton}`
    );

    // Test 4: Get all items
    this.logger.log("🧪 TEST 4: Getting all items...");
    const allItems = this.navMenuApi.getAllItems();
    this.logger.log(`✅ TEST 4: Found ${allItems.length} total custom items`);
    allItems.forEach((item) => {
      this.logger.log(
        `  - ${item.id}: ${item.label} (content: ${!!item.content})`
      );
    });

    this.enabled = true;
    this.started = true;
    this.logger.log("🎉 Nav Menu Test Plugin started successfully");
  }

  createTestTabContent() {
    this.logger.log("🎨 createTestTabContent() called");

    const container = document.createElement("div");
    container.style.cssText = `
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    `;

    // Title
    const title = document.createElement("h2");
    title.textContent = "🧪 Nav Menu API Test Results";
    title.style.cssText =
      "margin: 0 0 20px 0; font-size: 24px; font-weight: 600;";
    container.appendChild(title);

    // Test Results Section
    const resultsSection = document.createElement("div");
    resultsSection.style.cssText = `
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    `;

    const resultsTitle = document.createElement("h3");
    resultsTitle.textContent = "📊 Test Statistics";
    resultsTitle.style.cssText = "margin: 0 0 15px 0; font-size: 18px;";
    resultsSection.appendChild(resultsTitle);

    // Stats
    const statsList = document.createElement("ul");
    statsList.style.cssText = "list-style: none; padding: 0; margin: 0;";

    const stats = [
      { label: "Tab Shows", value: this.tabShowCount },
      { label: "Tab Hides", value: this.tabHideCount },
      { label: "Button Clicks", value: this.buttonClickCount },
    ];

    stats.forEach((stat) => {
      const li = document.createElement("li");
      li.style.cssText = "padding: 8px 0; border-bottom: 1px solid #dee2e6;";
      li.innerHTML = `<strong>${
        stat.label
      }:</strong> <span id="stat-${stat.label
        .toLowerCase()
        .replace(" ", "-")}">${stat.value}</span>`;
      statsList.appendChild(li);
    });

    resultsSection.appendChild(statsList);
    container.appendChild(resultsSection);

    // Instructions Section
    const instructionsSection = document.createElement("div");
    instructionsSection.style.cssText = `
      background: #e7f3ff;
      border: 2px solid #2196f3;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    `;

    const instructionsTitle = document.createElement("h3");
    instructionsTitle.textContent = "📋 Test Instructions";
    instructionsTitle.style.cssText =
      "margin: 0 0 15px 0; font-size: 18px; color: #2196f3;";
    instructionsSection.appendChild(instructionsTitle);

    const instructions = document.createElement("ol");
    instructions.style.cssText =
      "margin: 0; padding-left: 20px; line-height: 1.8;";

    const steps = [
      "Click the 'Test Button' in the nav menu - it should flash briefly",
      "Switch to another tab (e.g., Feed) - onHide should fire",
      "Switch back to 'Test Tab' - onShow should fire",
      "Check browser console for detailed logs",
      "Watch the statistics above update with each action",
    ];

    steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      instructions.appendChild(li);
    });

    instructionsSection.appendChild(instructions);
    container.appendChild(instructionsSection);

    // Update Button
    const updateBtn = document.createElement("button");
    updateBtn.className = "el-button el-button--primary";
    updateBtn.style.cssText = "width: 100%; margin-top: 20px;";
    updateBtn.innerHTML =
      '<i class="ri-refresh-line"></i> Update Statistics Display';

    this.registerListener(updateBtn, "click", () => {
      this.logger.log("🔄 Updating statistics display...");
      this.updateStatsDisplay(container);
    });

    container.appendChild(updateBtn);

    // Console Output Section
    const consoleSection = document.createElement("div");
    consoleSection.style.cssText = `
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    `;

    const consoleTitle = document.createElement("h3");
    consoleTitle.textContent = "📝 Recent Events";
    consoleTitle.style.cssText = "margin: 0 0 15px 0; font-size: 18px;";
    consoleSection.appendChild(consoleTitle);

    const consoleOutput = document.createElement("pre");
    consoleOutput.id = "test-console-output";
    consoleOutput.style.cssText = `
      background: #2d2d2d;
      color: #00ff88;
      padding: 15px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
      font-size: 12px;
      max-height: 300px;
      overflow-y: auto;
      margin: 0;
    `;
    consoleOutput.textContent = "Waiting for events...\n";

    consoleSection.appendChild(consoleOutput);
    container.appendChild(consoleSection);

    this.logger.log("✅ Test tab content created");
    return container;
  }

  onTestTabShown() {
    this.tabShowCount++;
    this.logger.log(`🎯 TEST TAB SHOWN (count: ${this.tabShowCount})`);
    this.logger.log(`  - Tab has been shown ${this.tabShowCount} time(s)`);
    this.logger.log(
      `  - Current menu index: ${window.$pinia?.ui?.menuActiveIndex}`
    );

    this.updateStatsDisplay();
    this.addConsoleEvent(`onShow fired (${this.tabShowCount})`);
  }

  onTestTabHidden() {
    this.tabHideCount++;
    this.logger.log(`👋 TEST TAB HIDDEN (count: ${this.tabHideCount})`);
    this.logger.log(`  - Tab has been hidden ${this.tabHideCount} time(s)`);
    this.logger.log(
      `  - Current menu index: ${window.$pinia?.ui?.menuActiveIndex}`
    );

    this.updateStatsDisplay();
    this.addConsoleEvent(`onHide fired (${this.tabHideCount})`);
  }

  onTestButtonClick() {
    this.buttonClickCount++;
    this.logger.log(`🔘 TEST BUTTON CLICKED (count: ${this.buttonClickCount})`);
    this.logger.log(
      `  - Button has been clicked ${this.buttonClickCount} time(s)`
    );
    this.logger.log(
      `  - Current menu index: ${window.$pinia?.ui?.menuActiveIndex}`
    );
    this.logger.log(`  - Menu should NOT have changed (button-only item)`);

    this.updateStatsDisplay();
    this.addConsoleEvent(`Button clicked (${this.buttonClickCount})`);

    this.logger.showSuccess(
      `Test button clicked ${this.buttonClickCount} times!`
    );
  }

  updateStatsDisplay(container) {
    const getStatElement = (id) => document.getElementById(id);

    const showsStat = getStatElement("stat-tab-shows");
    const hidesStat = getStatElement("stat-tab-hides");
    const clicksStat = getStatElement("stat-button-clicks");

    if (showsStat) showsStat.textContent = this.tabShowCount;
    if (hidesStat) hidesStat.textContent = this.tabHideCount;
    if (clicksStat) clicksStat.textContent = this.buttonClickCount;

    this.logger.log(
      `📊 Updated stats display: shows=${this.tabShowCount}, hides=${this.tabHideCount}, clicks=${this.buttonClickCount}`
    );
  }

  addConsoleEvent(message) {
    const consoleOutput = document.getElementById("test-console-output");
    if (consoleOutput) {
      const timestamp = new Date().toLocaleTimeString();
      const line = `[${timestamp}] ${message}\n`;
      consoleOutput.textContent += line;

      // Auto-scroll to bottom
      consoleOutput.scrollTop = consoleOutput.scrollHeight;

      this.logger.log(`📝 Added console event: ${message}`);
    }
  }

  async stop() {
    this.logger.log("🛑 Stopping Nav Menu Test Plugin");

    if (this.navMenuApi) {
      this.logger.log("🧹 Removing test-tab item...");
      this.navMenuApi.removeItem("test-tab");

      this.logger.log("🧹 Removing test-button item...");
      this.navMenuApi.removeItem("test-button");

      this.logger.log("✅ All test items removed");
    }

    await super.stop();
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = NavMenuTestPlugin;
