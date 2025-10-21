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
    // Track previous visibility state to detect open transitions
    let lastUserDialogVisible = false;
    let lastWorldDialogVisible = false;
    let lastAvatarDialogVisible = false;
    let lastGroupDialogVisible = false;
    let lastModerateGroupDialogVisible = false;
    let lastGroupMemberModerationVisible = false;
    let lastLaunchDialogVisible = false;
    let lastGalleryDialogVisible = false;
    let lastFullscreenImageDialogVisible = false;
    let lastFavoriteDialogVisible = false;
    let lastWorldImportDialogVisible = false;
    let lastAvatarImportDialogVisible = false;
    let lastFriendImportDialogVisible = false;
    let lastPreviousInstancesDialogVisible = false;
    let lastRegistryBackupDialogVisible = false;
    let lastVRCXUpdateDialogVisible = false;
    let lastChangeLogDialogVisible = false;
    let lastEditInviteMessageDialogVisible = false;
    let lastAvatarProviderDialogVisible = false;
    
    // Watch user dialog via store subscription
    this.subscribe('USER', ({ userDialog }) => {
      const isVisible = userDialog?.visible && userDialog?.id;
      if (isVisible && !lastUserDialogVisible) {
        // Dialog just opened (transition from false -> true)
        this.emit('ShowUserDialog', {
          userId: userDialog.id,
          dialog: userDialog,
          timestamp: Date.now()
        });
      }
      lastUserDialogVisible = !!isVisible;
    });

    // Watch world dialog
    this.subscribe('WORLD', ({ worldDialog }) => {
      const isVisible = worldDialog?.visible && worldDialog?.id;
      if (isVisible && !lastWorldDialogVisible) {
        // Dialog just opened (transition from false -> true)
        this.emit('ShowWorldDialog', {
          worldId: worldDialog.id,
          shortName: worldDialog.$location?.shortName || '',
          dialog: worldDialog,
          timestamp: Date.now()
        });
      }
      lastWorldDialogVisible = !!isVisible;
    });

    // Watch avatar dialog
    this.subscribe('AVATAR', ({ avatarDialog }) => {
      const isVisible = avatarDialog?.visible && avatarDialog?.id;
      if (isVisible && !lastAvatarDialogVisible) {
        this.emit('ShowAvatarDialog', {
          avatarId: avatarDialog.id,
          dialog: avatarDialog,
          timestamp: Date.now()
        });
      }
      lastAvatarDialogVisible = !!isVisible;
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
      const isGroupDialogVisible = groupDialog?.visible && groupDialog?.id;
      if (isGroupDialogVisible && !lastGroupDialogVisible) {
        this.emit('ShowGroupDialog', {
          groupId: groupDialog.id,
          dialog: groupDialog,
          timestamp: Date.now()
        });
      }
      lastGroupDialogVisible = !!isGroupDialogVisible;
      
      const isModerateGroupDialogVisible = moderateGroupDialog?.visible && moderateGroupDialog?.userId;
      if (isModerateGroupDialogVisible && !lastModerateGroupDialogVisible) {
        this.emit('ShowModerateGroupDialog', {
          userId: moderateGroupDialog.userId,
          dialog: moderateGroupDialog,
          timestamp: Date.now()
        });
      }
      lastModerateGroupDialogVisible = !!isModerateGroupDialogVisible;
      
      const isGroupMemberModerationVisible = groupMemberModeration?.visible && groupMemberModeration?.id;
      if (isGroupMemberModerationVisible && !lastGroupMemberModerationVisible) {
        this.emit('ShowGroupMemberModerationDialog', {
          groupId: groupMemberModeration.id,
          userId: groupMemberModeration.openWithUserId || '',
          dialog: groupMemberModeration,
          timestamp: Date.now()
        });
      }
      lastGroupMemberModerationVisible = !!isGroupMemberModerationVisible;
    });

    // Watch launch dialog
    this.subscribe('LAUNCH', ({ launchDialogData }) => {
      const isVisible = launchDialogData?.visible && launchDialogData?.tag;
      if (isVisible && !lastLaunchDialogVisible) {
        this.emit('ShowLaunchDialog', {
          location: launchDialogData.tag,
          shortName: launchDialogData.shortName || '',
          dialog: launchDialogData,
          timestamp: Date.now()
        });
      }
      lastLaunchDialogVisible = !!isVisible;
    });

    // Watch GALLERY store (consolidate gallery and fullscreen image dialogs)
    this.subscribe('GALLERY', (state) => {
      const isGalleryVisible = !!state.galleryDialogVisible;
      if (isGalleryVisible && !lastGalleryDialogVisible) {
        this.emit('ShowGalleryDialog', {
          dialog: state,
          timestamp: Date.now()
        });
      }
      lastGalleryDialogVisible = isGalleryVisible;
      
      const isFullscreenImageVisible = !!state.fullscreenImageDialog?.visible;
      if (isFullscreenImageVisible && !lastFullscreenImageDialogVisible) {
        this.emit('ShowFullscreenImageDialog', {
          imageUrl: state.fullscreenImageDialog.imageUrl,
          fileName: state.fullscreenImageDialog.fileName || '',
          dialog: state.fullscreenImageDialog,
          timestamp: Date.now()
        });
      }
      lastFullscreenImageDialogVisible = isFullscreenImageVisible;
    });

    // Watch favorite dialog
    this.subscribe('FAVORITE', ({ favoriteDialog, worldImportDialogVisible, avatarImportDialogVisible, friendImportDialogVisible }) => {
      const isFavoriteDialogVisible = !!favoriteDialog?.visible;
      if (isFavoriteDialogVisible && !lastFavoriteDialogVisible) {
        this.emit('ShowFavoriteDialog', {
          type: favoriteDialog.type,
          objectId: favoriteDialog.objectId,
          dialog: favoriteDialog,
          timestamp: Date.now()
        });
      }
      lastFavoriteDialogVisible = isFavoriteDialogVisible;
      
      const isWorldImportVisible = !!worldImportDialogVisible;
      if (isWorldImportVisible && !lastWorldImportDialogVisible) {
        this.emit('ShowWorldImportDialog', {
          timestamp: Date.now()
        });
      }
      lastWorldImportDialogVisible = isWorldImportVisible;
      
      const isAvatarImportVisible = !!avatarImportDialogVisible;
      if (isAvatarImportVisible && !lastAvatarImportDialogVisible) {
        this.emit('ShowAvatarImportDialog', {
          timestamp: Date.now()
        });
      }
      lastAvatarImportDialogVisible = isAvatarImportVisible;
      
      const isFriendImportVisible = !!friendImportDialogVisible;
      if (isFriendImportVisible && !lastFriendImportDialogVisible) {
        this.emit('ShowFriendImportDialog', {
          timestamp: Date.now()
        });
      }
      lastFriendImportDialogVisible = isFriendImportVisible;
    });

    // Watch instance dialog
    this.subscribe('INSTANCE', ({ previousInstancesInfoDialogVisible, previousInstancesInfoDialogInstanceId }) => {
      const isVisible = previousInstancesInfoDialogVisible && previousInstancesInfoDialogInstanceId;
      if (isVisible && !lastPreviousInstancesDialogVisible) {
        this.emit('ShowPreviousInstancesInfoDialog', {
          instanceId: previousInstancesInfoDialogInstanceId,
          timestamp: Date.now()
        });
      }
      lastPreviousInstancesDialogVisible = !!isVisible;
    });

    // Watch VRCX system dialogs
    this.subscribe('VRCX', ({ isRegistryBackupDialogVisible }) => {
      const isVisible = !!isRegistryBackupDialogVisible;
      if (isVisible && !lastRegistryBackupDialogVisible) {
        this.emit('ShowRegistryBackupDialog', {
          timestamp: Date.now()
        });
      }
      lastRegistryBackupDialogVisible = isVisible;
    });

    this.subscribe('VRCXUPDATER', ({ VRCXUpdateDialog, changeLogDialog }) => {
      const isVRCXUpdateVisible = !!VRCXUpdateDialog?.visible;
      if (isVRCXUpdateVisible && !lastVRCXUpdateDialogVisible) {
        this.emit('ShowVRCXUpdateDialog', {
          dialog: VRCXUpdateDialog,
          timestamp: Date.now()
        });
      }
      lastVRCXUpdateDialogVisible = isVRCXUpdateVisible;
      
      const isChangeLogVisible = !!changeLogDialog?.visible;
      if (isChangeLogVisible && !lastChangeLogDialogVisible) {
        this.emit('ShowChangeLogDialog', {
          dialog: changeLogDialog,
          timestamp: Date.now()
        });
      }
      lastChangeLogDialogVisible = isChangeLogVisible;
    });

    // Watch invite message dialog
    this.subscribe('INVITE', ({ editInviteMessageDialog }) => {
      const isVisible = !!editInviteMessageDialog?.visible;
      if (isVisible && !lastEditInviteMessageDialogVisible) {
        this.emit('ShowEditInviteMessageDialog', {
          dialog: editInviteMessageDialog,
          timestamp: Date.now()
        });
      }
      lastEditInviteMessageDialogVisible = isVisible;
    });

    // Watch avatar provider dialog
    this.subscribe('AVATARPROVIDER', ({ isAvatarProviderDialogVisible }) => {
      const isVisible = !!isAvatarProviderDialogVisible;
      if (isVisible && !lastAvatarProviderDialogVisible) {
        this.emit('ShowAvatarProviderDialog', {
          timestamp: Date.now()
        });
      }
      lastAvatarProviderDialogVisible = isVisible;
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
