// 
class NavMenuApiPlugin extends CustomModule {
  customItems: Map<string, any>;
  contentContainers: Map<string, HTMLElement>;
  navMenu: HTMLElement | null;
  contentParent: HTMLElement | null;
  currentActiveIndex: string | null;

  constructor() {
    super({
      name: "🧭 Navigation Menu API",
      description: "API for adding custom navigation menu items to VRCX",
      authors: [
      {
        name: "Bluscream",
      }
    ],
      tags: ["API", "Core", "Navigation", "Library"],
      dependencies: [],
    });

    // Map of itemId -> item config
    this.customItems = new Map();

    // Map of itemId -> content element
    this.contentContainers = new Map();

    // Navigation menu element
    this.navMenu = null;

    // Content parent element
    this.contentParent = null;

    // Track current active menu index for lifecycle callbacks
    this.currentActiveIndex = null;
  }

  async load() {
    this.logger.log("Navigation Menu API ready");
    this.loaded = true;
  }

  async start() {
    // Wait for nav menu to be available
    await this.waitForNavMenu();

    // Setup content area
    await this.setupContentArea();

    // Setup mutation observer
    this.setupObserver();

    // Render any items that were added before start
    this.renderAllItems();

    this.enabled = true;
    this.started = true;
    this.logger.log("Navigation Menu API started");
  }

  async onLogin(currentUser) {
    this.logger.log(
      `Setting up menu watcher for user: ${currentUser?.displayName}`
    );

    // Setup Pinia watcher
    this.watchMenuChanges();
  }

  async stop() {
    this.logger.log("Stopping Navigation Menu API");

    // Remove all items
    this.clearAllItems();

    // Parent cleanup (will disconnect observer automatically)
    await super.stop();
  }

