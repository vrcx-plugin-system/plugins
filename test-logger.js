class TestLoggerPlugin extends Plugin {
  constructor() {
    super({
      name: "Logger Tester",
      description: "Test different VRCX notification and logging methods",
      author: "Bluscream",
      version: "1.0.0",
      build: "0",
      tags: ["Debug", "Utility"],
      dependencies: [
        "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/nav-menu-api.js",
      ],
    });

    this.navMenuApi = null;
    this.testMessage = "Test notification from Logger Tester";
  }

  async load() {
    this.logger.log("Logger Tester ready");
    this.loaded = true;
  }

  async start() {
    this.navMenuApi = await window.customjs.pluginManager.waitForPlugin(
      "nav-menu-api"
    );

    if (!this.navMenuApi) {
      this.logger.error("Nav Menu API plugin not found");
      return;
    }

    this.navMenuApi.addItem("logger-tester", {
      label: "Logger Test",
      icon: "ri-bug-line",
      content: () => this.createTestInterface(),
      position: -1, // Insert at the end
    });

    this.enabled = true;
    this.started = true;
  }

  createTestInterface() {
    const container = document.createElement("div");
    container.style.cssText = `
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    `;

    // Header
    const header = document.createElement("h2");
    header.style.cssText = "color: #e0e0e0; margin-bottom: 20px;";
    header.textContent = "VRCX Logger & Notification Tester";

    // Description
    const desc = document.createElement("p");
    desc.style.cssText = "color: #b0b0b0; margin-bottom: 20px;";
    desc.textContent =
      "Test different notification methods available in VRCX. Enter a message and click the buttons to see which methods work.";

    // Message input
    const inputLabel = document.createElement("label");
    inputLabel.style.cssText =
      "display: block; color: #e0e0e0; margin-bottom: 8px; font-weight: 500;";
    inputLabel.textContent = "Test Message:";

    const textarea = document.createElement("textarea");
    textarea.className = "el-textarea__inner";
    textarea.value = this.testMessage;
    textarea.rows = 3;
    textarea.style.cssText = `
      width: 100%;
      padding: 10px;
      border: 1px solid #5a5a5a;
      border-radius: 4px;
      font-size: 14px;
      background: #1e1e1e;
      color: #e0e0e0;
      resize: vertical;
      margin-bottom: 20px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    `;

    // Update test message when input changes
    textarea.addEventListener("input", () => {
      this.testMessage = textarea.value;
    });

    // Results display
    const results = document.createElement("div");
    results.id = "test-results";
    results.style.cssText = `
      background: #2a2a2a;
      border: 1px solid #404040;
      border-radius: 4px;
      padding: 15px;
      margin-top: 20px;
      max-height: 400px;
      overflow-y: auto;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      display: none;
    `;

    // Helper to log results
    const logResult = (name, success, details = "") => {
      const line = document.createElement("div");
      line.style.cssText = `
        padding: 4px 0;
        color: ${success ? "#4caf50" : "#f44336"};
      `;
      line.textContent = `${success ? "✓" : "✗"} ${name}${
        details ? " - " + details : ""
      }`;
      results.appendChild(line);
      results.style.display = "block";
    };

    const clearResults = () => {
      results.innerHTML = "";
      results.style.display = "none";
    };

    // Create button sections
    const sections = [
      {
        title: "Element Plus (via globalProperties)",
        buttons: [
          {
            label: "$message.success()",
            color: "#67c23a",
            test: async () => {
              const $message = window.$app?.config?.globalProperties?.$message;
              if ($message?.success) {
                $message.success(this.testMessage);
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$message.warning()",
            color: "#e6a23c",
            test: async () => {
              const $message = window.$app?.config?.globalProperties?.$message;
              if ($message?.warning) {
                $message.warning(this.testMessage);
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$message.error()",
            color: "#f56c6c",
            test: async () => {
              const $message = window.$app?.config?.globalProperties?.$message;
              if ($message?.error) {
                $message.error(this.testMessage);
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$message.info()",
            color: "#409eff",
            test: async () => {
              const $message = window.$app?.config?.globalProperties?.$message;
              if ($message?.info) {
                $message.info(this.testMessage);
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$notify.success()",
            color: "#67c23a",
            test: async () => {
              const $notify = window.$app?.config?.globalProperties?.$notify;
              if ($notify?.success) {
                $notify.success({
                  title: "Logger Test",
                  message: this.testMessage,
                });
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$notify.warning()",
            color: "#e6a23c",
            test: async () => {
              const $notify = window.$app?.config?.globalProperties?.$notify;
              if ($notify?.warning) {
                $notify.warning({
                  title: "Logger Test",
                  message: this.testMessage,
                });
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$notify.error()",
            color: "#f56c6c",
            test: async () => {
              const $notify = window.$app?.config?.globalProperties?.$notify;
              if ($notify?.error) {
                $notify.error({
                  title: "Logger Test",
                  message: this.testMessage,
                });
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
          {
            label: "$notify.info()",
            color: "#409eff",
            test: async () => {
              const $notify = window.$app?.config?.globalProperties?.$notify;
              if ($notify?.info) {
                $notify.info({
                  title: "Logger Test",
                  message: this.testMessage,
                });
                return { success: true };
              }
              throw new Error("Not available");
            },
          },
        ],
      },
      {
        title: "AppApi Notifications",
        buttons: [
          {
            label: "Desktop Notification",
            color: "#9c27b0",
            test: async () => {
              if (window.AppApi?.DesktopNotification) {
                await window.AppApi.DesktopNotification(
                  "Logger Test",
                  this.testMessage
                );
                return { success: true };
              }
              throw new Error("AppApi.DesktopNotification not available");
            },
          },
          {
            label: "XSOverlay (VR)",
            color: "#ff9800",
            test: async () => {
              if (window.AppApi?.XSNotification) {
                await window.AppApi.XSNotification(
                  "Logger Test",
                  this.testMessage,
                  3000,
                  1.0,
                  ""
                );
                return { success: true };
              }
              throw new Error("AppApi.XSNotification not available");
            },
          },
          {
            label: "OVRToolkit (VR)",
            color: "#ff5722",
            test: async () => {
              if (window.AppApi?.OVRTNotification) {
                await window.AppApi.OVRTNotification(
                  true,
                  true,
                  "Logger Test",
                  this.testMessage,
                  3000,
                  1.0,
                  null
                );
                return { success: true };
              }
              throw new Error("AppApi.OVRTNotification not available");
            },
          },
        ],
      },
      {
        title: "Noty Library (VRCX Login Messages)",
        buttons: [
          {
            label: "Noty Success",
            color: "#67c23a",
            test: async () => {
              if (typeof Noty !== "undefined") {
                new Noty({
                  type: "success",
                  text: this.testMessage,
                }).show();
                return { success: true };
              }
              throw new Error("Noty library not available");
            },
          },
          {
            label: "Noty Info",
            color: "#409eff",
            test: async () => {
              if (typeof Noty !== "undefined") {
                new Noty({
                  type: "info",
                  text: this.testMessage,
                }).show();
                return { success: true };
              }
              throw new Error("Noty library not available");
            },
          },
          {
            label: "Noty Warning",
            color: "#e6a23c",
            test: async () => {
              if (typeof Noty !== "undefined") {
                new Noty({
                  type: "warning",
                  text: this.testMessage,
                }).show();
                return { success: true };
              }
              throw new Error("Noty library not available");
            },
          },
          {
            label: "Noty Error",
            color: "#f56c6c",
            test: async () => {
              if (typeof Noty !== "undefined") {
                new Noty({
                  type: "error",
                  text: this.testMessage,
                }).show();
                return { success: true };
              }
              throw new Error("Noty library not available");
            },
          },
          {
            label: "Noty Alert",
            color: "#ff9800",
            test: async () => {
              if (typeof Noty !== "undefined") {
                new Noty({
                  type: "alert",
                  text: this.testMessage,
                }).show();
                return { success: true };
              }
              throw new Error("Noty library not available");
            },
          },
        ],
      },
      {
        title: "Browser Native",
        buttons: [
          {
            label: "alert()",
            color: "#607d8b",
            test: async () => {
              alert(this.testMessage);
              return { success: true, details: "Alert shown" };
            },
          },
          {
            label: "confirm()",
            color: "#795548",
            test: async () => {
              const result = confirm(
                this.testMessage + "\n\nClick OK or Cancel"
              );
              return {
                success: true,
                details: result ? "User clicked OK" : "User clicked Cancel",
              };
            },
          },
        ],
      },
      {
        title: "Console Logging",
        buttons: [
          {
            label: "logger.log()",
            color: "#888888",
            test: async () => {
              this.logger.log(this.testMessage);
              return { success: true, details: "Check console" };
            },
          },
          {
            label: "logger.warn()",
            color: "#e6a23c",
            test: async () => {
              this.logger.warn(this.testMessage);
              return { success: true, details: "Check console" };
            },
          },
          {
            label: "logger.error()",
            color: "#f56c6c",
            test: async () => {
              this.logger.error(this.testMessage);
              return { success: true, details: "Check console" };
            },
          },
        ],
      },
    ];

    // Build UI
    container.appendChild(header);
    container.appendChild(desc);
    container.appendChild(inputLabel);
    container.appendChild(textarea);

    // Add sections with buttons
    sections.forEach((section) => {
      const sectionEl = document.createElement("div");
      sectionEl.style.cssText = "margin-bottom: 20px;";

      const sectionTitle = document.createElement("h3");
      sectionTitle.style.cssText = `
        color: #409eff;
        font-size: 16px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #404040;
      `;
      sectionTitle.textContent = section.title;

      const buttonGrid = document.createElement("div");
      buttonGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
      `;

      section.buttons.forEach((btnConfig) => {
        const btn = document.createElement("button");
        btn.className = "el-button el-button--small";
        btn.style.cssText = `
          padding: 10px 15px;
          background: ${btnConfig.color};
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        `;
        btn.textContent = btnConfig.label;

        btn.addEventListener("click", async () => {
          clearResults();
          const timestamp = new Date().toLocaleTimeString();
          logResult(`Testing: ${btnConfig.label}`, true, timestamp);

          try {
            const result = await btnConfig.test();
            logResult(
              btnConfig.label,
              true,
              result.details || "Notification sent"
            );
          } catch (error) {
            logResult(btnConfig.label, false, error.message);
          }
        });

        btn.addEventListener("mouseenter", () => {
          btn.style.opacity = "0.8";
          btn.style.transform = "scale(1.02)";
        });

        btn.addEventListener("mouseleave", () => {
          btn.style.opacity = "1";
          btn.style.transform = "scale(1)";
        });

        buttonGrid.appendChild(btn);
      });

      sectionEl.appendChild(sectionTitle);
      sectionEl.appendChild(buttonGrid);
      container.appendChild(sectionEl);
    });

    // Add "Test All" button
    const testAllSection = document.createElement("div");
    testAllSection.style.cssText = "margin-top: 30px;";

    const testAllBtn = document.createElement("button");
    testAllBtn.className = "el-button el-button--large el-button--primary";
    testAllBtn.style.cssText = `
      width: 100%;
      padding: 15px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    `;
    testAllBtn.innerHTML = '<i class="ri-play-circle-line"></i> Test All';

    testAllBtn.addEventListener("click", async () => {
      await this.runAllTests(logResult, clearResults);
    });

    testAllSection.appendChild(testAllBtn);
    container.appendChild(testAllSection);

    // Add results display
    container.appendChild(results);

    // Info section
    const infoSection = document.createElement("div");
    infoSection.style.cssText = `
      margin-top: 30px;
      padding: 15px;
      background: #2a2a2a;
      border-left: 3px solid #409eff;
      border-radius: 4px;
    `;

    const infoTitle = document.createElement("h4");
    infoTitle.style.cssText = "color: #409eff; margin: 0 0 10px 0;";
    infoTitle.textContent = "Available Methods";

    const infoList = document.createElement("ul");
    infoList.style.cssText = "color: #b0b0b0; margin: 0; padding-left: 20px;";
    infoList.innerHTML = `
      <li><code>$message</code> - Toast messages (brief, top-center)</li>
      <li><code>$notify</code> - Notifications (persistent, top-right corner)</li>
      <li><code>logger.show*()</code> - Plugin logger convenience methods</li>
      <li><code>AppApi.*</code> - System notifications (desktop, VR)</li>
    `;

    infoSection.appendChild(infoTitle);
    infoSection.appendChild(infoList);
    container.appendChild(infoSection);

    return container;
  }

  async runAllTests(logResult, clearResults) {
    clearResults();
    const timestamp = new Date().toLocaleTimeString();
    logResult("Starting all tests...", true, timestamp);

    const tests = [
      {
        name: "$message.success()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$message?.success(
            this.testMessage
          );
        },
      },
      {
        name: "$message.warning()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$message?.warning(
            this.testMessage
          );
        },
      },
      {
        name: "$message.error()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$message?.error(
            this.testMessage
          );
        },
      },
      {
        name: "$message.info()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$message?.info(
            this.testMessage
          );
        },
      },
      {
        name: "$notify.success()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$notify?.success({
            title: "Logger Test",
            message: this.testMessage,
          });
        },
      },
      {
        name: "$notify.warning()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$notify?.warning({
            title: "Logger Test",
            message: this.testMessage,
          });
        },
      },
      {
        name: "$notify.error()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$notify?.error({
            title: "Logger Test",
            message: this.testMessage,
          });
        },
      },
      {
        name: "$notify.info()",
        fn: async () => {
          window.$app?.config?.globalProperties?.$notify?.info({
            title: "Logger Test",
            message: this.testMessage,
          });
        },
      },
      {
        name: "Noty Success",
        fn: async () => {
          if (typeof Noty !== "undefined") {
            new Noty({
              type: "success",
              text: this.testMessage,
            }).show();
          } else {
            throw new Error("Noty not available");
          }
        },
      },
      {
        name: "Noty Info",
        fn: async () => {
          if (typeof Noty !== "undefined") {
            new Noty({
              type: "info",
              text: this.testMessage,
            }).show();
          } else {
            throw new Error("Noty not available");
          }
        },
      },
      {
        name: "Noty Warning",
        fn: async () => {
          if (typeof Noty !== "undefined") {
            new Noty({
              type: "warning",
              text: this.testMessage,
            }).show();
          } else {
            throw new Error("Noty not available");
          }
        },
      },
      {
        name: "Noty Error",
        fn: async () => {
          if (typeof Noty !== "undefined") {
            new Noty({
              type: "error",
              text: this.testMessage,
            }).show();
          } else {
            throw new Error("Noty not available");
          }
        },
      },
      {
        name: "AppApi.DesktopNotification",
        fn: async () => {
          if (window.AppApi?.DesktopNotification) {
            await window.AppApi.DesktopNotification(
              "Logger Test",
              this.testMessage
            );
          } else {
            throw new Error("Not available");
          }
        },
      },
      {
        name: "alert() [Browser]",
        fn: async () => {
          alert(this.testMessage + " - Browser Alert");
        },
      },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        logResult(test.name, true, "Sent");
      } catch (error) {
        logResult(test.name, false, error.message);
      }
    }

    logResult("All tests complete!", true, "");
  }

  async stop() {
    if (this.navMenuApi) {
      this.navMenuApi.removeItem("logger-tester");
    }

    await super.stop();
  }
}

// Export plugin class for PluginManager
window.customjs.__LAST_PLUGIN_CLASS__ = TestLoggerPlugin;
