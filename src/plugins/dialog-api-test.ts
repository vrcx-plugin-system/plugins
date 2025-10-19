// 
class DialogApiTestPlugin extends CustomModule {
  dialogApi: any;

  constructor() {
    super({
      name: "🧪 Dialog API Test",
      description: "Test plugin to demonstrate Dialog API functionality",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["Test", "Example", "Dialog"],
      dependencies: [],
    });
  }

  async load() {
    const SettingType = window.customjs.types.SettingType;

    this.settings = this.defineSettings({
      showOnLogin: {
        type: SettingType.BOOLEAN,
        description: "Show test dialog on login",
        default: false,
      },
    });

    this.logger.log("Dialog API Test plugin ready");
    this.loaded = true;
  }

  async start() {
    // Wait for dialog API to be available
    this.dialogApi = await window.customjs.waitForModule("dialog-api");

    if (!this.dialogApi) {
      this.logger.error("Dialog API not found! Please enable the Dialog API plugin.");
      return;
    }

    // Register example dialogs
    this.registerExampleDialogs();

    this.enabled = true;
    this.started = true;
    this.logger.log("Dialog API Test plugin started");
  }

  async onLogin(currentUser: any) {
    if (this.settings.store.showOnLogin) {
      // Show a welcome dialog
      const welcomeDialog = this.dialogApi.registerDialog("dialog-test-welcome", {
        title: `Welcome ${currentUser.displayName}! 👋`,
        content: `
          <div style="text-align: center; padding: 20px;">
            <h2 style="color: #409eff; margin-bottom: 15px;">Dialog API Test</h2>
            <p style="margin-bottom: 10px;">This is a custom dialog created using the Dialog API!</p>
            <p style="color: #909399; font-size: 12px;">This dialog appears because "Show on Login" is enabled in settings.</p>
          </div>
        `,
        width: "500px",
        footer: `
          <button class="el-button el-button--primary" onclick="window.customjs.getModule('dialog-api').closeDialog('dialog-test-welcome')">
            <span>Got it!</span>
          </button>
        `,
      });

      setTimeout(() => welcomeDialog.show(), 2000);
    }
  }

  async stop() {
    this.logger.log("Stopping Dialog API Test");

    // Clean up dialogs
    if (this.dialogApi) {
      this.dialogApi.destroyDialog("dialog-test-simple");
      this.dialogApi.destroyDialog("dialog-test-custom");
      this.dialogApi.destroyDialog("dialog-test-fullscreen");
      this.dialogApi.destroyDialog("dialog-test-welcome");
    }

    await super.stop();
  }

  registerExampleDialogs() {
    // 1. Simple Dialog
    const simpleDialog = this.dialogApi.registerDialog("dialog-test-simple", {
      title: "📝 Simple Dialog",
      content: `
        <div style="padding: 10px;">
          <p>This is a simple dialog with default options.</p>
          <p style="color: #909399; font-size: 12px; margin-top: 10px;">
            Features: Close button, modal backdrop, ESC to close, click outside to close
          </p>
        </div>
      `,
      width: "400px",
    });

    this.logger.log("Registered simple dialog");

    // 2. Custom Styled Dialog with HTML Content
    const customDialog = this.dialogApi.registerDialog("dialog-test-custom", {
      title: "🎨 Custom Styled Dialog",
      width: "600px",
      content: this.createCustomContent(),
      footer: this.createCustomFooter(),
      onOpen: () => {
        this.logger.log("Custom dialog opened!");
      },
      onClose: () => {
        this.logger.log("Custom dialog closed!");
      },
    });

    this.logger.log("Registered custom dialog");

    // 3. Fullscreen Dialog
    const fullscreenDialog = this.dialogApi.registerDialog("dialog-test-fullscreen", {
      title: "🖥️ Fullscreen Dialog",
      content: `
        <div style="padding: 20px;">
          <h3 style="color: #67c23a; margin-bottom: 15px;">Fullscreen Mode</h3>
          <p>This dialog takes up the entire screen.</p>
          <p style="margin-top: 10px;">You can use this for:</p>
          <ul style="margin-left: 20px; margin-top: 5px;">
            <li>Image viewers</li>
            <li>Detailed forms</li>
            <li>Rich content displays</li>
            <li>Settings panels</li>
          </ul>
        </div>
      `,
      fullscreen: true,
      draggable: false,
    });

    this.logger.log("Registered fullscreen dialog");

    // Log available commands
    this.logger.log("📋 Test dialogs registered. Try these commands:");
    this.logger.log("  window.customjs.getModule('dialog-api').showDialog('dialog-test-simple')");
    this.logger.log("  window.customjs.getModule('dialog-api').showDialog('dialog-test-custom')");
    this.logger.log("  window.customjs.getModule('dialog-api').showDialog('dialog-test-fullscreen')");
  }

  createCustomContent(): HTMLElement {
    const container = document.createElement("div");
    container.style.cssText = "padding: 15px;";

    // Add some interactive content
    const title = document.createElement("h3");
    title.textContent = "Interactive Content";
    title.style.cssText = "color: #409eff; margin-bottom: 15px;";
    container.appendChild(title);

    const description = document.createElement("p");
    description.textContent = "This dialog has custom HTML content with interactive elements:";
    description.style.cssText = "margin-bottom: 15px;";
    container.appendChild(description);

    // Add a button
    const button = document.createElement("button");
    button.className = "el-button el-button--success";
    button.innerHTML = '<span>Click Me!</span>';
    button.style.cssText = "margin-right: 10px;";
    
    this.registerListener(button, "click", () => {
      this.logger.showSuccess("Button clicked!");
    });

    container.appendChild(button);

    // Add an input
    const input = document.createElement("input");
    input.className = "el-input__inner";
    input.placeholder = "Type something...";
    input.style.cssText = "width: 200px; margin-right: 10px;";
    container.appendChild(input);

    // Add a toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "el-button el-button--primary";
    toggleBtn.innerHTML = '<span>Log Input</span>';
    
    this.registerListener(toggleBtn, "click", () => {
      const value = input.value;
      if (value) {
        this.logger.log(`Input value: ${value}`);
      } else {
        this.logger.showWarning("Please enter some text first");
      }
    });

    container.appendChild(toggleBtn);

    return container;
  }

  createCustomFooter(): HTMLElement {
    const footer = document.createElement("div");
    footer.style.cssText = "display: flex; justify-content: space-between;";

    // Left side buttons
    const leftButtons = document.createElement("div");

    const infoBtn = document.createElement("button");
    infoBtn.className = "el-button el-button--info";
    infoBtn.innerHTML = '<span>Info</span>';
    
    this.registerListener(infoBtn, "click", () => {
      this.logger.showInfo("This is a custom footer with multiple actions!");
    });

    leftButtons.appendChild(infoBtn);

    // Right side buttons
    const rightButtons = document.createElement("div");

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "el-button";
    cancelBtn.innerHTML = '<span>Cancel</span>';
    
    this.registerListener(cancelBtn, "click", () => {
      this.dialogApi.closeDialog("dialog-test-custom");
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "el-button el-button--primary";
    confirmBtn.innerHTML = '<span>Confirm</span>';
    confirmBtn.style.cssText = "margin-left: 10px;";
    
    this.registerListener(confirmBtn, "click", () => {
      this.logger.showSuccess("Confirmed!");
      this.dialogApi.closeDialog("dialog-test-custom");
    });

    rightButtons.appendChild(cancelBtn);
    rightButtons.appendChild(confirmBtn);

    footer.appendChild(leftButtons);
    footer.appendChild(rightButtons);

    return footer;
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = DialogApiTestPlugin;
