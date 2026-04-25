// 
/**
 * Bio Symbols Patch Plugin
 * Patches the replaceBioSymbols function to handle non-string inputs
 *
 * Fixes the error: "a.replace is not a function"
 * This happens when the function receives a non-string value (object, array, etc)
 */
class BioSymbolsPatchPlugin extends CustomModule {
  originalFunction: Function | null;
  originalUtils: any;
  patched: boolean;
  patchedViaProxy: boolean;

  constructor() {
    super({
      name: "Bio Symbols Patch 🔤",
      description:
        "Patches replaceBioSymbols function to handle non-string inputs safely",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["Bugfix", "Utility", "Patch", "Fix"],
      required_dependencies: [],
    });

    this.originalFunction = null;
    this.originalUtils = null;
    this.patched = false;
    this.patchedViaProxy = false;
  }

  async load() {
    this.logger.log("Bio Symbols Patch plugin loaded");
    this.loaded = true;
  }

  async start() {
    // Patch the function
    this.patchReplaceBioSymbols();

    this.enabled = true;
    this.started = true;
    this.logger.log("Bio Symbols Patch plugin started");
  }

  async stop() {
    this.logger.log("Stopping Bio Symbols Patch plugin");

    // Restore original function if patched
    if (this.patched && this.originalFunction) {
      this.restoreOriginalFunction();
    }

    await super.stop();
  }

  // ============================================================================
  // PATCHING LOGIC
  // ============================================================================

  /**
   * Patch the replaceBioSymbols function to handle non-string inputs
   */
  patchReplaceBioSymbols() {
    try {
      const w = window as any;
      
      // Diagnostic logging
      this.logger.log(`[DIAG] window.utils=${typeof w.utils}, $debug=${typeof w.$debug}, $pinia=${typeof w.$pinia}, dayjs=${typeof w.dayjs}`);
      const desc = Object.getOwnPropertyDescriptor(window, 'utils');
      this.logger.log(`[DIAG] utils descriptor: ${desc ? `configurable=${desc.configurable}, writable=${desc.writable}, hasGet=${!!desc.get}, hasSet=${!!desc.set}, valType=${typeof desc.value}` : 'NONE'}`);

      // Strategy 1: Direct window.utils access
      if (w.utils?.replaceBioSymbols) {
        this.logger.log("Found replaceBioSymbols in window.utils");
        this.patchFunction(w.utils, "replaceBioSymbols");
        return;
      }

      // Strategy 2: Scan all Pinia stores for replaceBioSymbols
      if (w.$pinia?._s) {
        for (const [storeName, store] of w.$pinia._s) {
          if (store && typeof (store as any).replaceBioSymbols === 'function') {
            this.logger.log(`Found replaceBioSymbols in Pinia store: ${storeName}`);
            this.patchFunction(store, "replaceBioSymbols");
            return;
          }
        }
        this.logger.log(`[DIAG] Scanned ${w.$pinia._s.size} Pinia stores, replaceBioSymbols not found`);
      }

      // Strategy 3: Scan all window properties for an object containing replaceBioSymbols
      const globalSearch = this.findReplaceBioSymbolsGlobally();
      if (globalSearch) {
        this.logger.log(`Found replaceBioSymbols on window.${globalSearch.key}`);
        this.patchFunction(globalSearch.obj, "replaceBioSymbols");
        return;
      }

      // Strategy 4: Wait for window.utils with property trap + polling
      this.logger.log("replaceBioSymbols not found anywhere, setting up watchers...");
      this.setupUtilsWatcher();
    } catch (error: any) {
      this.logger.error(`Failed to patch replaceBioSymbols: ${error.message}`);
    }
  }

  /**
   * Scan all enumerable window properties for an object containing replaceBioSymbols
   */
  private findReplaceBioSymbolsGlobally(): { obj: any, key: string } | null {
    const w = window as any;
    const candidates = ['utils', 'configRepository', 'webApiService', '$debug'];
    for (const key of candidates) {
      try {
        if (w[key] && typeof w[key].replaceBioSymbols === 'function') {
          return { obj: w[key], key };
        }
      } catch {}
    }
    return null;
  }

