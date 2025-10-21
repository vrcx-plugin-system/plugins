// 
class DialogApiPlugin extends CustomModule {
  customDialogs: Map<string, any>;
  dialogContainers: Map<string, HTMLElement>;
  dialogWrapperElement: HTMLElement | null;

  constructor() {
    super({
      name: "Dialog API 💬",
      description: "API for creating and showing custom dialogs in VRCX",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["API", "Core", "Dialog", "Library"],
      required_dependencies: [],
    });

    this.customDialogs = new Map();
    this.dialogContainers = new Map();
    this.dialogWrapperElement = null;
  }

  async load() {
    // Register events for all VRCX dialog types
    this.registerEvent('ShowUserDialog', {
      description: 'Fired when a user dialog is opened',
      payload: {
        userId: 'string - User ID that was opened',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: true
    });

    this.registerEvent('ShowWorldDialog', {
      description: 'Fired when a world dialog is opened',
      payload: {
        worldId: 'string - World ID or location tag',
        shortName: 'string - Optional short name',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowAvatarDialog', {
      description: 'Fired when an avatar dialog is opened',
      payload: {
        avatarId: 'string - Avatar ID that was opened',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowGroupDialog', {
      description: 'Fired when a group dialog is opened',
      payload: {
        groupId: 'string - Group ID that was opened',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowLaunchDialog', {
      description: 'Fired when a VRChat launch dialog is opened',
      payload: {
        location: 'string - Location tag',
        shortName: 'string - Optional short name',
        dialog: 'object - Full dialog reference',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: true
    });

    this.registerEvent('ShowGalleryDialog', {
      description: 'Fired when gallery dialog is opened',
      payload: {
        dialog: 'object - Gallery dialog state',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: true
    });

    this.registerEvent('ShowFavoriteDialog', {
      description: 'Fired when favorite management dialog is opened',
      payload: {
        type: 'string - Favorite type (world/avatar)',
        objectId: 'string - Object ID',
        dialog: 'object - Favorite dialog state',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,
      logToConsole: true
    });

    this.logger.log("Dialog API ready");
    this.loaded = true;
  }

  async start() {
    // Create dialog wrapper element
    await this.setupDialogWrapper();

    // Setup hooks for VRCX native dialogs
    this.setupDialogHooks();

    this.enabled = true;
    this.started = true;
    this.logger.log("Dialog API started");
  }

  setupDialogHooks() {
    // Watch user dialog via store subscription
    this.subscribe('USER', ({ userDialog }) => {
      if (userDialog?.visible && userDialog?.id) {
        this.emit('ShowUserDialog', {
          userId: userDialog.id,
          dialog: userDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch world dialog
    this.subscribe('WORLD', ({ worldDialog }) => {
      if (worldDialog?.visible && worldDialog?.id) {
        this.emit('ShowWorldDialog', {
          worldId: worldDialog.id,
          shortName: worldDialog.$location?.shortName || '',
          dialog: worldDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch avatar dialog
    this.subscribe('AVATAR', ({ avatarDialog }) => {
      if (avatarDialog?.visible && avatarDialog?.id) {
        this.emit('ShowAvatarDialog', {
          avatarId: avatarDialog.id,
          dialog: avatarDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch group dialog
    this.subscribe('GROUP', ({ groupDialog }) => {
      if (groupDialog?.visible && groupDialog?.id) {
        this.emit('ShowGroupDialog', {
          groupId: groupDialog.id,
          dialog: groupDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch launch dialog
    this.subscribe('LAUNCH', ({ launchDialogData }) => {
      if (launchDialogData?.visible && launchDialogData?.tag) {
        this.emit('ShowLaunchDialog', {
          location: launchDialogData.tag,
          shortName: launchDialogData.shortName || '',
          dialog: launchDialogData,
          timestamp: Date.now()
        });
      }
    });

    // Watch gallery dialog
    this.subscribe('GALLERY', (state) => {
      if (state.galleryDialogVisible) {
        this.emit('ShowGalleryDialog', {
          dialog: state,
          timestamp: Date.now()
        });
      }
    });

    // Watch favorite dialog
    this.subscribe('FAVORITE', ({ favoriteDialog }) => {
      if (favoriteDialog?.visible) {
        this.emit('ShowFavoriteDialog', {
          type: favoriteDialog.type,
          objectId: favoriteDialog.objectId,
          dialog: favoriteDialog,
          timestamp: Date.now()
        });
      }
    });

    this.logger.log("Dialog watchers registered via store subscriptions");
  }

  async stop() {
    this.logger.log("Stopping Dialog API");

    // Close and remove all dialogs
    this.closeAllDialogs();

    // Remove wrapper
    if (this.dialogWrapperElement && this.dialogWrapperElement.parentNode) {
      this.dialogWrapperElement.parentNode.removeChild(this.dialogWrapperElement);
    }

    await super.stop();
  }

  async setupDialogWrapper() {
    return new Promise<void>((resolve) => {
      const createWrapper = () => {
        // Create a container for all custom dialogs
        this.dialogWrapperElement = document.createElement("div");
        this.dialogWrapperElement.id = "customjs-dialog-wrapper";
        this.dialogWrapperElement.style.cssText = "position: relative; z-index: 2000;";

        // Find the main app container
        const appContainer = document.querySelector("#app") || document.body;
        appContainer.appendChild(this.dialogWrapperElement);

        this.logger.log("Dialog wrapper created");
        resolve();
      };

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createWrapper);
      } else {
        createWrapper();
      }
    });
  }

  /**
   * Register a new custom dialog
   * @param dialogId - Unique identifier for the dialog
   * @param options - Dialog configuration options
   */
  registerDialog(dialogId: string, options: DialogOptions): DialogController {
    if (this.customDialogs.has(dialogId)) {
      this.logger.warn(`Dialog ${dialogId} already exists, overwriting`);
    }

    const dialog: CustomDialog = {
      id: dialogId,
      visible: false,
      title: options.title || "Custom Dialog",
      width: options.width || "600px",
      content: options.content || "",
      showClose: options.showClose !== false,
      closeOnClickModal: options.closeOnClickModal !== false,
      closeOnPressEscape: options.closeOnPressEscape !== false,
      fullscreen: options.fullscreen || false,
      top: options.top || "15vh",
      modal: options.modal !== false,
      draggable: options.draggable || false,
      footer: options.footer,
      beforeClose: options.beforeClose,
      onOpen: options.onOpen,
      onClose: options.onClose,
    };

    this.customDialogs.set(dialogId, dialog);
    this.logger.log(`Registered dialog: ${dialogId}`);

    // Return controller
    return this.createDialogController(dialogId);
  }

  /**
   * Create a dialog controller for managing a specific dialog
   */
  createDialogController(dialogId: string): DialogController {
    return {
      show: () => this.showDialog(dialogId),
      hide: () => this.closeDialog(dialogId),
      toggle: () => this.toggleDialog(dialogId),
      setTitle: (title: string) => this.setDialogTitle(dialogId, title),
      setContent: (content: string | HTMLElement) => this.setDialogContent(dialogId, content),
      isVisible: () => this.isDialogVisible(dialogId),
      destroy: () => this.destroyDialog(dialogId),
    };
  }

  // Note: This plugin inherits showConfirmDialog from CustomModule base class
  // The base implementation calls this plugin's showConfirmDialogAsync method

  /**
   * Show confirmation dialog using Element Plus or fallback to native confirm
   * @param title - Dialog title
   * @param message - Dialog message
   * @returns True if confirmed, false if cancelled
   */
  async showConfirmDialogAsync(title: string, message: string, type: "info" | "warning" | "error" = "info", confirmText: string = "Confirm", cancelText: string = "Cancel"): Promise<boolean> {
    try {
      // Try Element Plus $confirm (Vue global properties)
      const $confirm = (window as any).$app?.config?.globalProperties?.$confirm;
      if ($confirm) {
        try {
          await $confirm(message, title, {
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            type: type,
          });
          return true; // User confirmed
        } catch (error) {
          // User cancelled or closed dialog
          return false;
        }
      }

      // Fallback to native browser confirm
      this.logger.log(
        "Using native confirm dialog (Element Plus not available)"
      );
      const fullMessage = `${title}\n\n${message}`;
      return confirm(fullMessage);
    } catch (error: any) {
      this.logger.warn(`Error showing confirm dialog: ${error.message}`);
      // Fallback to native confirm on any error
      const fullMessage = `${title}\n\n${message}`;
      return confirm(fullMessage);
    }
  }

  /**
   * Show a dialog
   */
  showDialog(dialogId: string): boolean {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog) {
      this.logger.error(`Dialog ${dialogId} not found`);
      return false;
    }

    if (dialog.visible) {
      this.logger.warn(`Dialog ${dialogId} is already visible`);
      return false;
    }

    // Set visible BEFORE rendering so display style is correct
    dialog.visible = true;

    // Call onOpen callback
    if (dialog.onOpen) {
      try {
        dialog.onOpen();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        this.logger.error(`Error in onOpen callback for ${dialogId}: ${errorMsg}`);
      }
    }

    // Create or update the dialog element
    this.renderDialog(dialogId);

    this.logger.log(`Showing dialog: ${dialogId}`);
    return true;
  }

  /**
   * Close a dialog
   */
  closeDialog(dialogId: string): boolean {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog) {
      this.logger.error(`Dialog ${dialogId} not found`);
      return false;
    }

    if (!dialog.visible) {
      return false;
    }

    // Call beforeClose callback
    if (dialog.beforeClose) {
      try {
        const shouldClose = dialog.beforeClose();
        if (shouldClose === false) {
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        this.logger.error(`Error in beforeClose callback for ${dialogId}: ${errorMsg}`);
      }
    }

    dialog.visible = false;

    // Remove dialog element
    const container = this.dialogContainers.get(dialogId);
    if (container) {
      container.style.display = "none";
    }

    // Call onClose callback
    if (dialog.onClose) {
      try {
        dialog.onClose();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        this.logger.error(`Error in onClose callback for ${dialogId}: ${errorMsg}`);
      }
    }

    this.logger.log(`Closed dialog: ${dialogId}`);
    return true;
  }

  /**
   * Toggle a dialog's visibility
   */
  toggleDialog(dialogId: string): void {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog) {
      this.logger.error(`Dialog ${dialogId} not found`);
      return;
    }

    if (dialog.visible) {
      this.closeDialog(dialogId);
    } else {
      this.showDialog(dialogId);
    }
  }

  /**
   * Set dialog title
   */
  setDialogTitle(dialogId: string, title: string): void {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog) {
      this.logger.error(`Dialog ${dialogId} not found`);
      return;
    }

    dialog.title = title;

    // Update rendered title if dialog is visible
    if (dialog.visible) {
      const container = this.dialogContainers.get(dialogId);
      if (container) {
        const titleElement = container.querySelector(".dialog-title") as HTMLElement;
        if (titleElement) {
          titleElement.textContent = title;
        }
      }
    }
  }

  /**
   * Set dialog content
   */
  setDialogContent(dialogId: string, content: string | HTMLElement): void {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog) {
      this.logger.error(`Dialog ${dialogId} not found`);
      return;
    }

    dialog.content = content;

    // Update rendered content if dialog is visible
    if (dialog.visible) {
      const container = this.dialogContainers.get(dialogId);
      if (container) {
        const bodyElement = container.querySelector(".dialog-body") as HTMLElement;
        if (bodyElement) {
          if (typeof content === "string") {
            bodyElement.innerHTML = content;
          } else if (content instanceof HTMLElement) {
            bodyElement.innerHTML = "";
            bodyElement.appendChild(content);
          }
        }
      }
    }
  }

  /**
   * Check if a dialog is visible
   */
  isDialogVisible(dialogId: string): boolean {
    const dialog = this.customDialogs.get(dialogId);
    return dialog ? dialog.visible : false;
  }

  /**
   * Destroy a dialog (unregister and remove)
   */
  destroyDialog(dialogId: string): void {
    this.closeDialog(dialogId);

    const container = this.dialogContainers.get(dialogId);
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    this.dialogContainers.delete(dialogId);
    this.customDialogs.delete(dialogId);

    this.logger.log(`Destroyed dialog: ${dialogId}`);
  }

  /**
   * Render a dialog element
   */
  renderDialog(dialogId: string): void {
    const dialog = this.customDialogs.get(dialogId);
    if (!dialog || !this.dialogWrapperElement) {
      return;
    }

    let container = this.dialogContainers.get(dialogId);

    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement("div");
      container.className = "customjs-dialog-container";
      container.setAttribute("data-dialog-id", dialogId);
      this.dialogWrapperElement.appendChild(container);
      this.dialogContainers.set(dialogId, container);
    }

    // Render dialog structure
    container.innerHTML = "";
    container.style.display = dialog.visible ? "block" : "none";

    // Create modal backdrop
    if (dialog.modal) {
      const backdrop = document.createElement("div");
      backdrop.className = "el-overlay";
      backdrop.style.cssText = "z-index: 2000;";

      const backdropInner = document.createElement("div");
      backdropInner.className = "el-overlay-dialog";
      
      if (dialog.closeOnClickModal) {
        this.registerListener(backdropInner, "click", () => {
          this.closeDialog(dialogId);
        });
      }

      backdrop.appendChild(backdropInner);
      container.appendChild(backdrop);
    }

    // Create dialog wrapper
    const dialogWrapper = document.createElement("div");
    dialogWrapper.className = "el-dialog__wrapper";
    dialogWrapper.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      overflow: auto;
      margin: 0;
      z-index: 2001;
      display: flex;
      align-items: ${dialog.fullscreen ? 'stretch' : 'center'};
      justify-content: center;
    `;

    // Create dialog element
    const dialogElement = document.createElement("div");
    dialogElement.className = "el-dialog x-dialog customjs-dialog";
    dialogElement.style.cssText = `
      position: relative;
      margin: ${dialog.fullscreen ? '0' : dialog.top + ' auto 50px'};
      background: #2a2a2a;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
      width: ${dialog.fullscreen ? '100%' : dialog.width};
      height: ${dialog.fullscreen ? '100%' : 'auto'};
      max-width: ${dialog.fullscreen ? '100%' : 'calc(100% - 30px)'};
      ${dialog.draggable ? 'cursor: move;' : ''}
    `;

    // Dialog header
    const header = document.createElement("div");
    header.className = "el-dialog__header";
    header.style.cssText = `
      padding: 15px 20px;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #404040;
    `;

    const titleElement = document.createElement("span");
    titleElement.className = "el-dialog__title dialog-title";
    titleElement.style.cssText = "color: #e8e8e8; font-size: 18px; font-weight: 600;";
    titleElement.textContent = dialog.title;
    header.appendChild(titleElement);

    if (dialog.showClose) {
      const closeBtn = document.createElement("button");
      closeBtn.className = "el-dialog__headerbtn";
      closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        padding: 0;
        background: transparent;
        border: none;
        outline: none;
        cursor: pointer;
        font-size: 16px;
        color: #909399;
      `;
      closeBtn.innerHTML = '<i class="el-icon el-dialog__close"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="width: 1em; height: 1em;"><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg></i>';
      
      this.registerListener(closeBtn, "click", () => {
        this.closeDialog(dialogId);
      });

      header.appendChild(closeBtn);
    }

    dialogElement.appendChild(header);

    // Dialog body
    const body = document.createElement("div");
    body.className = "el-dialog__body dialog-body";
    body.style.cssText = "padding: 20px; color: #e8e8e8; font-size: 14px;";

    if (typeof dialog.content === "string") {
      body.innerHTML = dialog.content;
    } else if (dialog.content instanceof HTMLElement) {
      body.appendChild(dialog.content);
    }

    dialogElement.appendChild(body);

    // Dialog footer (optional)
    if (dialog.footer) {
      const footer = document.createElement("div");
      footer.className = "el-dialog__footer";
      footer.style.cssText = "padding: 10px 20px 15px; text-align: right; border-top: 1px solid #404040;";

      if (typeof dialog.footer === "string") {
        footer.innerHTML = dialog.footer;
      } else if (dialog.footer instanceof HTMLElement) {
        footer.appendChild(dialog.footer);
      }

      dialogElement.appendChild(footer);
    }

    // Handle draggable
    if (dialog.draggable) {
      this.makeDraggable(dialogElement, header);
    }

    // Handle ESC key
    if (dialog.closeOnPressEscape) {
      const escHandler = (e: KeyboardEvent) => {
        if (e.key === "Escape" && dialog.visible) {
          this.closeDialog(dialogId);
        }
      };

      this.registerListener(document, "keydown", escHandler);
    }

    dialogWrapper.appendChild(dialogElement);
    container.appendChild(dialogWrapper);
  }

  /**
   * Make a dialog draggable
   */
  makeDraggable(dialog: HTMLElement, header: HTMLElement): void {
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;

    const dragStart = (e: MouseEvent) => {
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;

      if (e.target === header || header.contains(e.target as Node)) {
        isDragging = true;
      }
    };

    const drag = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        dialog.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    };

    const dragEnd = () => {
      isDragging = false;
    };

    this.registerListener(header, "mousedown", dragStart);
    this.registerListener(document, "mousemove", drag);
    this.registerListener(document, "mouseup", dragEnd);
  }

  /**
   * Close all dialogs
   */
  closeAllDialogs(): void {
    for (const [dialogId] of this.customDialogs) {
      this.closeDialog(dialogId);
    }
  }

  /**
   * Get all registered dialog IDs
   */
  getAllDialogIds(): string[] {
    return Array.from(this.customDialogs.keys());
  }

  /**
   * Get dialog by ID
   */
  getDialog(dialogId: string): CustomDialog | undefined {
    return this.customDialogs.get(dialogId);
  }
}

// Type definitions
interface DialogOptions {
  title?: string;
  content?: string | HTMLElement;
  width?: string;
  showClose?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  fullscreen?: boolean;
  top?: string;
  modal?: boolean;
  draggable?: boolean;
  footer?: string | HTMLElement;
  beforeClose?: () => boolean | void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface CustomDialog extends Required<Omit<DialogOptions, 'beforeClose' | 'onOpen' | 'onClose'>> {
  id: string;
  visible: boolean;
  beforeClose?: () => boolean | void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface DialogController {
  show: () => boolean;
  hide: () => boolean;
  toggle: () => void;
  setTitle: (title: string) => void;
  setContent: (content: string | HTMLElement) => void;
  isVisible: () => boolean;
  destroy: () => void;
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = DialogApiPlugin;
