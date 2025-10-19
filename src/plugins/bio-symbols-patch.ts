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
      name: "🔤 Bio Symbols Patch",
      description:
        "Patches replaceBioSymbols function to handle non-string inputs safely",
      authors: [        {
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }      ],
      tags: ["Bugfix", "Utility", "Patch", "Fix"],
      dependencies: [],
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
      // Try to find the function in utils
      if ((window as any).utils?.replaceBioSymbols) {
        this.logger.log("Found replaceBioSymbols in window.utils");
        this.patchFunction((window as any).utils, "replaceBioSymbols");
        return;
      }

      // Try to find it in shared utils
      const sharedUtils = (window as any).$pinia?._s?.get?.("Utils");
      if (sharedUtils?.replaceBioSymbols) {
        this.logger.log("Found replaceBioSymbols in pinia Utils store");
        this.patchFunction(sharedUtils, "replaceBioSymbols");
        return;
      }

      // If not found, create a patched version and inject it
      this.logger.log(
        "replaceBioSymbols not found yet, will inject patched version"
      );
      this.injectPatchedFunction();
    } catch (error: any) {
      this.logger.error(`Failed to patch replaceBioSymbols: ${error.message}`);
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
   * Inject patched function if original not found
   */
  injectPatchedFunction() {
    if (!(window as any).utils) {
      this.logger.warn("window.utils not available, cannot inject patch");
      return;
    }

    // Create and inject the patched function
    (window as any).utils.replaceBioSymbols = this.createPatchedFunction(null);
    this.patched = true;

    this.logger.log("✓ Injected patched replaceBioSymbols into window.utils");
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