  /**
   * Set up watchers for window.utils to appear
   */
  private setupUtilsWatcher() {
    const w = window as any;

    // If utils already exists but doesn't have replaceBioSymbols, just inject our function
    if (w.utils && typeof w.utils === 'object') {
      this.logger.log("window.utils exists but missing replaceBioSymbols, injecting...");
      w.utils.replaceBioSymbols = this.createPatchedFunction(null);
      this.patched = true;
      this.logger.log("✓ Injected patched replaceBioSymbols into existing window.utils");
      return;
    }

    // Try defineProperty trap
    if (typeof w.utils === 'undefined') {
      this.logger.log("Setting up property trap on window.utils...");
      let _utilsValue: any = undefined;
      const self = this;

      try {
        Object.defineProperty(window, 'utils', {
          configurable: true,
          enumerable: true,
          get() { return _utilsValue; },
          set(newValue) {
            _utilsValue = newValue;
            self.logger.log("✓ window.utils assigned — applying patch");
            Object.defineProperty(window, 'utils', {
              configurable: true, enumerable: true, writable: true, value: newValue
            });
            self.applyUtilsPatch(newValue);
          }
        });
        this.logger.log("Property trap installed");
      } catch (e) {
        this.logger.warn("defineProperty failed, using polling only");
      }
    }

    // Also start polling as backup (checks utils, pinia stores, and globals)
    this.pollForFunction(0);
  }

  private pollForFunction(retryCount: number) {
    const MAX_RETRIES = 30;
    const RETRY_DELAY_MS = 2000;

    if (this.patched) return;

    const w = window as any;

    // Check window.utils
    if (w.utils?.replaceBioSymbols) {
      this.applyUtilsPatch(w.utils);
      return;
    }

    // Check Pinia stores
    if (w.$pinia?._s) {
      for (const [, store] of w.$pinia._s) {
        if (store && typeof (store as any).replaceBioSymbols === 'function') {
          this.logger.log("Found replaceBioSymbols in Pinia store (via poll)");
          this.patchFunction(store, "replaceBioSymbols");
          return;
        }
      }
    }

    // Check global candidates
    const globalSearch = this.findReplaceBioSymbolsGlobally();
    if (globalSearch) {
      this.logger.log(`Found replaceBioSymbols on window.${globalSearch.key} (via poll)`);
      this.patchFunction(globalSearch.obj, "replaceBioSymbols");
      return;
    }

    if (retryCount < MAX_RETRIES) {
      setTimeout(() => this.pollForFunction(retryCount + 1), RETRY_DELAY_MS);
    } else {
      // Final fallback: just create window.utils and inject our function
      this.logger.warn(`Not found after ${MAX_RETRIES * RETRY_DELAY_MS / 1000}s. Creating standalone patched function.`);
      if (!w.utils) w.utils = {};
      w.utils.replaceBioSymbols = this.createPatchedFunction(null);
      this.patched = true;
      this.logger.log("✓ Created standalone window.utils.replaceBioSymbols");
    }
  }

  private applyUtilsPatch(utils: any) {
    if (this.patched) return;

    if (utils.replaceBioSymbols) {
      this.logger.log("Found replaceBioSymbols in window.utils");
      this.patchFunction(utils, "replaceBioSymbols");
    } else {
      utils.replaceBioSymbols = this.createPatchedFunction(null);
      this.patched = true;
      this.logger.log("✓ Injected patched replaceBioSymbols into window.utils");
    }
  }

  /**
   * Patch an existing function on an object
   */
  patchFunction(obj: any, funcName: string) {
    try {
      // Store original
      this.originalFunction = obj[funcName];

      // Create patched version
      const patchedFunc = this.createPatchedFunction(this.originalFunction);

      // Try direct assignment first
      try {
        obj[funcName] = patchedFunc;
        this.logger.log(`✓ Patched ${funcName} via direct assignment`);
      } catch (e) {
        // If direct assignment fails (read-only), try Object.defineProperty
        try {
          Object.defineProperty(obj, funcName, {
            value: patchedFunc,
            writable: true,
            configurable: true,
            enumerable: true,
          });
          this.logger.log(`✓ Patched ${funcName} via defineProperty`);
        } catch (e2) {
          // If that also fails, we need to use a Proxy approach
          this.logger.log(`Direct patching failed, using Proxy approach`);
          this.patchViaProxy(obj, funcName, patchedFunc);
          return;
        }
      }

      this.patched = true;
      this.logger.log(`✓ Successfully patched ${funcName}`);
      this.logger.showSuccess("Bio symbols patch applied");
    } catch (error: any) {
      this.logger.error(`Failed to patch function: ${error.message}`);
    }
  }

