// 
/**
 * Invite Params Fix Plugin
 * 
 * Patches VRCX's sendInvite/sendRequestInvite functions to fix the duplicate worldId bug
 * where instanceId and worldId are both set to the full location string, causing:
 * "400 Bad Request - Invalid location" with endpoint like:
 * instances/wrld_xxx:wrld_xxx:12345~region(us)
 * 
 * Root Cause:
 * - notification.js:299 has worldId: L.tag (should be L.worldId)
 * - InviteDialog.vue has both params set to D.worldId (full location)
 * - SendInviteConfirmDialog.vue has both set to J.worldId (full location)
 * - EditAndSendInviteDialog.vue has both set to J.worldId (full location)
 * 
 * This plugin intercepts the API calls and corrects the parameters before sending.
 */

class InviteParamsFixPlugin extends CustomModule {
  constructor() {
    super({
      name: "Invite Params Fix 🔧",
      description: "Fixes duplicate worldId bug in VRCX invite API calls that causes '400 Invalid location' errors",
      authors: [{
        name: "Bluscream",
        description: "VRCX Plugin System Maintainer",
        userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
      }],
      tags: ["Patch", "Bug Fix", "Core"],
      required_dependencies: [],
    });
  }

  async load() {
    this.logger.log("Invite Params Fix plugin ready");
    this.loaded = true;
  }

  async start() {
    // Wait for notification request API to be available
    if (!window.request?.notificationRequest) {
      this.logger.error("Notification request API not available");
      return;
    }

    this.patchSendInvite();
    this.patchSendRequestInvite();
    this.patchSendInviteResponse();

    this.enabled = true;
    this.started = true;
    this.logger.log("Invite parameters patched - duplicate worldId bug fixed");
  }

  patchSendInvite() {
    const original = window.request.notificationRequest.sendInvite;
    if (!original) {
      this.logger.warn("sendInvite not found");
      return;
    }

    window.request.notificationRequest.sendInvite = (params, receiverUserId) => {
      // Fix the params if needed
      const fixed = this.fixInviteParams(params, 'sendInvite');
      return original.call(window.request.notificationRequest, fixed, receiverUserId);
    };

    this.logger.log("✓ Patched sendInvite");
  }

  patchSendRequestInvite() {
    const original = window.request.notificationRequest.sendRequestInvite;
    if (!original) {
      this.logger.warn("sendRequestInvite not found");
      return;
    }

    window.request.notificationRequest.sendRequestInvite = (params, receiverUserId) => {
      // Fix the params if needed
      const fixed = this.fixInviteParams(params, 'sendRequestInvite');
      return original.call(window.request.notificationRequest, fixed, receiverUserId);
    };

    this.logger.log("✓ Patched sendRequestInvite");
  }

  patchSendInviteResponse() {
    const original = window.request.notificationRequest.sendInviteResponse;
    if (!original) {
      this.logger.warn("sendInviteResponse not found");
      return;
    }

    window.request.notificationRequest.sendInviteResponse = (params, inviteId) => {
      // Fix the params if needed
      const fixed = this.fixInviteParams(params, 'sendInviteResponse');
      return original.call(window.request.notificationRequest, fixed, inviteId);
    };

    this.logger.log("✓ Patched sendInviteResponse");
  }

  /**
   * Fix invite parameters to prevent duplicate worldId in instance string
   * @param {object} params - Original parameters
   * @param {string} apiName - Name of API for logging
   * @returns {object} Fixed parameters
   */
  fixInviteParams(params, apiName) {
    if (!params) return params;

    const fixed = { ...params };

    // Check if worldId looks like a full location string (contains ':')
    if (fixed.worldId && fixed.worldId.includes(':')) {
      const parsed = (window as any).utils?.parseLocation(fixed.worldId);
      
      if (parsed && parsed.worldId) {
        this.logger.log(
          `[${apiName}] Fixed duplicate worldId bug: "${fixed.worldId}" -> worldId:"${parsed.worldId}", instanceId:"${fixed.instanceId || fixed.worldId}"`
        );

        // Keep instanceId as the full location if not already set
        if (!fixed.instanceId || fixed.instanceId === fixed.worldId) {
          fixed.instanceId = fixed.worldId;  // Full location string
        }

        // Set worldId to just the world ID part
        fixed.worldId = parsed.worldId;
      }
    }

    // Additional validation: if instanceId is just a worldId, it should be the full location
    if (fixed.instanceId && !fixed.instanceId.includes(':') && fixed.instanceId.startsWith('wrld_')) {
      // instanceId should be full location, not just worldId
      // This is likely a bug, but we can't fix it without knowing the actual instance
      this.logger.warn(
        `[${apiName}] instanceId appears to be just a worldId (missing instance number): "${fixed.instanceId}"`
      );
    }

    return fixed;
  }

  async stop() {
    this.logger.log("Stopping Invite Params Fix plugin - note: patches remain active until VRCX restart");
    await super.stop();
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = InviteParamsFixPlugin;