  async waitForNavMenu() {
    return new Promise<void>((resolve) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait for items

      const checkNav = () => {
        this.navMenu = document.querySelector(".el-menu");

        if (this.navMenu) {
          // Check if VRCX menu items are rendered
          const navItems = this.navMenu.querySelectorAll(".el-menu-item");

          if (navItems.length > 0) {
            this.logger.log("Navigation menu found with items");
            resolve();
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(checkNav, 100);
          } else {
            // Timeout - proceed anyway
            this.logger.log(
              "Navigation menu found (no items yet, proceeding anyway)"
            );
            resolve();
          }
        } else {
          setTimeout(checkNav, 500);
        }
      };

      setTimeout(checkNav, 1000);
    });
  }

  async setupContentArea() {
    return new Promise<void>((resolve) => {
      const findContentArea = () => {
        this.contentParent = document.querySelector(".el-splitter");

        if (this.contentParent) {
          this.logger.log("Content area found, ready to add tab content");
          resolve();
        } else {
          setTimeout(findContentArea, 500);
        }
      };

      setTimeout(findContentArea, 1000);
    });
  }

  setupObserver() {
    // Watch for nav menu changes to re-render custom items if needed
    const observer = new MutationObserver(() => {
      if (this.navMenu && !document.contains(this.navMenu)) {
        // Nav menu was removed, wait for it to come back
        this.navMenu = null;
        this.waitForNavMenu().then(() => this.renderAllItems());
      }
    });

    // Register observer for automatic cleanup
    this.registerObserver(observer);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.logger.log("Mutation observer setup complete");
  }

  watchMenuChanges() {
    // Subscribe to UI store changes with fallback
    this.subscribe("UI", (data) => {
      const menuActiveIndex =
        data?.menuActiveIndex || window.$pinia?.ui?.menuActiveIndex;
      if (menuActiveIndex) {
        this.updateContentVisibility(menuActiveIndex);
      }
    });

    // Call immediately with current value if available
    const currentIndex = window.$pinia?.ui?.menuActiveIndex;
    if (currentIndex) {
      this.updateContentVisibility(currentIndex);
    }

    this.logger.log("Menu watcher setup complete");
  }

  updateContentVisibility(activeIndex) {
    // Track previous active index to determine what changed
    const previousIndex = this.currentActiveIndex;
    this.currentActiveIndex = activeIndex;

    // Check if active tab is a custom tab
    const isCustomTab = this.customItems.has(activeIndex);

    // If a custom tab is active, hide all VRCX native content containers
    if (isCustomTab && this.contentParent) {
      const vrcxContainers =
        this.contentParent.querySelectorAll(".x-container");
      vrcxContainers.forEach((container) => {
        // Only hide if it's not a custom container
        if (!container.id || !container.id.startsWith("custom-nav-content-")) {
          (container as HTMLElement).style.display = "none";
        }
      });
    }

    // Show/hide custom content containers based on active menu
    this.contentContainers.forEach((container, itemId) => {
      const isActive = activeIndex === itemId;
      const wasActive = previousIndex === itemId;

      (container as HTMLElement).style.display = isActive ? "block" : "none";

      // Fire lifecycle callbacks
      if (isActive && !wasActive) {
        // Tab just became visible
        const item = this.customItems.get(itemId);
        if (item?.onShow) {
          try {
            item.onShow();
          } catch (error) {
            this.logger.error(`Error in onShow callback for ${itemId}:`, error);
          }
        }
      } else if (!isActive && wasActive) {
        // Tab just became hidden
        const item = this.customItems.get(itemId);
        if (item?.onHide) {
          try {
            item.onHide();
          } catch (error) {
            this.logger.error(`Error in onHide callback for ${itemId}:`, error);
          }
        }
      }
    });

    // Update active state on menu items
    this.customItems.forEach((item, itemId) => {
      const menuItem = this.navMenu?.querySelector(
        `[data-custom-nav-item="${itemId}"]`
      );
      if (menuItem) {
        if (activeIndex === itemId) {
          menuItem.classList.add("is-active");
        } else {
          menuItem.classList.remove("is-active");
        }
      }
    });
  }

  /**
   * Add a custom navigation menu item with optional content container
   * @param {string} id - Unique identifier for the item
   * @param {object} config - Item configuration
   * @param {string} config.label - Display label (or i18n key)
   * @param {string} config.icon - Remix icon class (e.g., 'ri-plugin-line')
   * @param {function} config.onClick - Click handler (optional if using content)
   * @param {HTMLElement|function|string} config.content - Content element, function, or HTML string
   * @param {function} config.onShow - Called when this tab becomes visible (optional)
   * @param {function} config.onHide - Called when this tab becomes hidden (optional)
   * @param {number} config.position - Absolute position index (0 = first, takes precedence over before/after)
   * @param {string} config.before - Insert before this item index (optional)
   * @param {string} config.after - Insert after this item index (optional)
   * @param {boolean} config.enabled - Whether the item is enabled (default: true)
   */
  addItem(id, config) {
    const item = {
      id,
      label: config.label || id,
      icon: config.icon || "ri-plugin-line",
      onClick: config.onClick || null,
      content: config.content || null,
      onShow: config.onShow || null,
      onHide: config.onHide || null,
      position: config.position !== undefined ? config.position : null,
      before: config.before || null,
      after: config.after || null,
      enabled: config.enabled !== false,
    };

    this.customItems.set(id, item);
    this.logger.log(`Added item: ${id}`);

    if (this.navMenu) {
      this.renderItem(item);
    }

    // Create content container if content is provided
    if (item.content && this.contentParent) {
      this.createContentContainer(id, item.content);
    } else if (item.content && !this.contentParent) {
      // Content parent not ready yet, retry later
      setTimeout(() => {
        if (this.contentParent) {
          this.createContentContainer(id, item.content);
        }
      }, 2000);
    }

    return item;
  }

  /**
   * Create a content container for a nav item
   * @param {string} id - Item identifier
   * @param {HTMLElement|function|string} content - Content element, generator function, or HTML string
   */
  createContentContainer(id, content) {
    if (!this.contentParent) {
      this.logger.warn(`Content parent not ready for ${id}`);
      return;
    }

    // Create container div
    const container = document.createElement("div");
    container.id = `custom-nav-content-${id}`;
    container.className = "x-container";
    container.style.cssText = `
      display: none;
      padding: 20px;
      height: 100%;
      overflow-y: auto;
    `;

    // Set content
    if (typeof content === "function") {
      const result = content();
      if (result instanceof HTMLElement) {
        container.appendChild(result);
      } else if (typeof result === "string") {
        container.innerHTML = result;
      }
    } else if (content instanceof HTMLElement) {
      container.appendChild(content);
    } else if (typeof content === "string") {
      container.innerHTML = content;
    }

    // Find the first el-splitter-panel and append to it
    const panel = this.contentParent.querySelector(".el-splitter-panel");
    if (panel) {
      panel.appendChild(container);
      this.contentContainers.set(id, container);
      this.logger.log(`Created content container for: ${id}`);
    }
  }

  /**
   * Remove a custom navigation menu item
   * @param {string} id - Item identifier
   */
  removeItem(id) {
    if (!this.customItems.has(id)) {
      this.logger.warn(`Item not found: ${id}`);
      return false;
    }

    this.customItems.delete(id);

    // Remove from DOM
    const element = this.navMenu?.querySelector(
      `[data-custom-nav-item="${id}"]`
    );
    if (element) {
      element.remove();
    }

    // Remove content container
    const container = this.contentContainers.get(id);
    if (container) {
      container.remove();
      this.contentContainers.delete(id);
    }

    this.logger.log(`Removed item: ${id}`);
    return true;
  }

  /**
   * Update an existing navigation menu item
   * @param {string} id - Item identifier
   * @param {object} updates - Properties to update
   */
  updateItem(id, updates) {
    const item = this.customItems.get(id);
    if (!item) {
      this.logger.warn(`Item not found: ${id}`);
      return false;
    }

    Object.assign(item, updates);

    // Re-render the item
    const element = this.navMenu?.querySelector(
      `[data-custom-nav-item="${id}"]`
    );
    if (element) {
      element.remove();
      this.renderItem(item);
    }

    this.logger.log(`Updated item: ${id}`);
    return true;
  }

  /**
   * Check if an item exists
   * @param {string} id - Item identifier
   */
  hasItem(id) {
    return this.customItems.has(id);
  }

  /**
   * Get all custom items
   */
  getAllItems() {
    return Array.from(this.customItems.values());
  }

  /**
   * Clear all custom items
   */
  clearAllItems() {
    const ids = Array.from(this.customItems.keys());
    ids.forEach((id) => this.removeItem(id));
    this.logger.log(`Cleared all ${ids.length} custom items`);
  }

  renderItem(item) {
    if (!this.navMenu || !item.enabled) return;

    // Check if item already exists
    const existing = this.navMenu.querySelector(
      `[data-custom-nav-item="${item.id}"]`
    );
    if (existing) return;

    // If item has positioning requirements, ensure VRCX items are loaded
    if (item.position !== null || item.before || item.after) {
      const navItems = this.navMenu.querySelectorAll(".el-menu-item");
      const vrcxItems = Array.from(navItems).filter(
        (el: Element) => !el.hasAttribute("data-custom-nav-item")
      );

      if (vrcxItems.length === 0) {
        // VRCX items not ready yet, retry later (max 5 seconds)
        if (!item._retryCount) item._retryCount = 0;
        if (item._retryCount < 50) {
          item._retryCount++;
          setTimeout(() => this.renderItem(item), 100);
          return;
        } else {
          // Give up and just append
          this.logger.log(
            `Timed out waiting for VRCX items, appending ${item.id} to end`
          );
        }
      }
    }

    // Create the menu item element
    const menuItem = document.createElement("li");
    menuItem.className = "el-menu-item";
    menuItem.setAttribute("data-custom-nav-item", item.id);
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("tabindex", "-1");

    // Create icon
    const icon = document.createElement("i");
    icon.className = item.icon;
    icon.style.fontSize = "19px";
    icon.style.width = "24px";
    icon.style.height = "24px";
    icon.style.display = "inline-flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";

    // Create tooltip wrapper
    const tooltip = document.createElement("span");
    tooltip.className = "el-tooltip__trigger";
    tooltip.textContent = item.label;
    tooltip.style.display = "none"; // Hidden until hover

    menuItem.appendChild(icon);
    menuItem.appendChild(tooltip);

    // Add click handler with automatic cleanup
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      this.logger.log(
        `Nav item clicked: "${item.id}" (label: "${
          item.label
        }", hasContent: ${!!item.content})`
      );

      // If item has content, treat as tab - manage active state and switch content
      if (item.content) {
        // Remove active class from all menu items (including VRCX native)
        const allMenuItems = this.navMenu?.querySelectorAll(".el-menu-item");
        allMenuItems?.forEach((el) => {
          el.classList.remove("is-active");
        });

        // Add active class to clicked item immediately
        menuItem.classList.add("is-active");

        // Hide all VRCX native content containers
        if (this.contentParent) {
          const vrcxContainers =
            this.contentParent.querySelectorAll(".x-container");
          vrcxContainers.forEach((container) => {
            // Only hide VRCX native containers, not custom ones
            if (!container.id || !container.id.startsWith("custom-nav-content-")) {
              (container as HTMLElement).style.display = "none";
            }
          });
        }

        // Hide all custom content containers
        this.contentContainers.forEach((container) => {
          (container as HTMLElement).style.display = "none";
        });

        // Show the content for this item
        const contentContainer = this.contentContainers.get(item.id);
        if (contentContainer) {
          contentContainer.style.display = "block";
          
          // Fire onShow callback
          if (item.onShow) {
            try {
              item.onShow();
            } catch (error) {
              this.logger.error(`Error in onShow callback for ${item.id}:`, error);
            }
          }
        } else {
          this.logger.warn(`Content container not found for ${item.id}`);
        }

        // Update Pinia store (optional, for integration with VRCX)
        if (window.$pinia?.ui) {
          window.$pinia.ui.menuActiveIndex = item.id;
        }
      }
      // If no content, treat as button - don't manage active state or switch tabs
      else {
        // Just flash the item to show it was clicked
        menuItem.classList.add("is-active");
        setTimeout(() => {
          menuItem.classList.remove("is-active");
        }, 200);
      }

      // Call custom onClick if provided
      if (item.onClick) {
        item.onClick();
      }
    };

    this.registerListener(menuItem, "click", clickHandler);

    // Add hover effect to show tooltip
    const hoverHandler = () => {
      menuItem.setAttribute("title", item.label);
    };

    this.registerListener(menuItem, "mouseenter", hoverHandler);

    // Determine insertion position
    let referenceNode = null;

    // Position takes precedence (absolute index)
    if (item.position !== null) {
      const allItems = this.navMenu.querySelectorAll(".el-menu-item");
      if (item.position >= 0 && item.position < allItems.length) {
        referenceNode = allItems[item.position];
      } else if (item.position < 0) {
        // Negative position: count from end
        const idx = allItems.length + item.position;
        if (idx >= 0) {
          referenceNode = allItems[idx];
        }
      }
      // If position is >= length, referenceNode stays null and item appends to end
    } else if (item.before) {
      // Insert before a specific item
      const allItems = this.navMenu.querySelectorAll(".el-menu-item");
      for (const existingItem of Array.from(allItems)) {
        const index = existingItem.getAttribute("index");
        if (index === item.before) {
          referenceNode = existingItem;
          break;
        }
      }
    } else if (item.after) {
      // Insert after a specific item
      const allItems = this.navMenu.querySelectorAll(".el-menu-item");
      for (const existingItem of Array.from(allItems)) {
        const index = existingItem.getAttribute("index");
        if (index === item.after) {
          referenceNode = existingItem.nextSibling;
          break;
        }
      }
    }

    // Insert the item
    if (referenceNode) {
      this.navMenu.insertBefore(menuItem, referenceNode);
    } else {
      // Append to end
      this.navMenu.appendChild(menuItem);
    }

    this.logger.log(`Rendered item: ${item.id}`);
  }

  renderAllItems() {
    this.customItems.forEach((item) => {
      this.renderItem(item);
      
      // Also create content containers if not already created
      if (item.content && this.contentParent && !this.contentContainers.has(item.id)) {
        this.createContentContainer(item.id, item.content);
      }
    });
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = NavMenuApiPlugin;