  /**
   * Patch using a Proxy wrapper (for read-only properties)
   */
  patchViaProxy(obj: any, funcName: string, patchedFunc: Function) {
    try {
      // Store original object reference
      this.originalUtils = obj;

      // Create a Proxy that intercepts the replaceBioSymbols call
      const proxyHandler = {
        get: (target: any, prop: string) => {
          if (prop === funcName) {
            return patchedFunc;
          }
          return target[prop];
        },
      };

      const proxiedUtils = new Proxy(obj, proxyHandler);

      // Replace window.utils with the proxy
      (window as any).utils = proxiedUtils;

      this.patched = true;
      this.patchedViaProxy = true;
      this.logger.log(`✓ Successfully patched ${funcName} via Proxy`);
      this.logger.showSuccess("Bio symbols patch applied (Proxy mode)");
    } catch (error: any) {
      this.logger.error(`Failed to patch via Proxy: ${error.message}`);
    }
  }

  /**
   * Create a patched version of the function
   */
  createPatchedFunction(originalFunc: Function | null): Function {
    const self = this;

    return function patchedReplaceBioSymbols(input: any) {
      try {
        // Handle null/undefined
        if (input === null || input === undefined) {
          return "";
        }

        // Convert to string if not already
        let stringInput = input;
        if (typeof input !== "string") {
          // Handle objects, arrays, etc
          if (typeof input === "object") {
            // Try to get a meaningful string representation
            if (
              input.toString &&
              input.toString !== Object.prototype.toString
            ) {
              stringInput = input.toString();
            } else {
              stringInput = JSON.stringify(input);
            }
          } else {
            stringInput = String(input);
          }

          self.logger.warn(
            `replaceBioSymbols received non-string input (${typeof input}), converted to string`
          );
        }

        // Call original function with string input
        if (originalFunc) {
          return originalFunc.call(this, stringInput);
        } else {
          // Fallback implementation if no original
          return self.replaceBioSymbolsFallback(stringInput);
        }
      } catch (error: any) {
        self.logger.error(
          `Error in patched replaceBioSymbols: ${error.message}`
        );
        // Return safe fallback
        return String(input || "");
      }
    };
  }

  /**
   * Fallback implementation of replaceBioSymbols
   */
  replaceBioSymbolsFallback(str: any): string {
    if (!str || typeof str !== "string") {
      return "";
    }

    const symbolMap: Record<string, string> = {
      "@": "＠",
      "#": "＃",
      $: "＄",
      "%": "％",
      "&": "＆",
      "=": "＝",
      "+": "＋",
      "/": "⁄",
      "\\": "＼",
      ";": ";",
      ":": "˸",
      ",": "‚",
      "?": "？",
      "!": "ǃ",
      '"': "＂",
      "<": "≺",
      ">": "≻",
      ".": "․",
      "^": "＾",
      "{": "｛",
      "}": "｝",
      "[": "［",
      "]": "］",
      "(": "（",
      ")": "）",
      "|": "｜",
      "*": "∗",
    };

    let result = str;
    for (const key in symbolMap) {
      const regex = new RegExp(symbolMap[key], "g");
      result = result.replace(regex, key);
    }

    return result.replace(/ {1,}/g, " ").trimRight();
  }


  /**
   * Restore original function
   */
  restoreOriginalFunction() {
    try {
      if (this.patchedViaProxy && this.originalUtils) {
        // Restore original utils object
        (window as any).utils = this.originalUtils;
        this.logger.log("Restored original utils object (removed Proxy)");
        this.patchedViaProxy = false;
        this.originalUtils = null;
      } else if ((window as any).utils?.replaceBioSymbols && this.originalFunction) {
        try {
          (window as any).utils.replaceBioSymbols = this.originalFunction;
          this.logger.log("Restored original replaceBioSymbols");
        } catch (e) {
          // If can't restore, not a big deal - just log it
          this.logger.warn(
            "Could not restore (read-only), but patch is removed"
          );
        }
      }

      this.patched = false;
      this.originalFunction = null;
    } catch (error: any) {
      this.logger.error(
        `Failed to restore original function: ${error.message}`
      );
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Check if the patch is currently applied
   */
  isPatchApplied(): boolean {
    return this.patched;
  }

  /**
   * Manually trigger re-patching (useful if VRCX reloads utilities)
   */
  reapplyPatch() {
    if (this.patched) {
      this.logger.log("Re-applying patch...");
      this.restoreOriginalFunction();
    }
    this.patchReplaceBioSymbols();
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = BioSymbolsPatchPlugin;
