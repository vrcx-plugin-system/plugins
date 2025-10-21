// 
class DialogEventsApiPlugin extends CustomModule {
  constructor() {
    super({
      name: "Dialog Events API 📢",
      description: "Tracks and emits events when VRCX native dialogs are opened",
      authors: [{
          name: "Bluscream",
          description: "VRCX Plugin System Maintainer",
          userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        }],
      tags: ["API", "Core", "Dialog", "Events", "Library"],
      required_dependencies: [],
    });
  }

  async load() {
    // Register events for all implemented VRCX dialog types (21 total)
    // Status matches docs/dialogs.csv - only tracking dialogs that exist in VRCX

    // User & Social Dialogs (4)
    this.registerEvent('ShowUserDialog', {
      description: 'Fired when a user dialog is opened',
      payload: {
        userId: 'string - User ID that was opened',
        dialog: 'object - Full dialog reference (userDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: false,  // VRCX already logs this
      logToConsole: true
    });

    this.registerEvent('ShowGroupDialog', {
      description: 'Fired when a group dialog is opened',
      payload: {
        groupId: 'string - Group ID that was opened',
        dialog: 'object - Full dialog reference (groupDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowModerateGroupDialog', {
      description: 'Fired when group moderation dialog is opened',
      payload: {
        userId: 'string - User ID being moderated',
        dialog: 'object - Full dialog reference (moderateGroupDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowGroupMemberModerationDialog', {
      description: 'Fired when group member moderation dialog is opened',
      payload: {
        groupId: 'string - Group ID',
        userId: 'string - User ID (optional)',
        dialog: 'object - Full dialog reference (groupMemberModeration state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    // Content Dialogs (4)
    this.registerEvent('ShowWorldDialog', {
      description: 'Fired when a world dialog is opened',
      payload: {
        worldId: 'string - World ID or location tag',
        shortName: 'string - Optional short name',
        dialog: 'object - Full dialog reference (worldDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowAvatarDialog', {
      description: 'Fired when an avatar dialog is opened',
      payload: {
        avatarId: 'string - Avatar ID that was opened',
        dialog: 'object - Full dialog reference (avatarDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowAvatarAuthorDialog', {
      description: 'Fired when avatar author dialog is opened (may trigger ShowAvatarDialog or ShowUserDialog)',
      payload: {
        refUserId: 'string - Reference user ID',
        ownerUserId: 'string - Owner user ID',
        currentAvatarImageUrl: 'string - Avatar image URL',
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
        dialog: 'object - Full dialog reference (launchDialogData state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    // Import/Export Dialogs (4)
    this.registerEvent('ShowWorldImportDialog', {
      description: 'Fired when world favorites import dialog is opened',
      payload: { timestamp: 'number - Unix timestamp' },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowAvatarImportDialog', {
      description: 'Fired when avatar favorites import dialog is opened',
      payload: { timestamp: 'number - Unix timestamp' },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowFriendImportDialog', {
      description: 'Fired when friend import dialog is opened',
      payload: { timestamp: 'number - Unix timestamp' },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowFavoriteDialog', {
      description: 'Fired when favorite management dialog is opened',
      payload: {
        type: 'string - Favorite type (world/avatar)',
        objectId: 'string - Object ID',
        dialog: 'object - Full dialog reference (favoriteDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    // Media/Gallery Dialogs (2)
    this.registerEvent('ShowFullscreenImageDialog', {
      description: 'Fired when fullscreen image viewer is opened',
      payload: {
        imageUrl: 'string - Image URL',
        fileName: 'string - File name',
        dialog: 'object - Full dialog reference (fullscreenImageDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowGalleryDialog', {
      description: 'Fired when gallery dialog is opened',
      payload: {
        dialog: 'object - Gallery dialog state',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    // Settings/System Dialogs (5)
    this.registerEvent('ShowRegistryBackupDialog', {
      description: 'Fired when registry backup dialog is opened',
      payload: { timestamp: 'number - Unix timestamp' },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowVRCXUpdateDialog', {
      description: 'Fired when VRCX update dialog is opened',
      payload: {
        dialog: 'object - Full dialog reference (VRCXUpdateDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowChangeLogDialog', {
      description: 'Fired when changelog dialog is opened',
      payload: {
        dialog: 'object - Full dialog reference (changeLogDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowAvatarProviderDialog', {
      description: 'Fired when avatar provider dialog is opened',
      payload: { timestamp: 'number - Unix timestamp' },
      broadcastIPC: true,
      logToConsole: true
    });

    this.registerEvent('ShowPreviousInstancesInfoDialog', {
      description: 'Fired when previous instances info dialog is opened',
      payload: {
        instanceId: 'string - Instance ID',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    // Notification/Message Dialogs (1)
    this.registerEvent('ShowEditInviteMessageDialog', {
      description: 'Fired when edit invite message dialog is opened',
      payload: {
        dialog: 'object - Full dialog reference (editInviteMessageDialog state)',
        timestamp: 'number - Unix timestamp'
      },
      broadcastIPC: true,
      logToConsole: true
    });

    this.logger.log("Dialog Events API ready - 21 dialog events registered");
    this.loaded = true;
  }

  async start() {
    // Setup watchers for VRCX native dialogs
    this.setupDialogWatchers();

    this.enabled = true;
    this.started = true;
    this.logger.log("Dialog Events API started - watching native dialogs");
  }

  setupDialogWatchers() {
    // Watch user dialog via store subscription
    this.subscribe('USER', ({ userDialog }) => {
      this.logger.log(`[DEBUG] USER subscription triggered - visible: ${userDialog?.visible}, id: ${userDialog?.id}`);
      if (userDialog?.visible && userDialog?.id) {
        this.logger.log(`[DEBUG] Emitting ShowUserDialog for ${userDialog.id}`);
        this.emit('ShowUserDialog', {
          userId: userDialog.id,
          dialog: userDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch world dialog
    this.subscribe('WORLD', ({ worldDialog }) => {
      this.logger.log(`[DEBUG] WORLD subscription triggered - visible: ${worldDialog?.visible}, id: ${worldDialog?.id}`);
      if (worldDialog?.visible && worldDialog?.id) {
        this.logger.log(`[DEBUG] Emitting ShowWorldDialog for ${worldDialog.id}`);
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

    // Hook showAvatarAuthorDialog function (helper that calls other dialogs)
    this.registerPreHook('$pinia.avatar.showAvatarAuthorDialog', (args) => {
      const [refUserId, ownerUserId, currentAvatarImageUrl] = args;
      this.emit('ShowAvatarAuthorDialog', {
        refUserId: refUserId || '',
        ownerUserId: ownerUserId || '',
        currentAvatarImageUrl: currentAvatarImageUrl || '',
        timestamp: Date.now()
      });
    });

    // Watch GROUP store (consolidate all group-related dialogs)
    this.subscribe('GROUP', ({ groupDialog, moderateGroupDialog, groupMemberModeration }) => {
      if (groupDialog?.visible && groupDialog?.id) {
        this.emit('ShowGroupDialog', {
          groupId: groupDialog.id,
          dialog: groupDialog,
          timestamp: Date.now()
        });
      }
      if (moderateGroupDialog?.visible && moderateGroupDialog?.userId) {
        this.emit('ShowModerateGroupDialog', {
          userId: moderateGroupDialog.userId,
          dialog: moderateGroupDialog,
          timestamp: Date.now()
        });
      }
      if (groupMemberModeration?.visible && groupMemberModeration?.id) {
        this.emit('ShowGroupMemberModerationDialog', {
          groupId: groupMemberModeration.id,
          userId: groupMemberModeration.openWithUserId || '',
          dialog: groupMemberModeration,
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

    // Watch GALLERY store (consolidate gallery and fullscreen image dialogs)
    this.subscribe('GALLERY', (state) => {
      if (state.galleryDialogVisible) {
        this.emit('ShowGalleryDialog', {
          dialog: state,
          timestamp: Date.now()
        });
      }
      if (state.fullscreenImageDialog?.visible) {
        this.emit('ShowFullscreenImageDialog', {
          imageUrl: state.fullscreenImageDialog.imageUrl,
          fileName: state.fullscreenImageDialog.fileName || '',
          dialog: state.fullscreenImageDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch favorite dialog
    this.subscribe('FAVORITE', ({ favoriteDialog, worldImportDialogVisible, avatarImportDialogVisible, friendImportDialogVisible }) => {
      if (favoriteDialog?.visible) {
        this.emit('ShowFavoriteDialog', {
          type: favoriteDialog.type,
          objectId: favoriteDialog.objectId,
          dialog: favoriteDialog,
          timestamp: Date.now()
        });
      }
      if (worldImportDialogVisible) {
        this.emit('ShowWorldImportDialog', {
          timestamp: Date.now()
        });
      }
      if (avatarImportDialogVisible) {
        this.emit('ShowAvatarImportDialog', {
          timestamp: Date.now()
        });
      }
      if (friendImportDialogVisible) {
        this.emit('ShowFriendImportDialog', {
          timestamp: Date.now()
        });
      }
    });

    // Watch instance dialog
    this.subscribe('INSTANCE', ({ previousInstancesInfoDialogVisible, previousInstancesInfoDialogInstanceId }) => {
      if (previousInstancesInfoDialogVisible && previousInstancesInfoDialogInstanceId) {
        this.emit('ShowPreviousInstancesInfoDialog', {
          instanceId: previousInstancesInfoDialogInstanceId,
          timestamp: Date.now()
        });
      }
    });

    // Watch VRCX system dialogs
    this.subscribe('VRCX', ({ isRegistryBackupDialogVisible }) => {
      if (isRegistryBackupDialogVisible) {
        this.emit('ShowRegistryBackupDialog', {
          timestamp: Date.now()
        });
      }
    });

    this.subscribe('VRCXUPDATER', ({ VRCXUpdateDialog, changeLogDialog }) => {
      if (VRCXUpdateDialog?.visible) {
        this.emit('ShowVRCXUpdateDialog', {
          dialog: VRCXUpdateDialog,
          timestamp: Date.now()
        });
      }
      if (changeLogDialog?.visible) {
        this.emit('ShowChangeLogDialog', {
          dialog: changeLogDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch invite message dialog
    this.subscribe('INVITE', ({ editInviteMessageDialog }) => {
      if (editInviteMessageDialog?.visible) {
        this.emit('ShowEditInviteMessageDialog', {
          dialog: editInviteMessageDialog,
          timestamp: Date.now()
        });
      }
    });

    // Watch avatar provider dialog
    this.subscribe('AVATARPROVIDER', ({ isAvatarProviderDialogVisible }) => {
      if (isAvatarProviderDialogVisible) {
        this.emit('ShowAvatarProviderDialog', {
          timestamp: Date.now()
        });
      }
    });

    this.logger.log("Dialog watchers registered via store subscriptions");
  }

  async stop() {
    this.logger.log("Stopping Dialog Events API");
    this.enabled = false;
    this.started = false;
  }

  async unload() {
    this.logger.log("Unloading Dialog Events API");
    this.loaded = false;
  }
}

// Export plugin class for module loader
window.customjs.__LAST_PLUGIN_CLASS__ = DialogEventsApiPlugin;
