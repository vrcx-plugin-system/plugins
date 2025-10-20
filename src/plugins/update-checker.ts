/**
 * Update Checker 🔄
 * Checks for updates to the core system and plugins, with automatic hot-reload support
 */
// 
interface GitHubRelease {
    tag_name: string;
    name: string;
    html_url: string;
    published_at: string;
    body: string;
}

interface GitHubRateLimit {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
}

interface PluginUpdateInfo {
    id: string;
    name: string;
    currentVersion?: string;
    latestVersion?: string;
    needsUpdate: boolean;
    url: string;
    repoUrl?: string;
}

class UpdateCheckerPlugin extends CustomModule {
    private checkTimer: NodeJS.Timeout | null = null;
    private pluginCheckTimer: NodeJS.Timeout | null = null;
    private isCheckingCore = false;
    private isCheckingPlugins = false;
    private lastCoreCheck = 0;
    private lastPluginCheck = 0;
    private rateLimit: GitHubRateLimit | null = null;
    private coreRepoOwner: string = '';
    private coreRepoName: string = '';

    // GitHub API configuration
    private readonly GITHUB_API = 'https://api.github.com';
    private readonly TARGET_PATH = '%APPDATA%\\VRCX\\custom.js';
    
    // Computed from sourceUrl at runtime
    private get downloadUrl(): string {
        return `https://github.com/${this.coreRepoOwner}/${this.coreRepoName}/releases/latest/download/custom.js`;
    }

    constructor() {
        super({
            name: 'Update Checker 🔄',
            authors: [{
                name: 'Bluscream',
                description: 'VRCX Plugin System Maintainer',
                userId: 'usr_08082729-592d-4098-9a21-83c8dd37a844'
            }],
            description: 'Automatically checks for updates to VRCX core system and plugins with hot-reload support',
            tags: ['Utility', 'Updates', 'Automation'],
            required_dependencies: ['dialog-api']
        });

        this.actionButtons = [
            {
                title: 'Check Core Updates',
                color: 'primary',
                icon: 'ri-refresh-line',
                description: 'Manually check for core system updates',
                callback: async () => {
                    await this.checkCoreUpdate(true);
                }
            },
            {
                title: 'Check Plugin Updates',
                color: 'info',
                icon: 'ri-plugin-line',
                description: 'Manually check for plugin updates',
                callback: async () => {
                    await this.checkPluginUpdates(true);
                }
            },
            {
                title: 'Download Core Update',
                color: 'success',
                icon: 'ri-download-line',
                description: 'Download latest core system update',
                callback: async () => {
                    await this.downloadCoreUpdate();
                }
            },
            {
                title: 'Show Rate Limit Status',
                color: 'warning',
                icon: 'ri-time-line',
                description: 'Display current GitHub API rate limit status',
                callback: () => {
                    this.showRateLimitStatus();
                }
            },
            {
                title: 'Reset Dismissed Updates',
                color: 'danger',
                icon: 'ri-close-circle-line',
                description: 'Clear the list of dismissed update notifications',
                callback: () => {
                    this.settings.store.dismissedCoreVersions = '[]';
                    this.logger.showSuccess('Dismissed updates cleared');
                }
            }
        ];
    }

    async load(): Promise<void> {
        await super.load();
        
        const SettingType = (window as any).customjs.types.SettingType;

        this.settings = this.defineSettings({
            // Core update checking
            checkCoreOnStartup: {
                type: SettingType.BOOLEAN,
                description: 'Automatically check for core system updates when the application starts',
                default: true
            },
            coreCheckInterval: {
                type: SettingType.TIMESPAN,
                description: 'How often to check for core system updates',
                default: 3600000, // 1 hour
                min: 300000 // 5 minutes minimum
            },
            showCoreNotification: {
                type: SettingType.BOOLEAN,
                description: 'Display a notification when a new core version is available',
                default: true
            },
            openReleasePageOnUpdate: {
                type: SettingType.BOOLEAN,
                description: 'Automatically open the GitHub release page when an update is found',
                default: false
            },

            // Plugin update checking
            checkPluginsOnStartup: {
                type: SettingType.BOOLEAN,
                description: 'Automatically check for plugin updates when the application starts',
                default: true
            },
            pluginCheckInterval: {
                type: SettingType.TIMESPAN,
                description: 'How often to check for plugin updates',
                default: 7200000, // 2 hours
                min: 300000 // 5 minutes minimum
            },
            autoUpdatePlugins: {
                type: SettingType.BOOLEAN,
                description: 'Automatically hot-reload updated plugins without confirmation',
                default: false
            },
            showNewPlugins: {
                type: SettingType.BOOLEAN,
                description: 'Display a modal when new plugins are discovered in repositories',
                default: true
            },

            // GitHub API settings
            githubToken: {
                type: SettingType.STRING,
                description: 'Optional: Increases API rate limit from 60 to 5000 requests/hour',
                default: ''
            },
            showRateLimitWarnings: {
                type: SettingType.BOOLEAN,
                description: 'Display warnings when approaching GitHub API rate limits',
                default: true
            },

            // Notification settings
            enableDesktopNotifications: {
                type: SettingType.BOOLEAN,
                description: 'Show Windows desktop notifications for updates',
                default: true
            },
            enableVrNotifications: {
                type: SettingType.BOOLEAN,
                description: 'Show VR overlay notifications (XSOverlay/OVRToolkit) for updates',
                default: false
            },
            vrNotificationTimeout: {
                type: SettingType.NUMBER,
                description: 'VR notification duration in seconds',
                default: 10,
                min: 3,
                max: 60
            },
            announceViaIpc: {
                type: SettingType.BOOLEAN,
                description: 'Broadcast update notifications to external apps via IPC',
                default: false
            },

            // Hidden settings for tracking
            seenPlugins: {
                type: SettingType.STRING,
                description: 'Tracked seen plugins',
                default: '[]',
                hidden: true
            },
            lastCoreVersion: {
                type: SettingType.STRING,
                description: 'Last seen core version',
                default: '',
                hidden: true
            },
            dismissedCoreVersions: {
                type: SettingType.STRING,
                description: 'Dismissed core versions',
                default: '[]',
                hidden: true
            }
        });
        // Parse repository info from sourceUrl
        this.parseRepositoryInfo();
        
        // Check on startup if enabled
        if (this.settings.store.checkCoreOnStartup) {
            setTimeout(() => this.checkCoreUpdate(false), 5000); // Wait 5s after startup
        }
        
        if (this.settings.store.checkPluginsOnStartup) {
            setTimeout(() => this.checkPluginUpdates(false), 7000); // Wait 7s after startup
        }
    }

    async start(): Promise<void> {
        if (!this.enabled) return;
        
        this.started = true;
        
        // Start periodic checking
        this.startPeriodicChecks();
        
        this.logger.log('Update checker started');
    }

    async stop(): Promise<void> {
        this.stopPeriodicChecks();
        this.started = false;
        this.logger.log('Update checker stopped');
    }

    async onLogin(): Promise<void> {
        // Built-in lifecycle hook - called when user logs into VRChat
        if (this.settings.store.checkCoreOnStartup) {
            setTimeout(() => this.checkCoreUpdate(false), 5000);
        }
        
        if (this.settings.store.checkPluginsOnStartup) {
            setTimeout(() => this.checkPluginUpdates(false), 7000);
        }
    }

    private parseRepositoryInfo(): void {
        try {
            const sourceUrl = (window as any).customjs?.sourceUrl || '';
            if (!sourceUrl) {
                this.logger.warn('No sourceUrl found in window.customjs');
                return;
            }
            
            const utils = (window as any).customjs?.utils;
            if (!utils?.parseRepositoryUrl) {
                this.logger.warn('Utils.parseRepositoryUrl not available, falling back to manual parsing');
                // Fallback to simple regex
                const match = sourceUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (match) {
                    this.coreRepoOwner = match[1];
                    this.coreRepoName = match[2];
                }
                return;
            }
            
            const repoInfo = utils.parseRepositoryUrl(sourceUrl);
            if (repoInfo) {
                this.coreRepoOwner = repoInfo.owner;
                this.coreRepoName = repoInfo.repo;
                this.logger.log(`Parsed repository: ${this.coreRepoOwner}/${this.coreRepoName} (${repoInfo.platform})`);
                
                if (repoInfo.branch) {
                    this.logger.log(`  → Branch: ${repoInfo.branch}`);
                }
            } else {
                this.logger.warn('Failed to parse repository info from sourceUrl');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error parsing repository info: ${errorMsg}`);
        }
    }

    private startPeriodicChecks(): void {
        this.stopPeriodicChecks();
        
        // Core update checking
        this.checkTimer = setInterval(() => {
            this.checkCoreUpdate(false);
        }, this.settings.store.coreCheckInterval);
        
        // Plugin update checking
        this.pluginCheckTimer = setInterval(() => {
            this.checkPluginUpdates(false);
        }, this.settings.store.pluginCheckInterval);
    }

    private stopPeriodicChecks(): void {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        if (this.pluginCheckTimer) {
            clearInterval(this.pluginCheckTimer);
            this.pluginCheckTimer = null;
        }
    }

    private async fetchWithRateLimit(url: string): Promise<Response> {
        const headers: HeadersInit = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        const token = this.settings.store.githubToken;
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        
        const response = await fetch(url, { headers });
        
        // Update rate limit info
        this.rateLimit = {
            limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
            remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
            reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
            used: parseInt(response.headers.get('X-RateLimit-Used') || '0')
        };
        
        // Warn if approaching rate limit
        if (this.settings.store.showRateLimitWarnings && this.rateLimit.remaining < 10) {
            this.logger.showWarning(
                `GitHub API rate limit low: ${this.rateLimit.remaining}/${this.rateLimit.limit} remaining`
            );
        }
        
        return response;
    }

    private async checkCoreUpdate(manual: boolean): Promise<void> {
        if (this.isCheckingCore) {
            if (manual) {
                this.logger.showInfo('Core update check already in progress');
            }
            return;
        }
        
        if (!this.coreRepoOwner || !this.coreRepoName) {
            if (manual) {
                this.logger.showError('Repository information not available');
            }
            return;
        }
        
        this.isCheckingCore = true;
        
        try {
            if (manual) {
                this.logger.showInfo('Checking for core system updates...');
            }
            
            const url = `${this.GITHUB_API}/repos/${this.coreRepoOwner}/${this.coreRepoName}/releases/latest`;
            const response = await this.fetchWithRateLimit(url);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }
            
            const release: GitHubRelease = await response.json();
            const latestVersion = release.tag_name;
            const currentBuild = (window as any).customjs?.build || 0;
            const latestBuild = parseInt(latestVersion);
            
            this.lastCoreCheck = Date.now();
            
            // Check if this is a new version
            const dismissedVersions = JSON.parse(this.settings.store.dismissedCoreVersions || '[]');
            const isDismissed = dismissedVersions.includes(latestVersion);
            const isNewer = latestBuild > currentBuild;
            
            if (isNewer && !isDismissed) {
                this.settings.store.lastCoreVersion = latestVersion;
                await this.showCoreUpdateNotification(release, manual);
            } else if (manual) {
                if (isDismissed) {
                    this.logger.showInfo(`Update ${latestVersion} was previously dismissed. Current: ${currentBuild}`);
                } else {
                    this.logger.showSuccess(`Plugin System is up to date (build ${currentBuild})`);
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to check for core updates:', errorMsg);
            if (manual) {
                this.logger.showError('Failed to check for updates: ' + errorMsg);
            }
        } finally {
            this.isCheckingCore = false;
        }
    }

    private async showCoreUpdateNotification(release: GitHubRelease, manual: boolean): Promise<void> {
        const currentBuild = (window as any).customjs?.build || 0;
        const releaseDate = new Date(release.published_at).toLocaleString();
        
        // Enhanced notification message
        const message = `A new version of the VRCX Plugin System is available!\n\nCurrent: ${currentBuild}\nLatest: ${release.tag_name}\n\nReleased: ${releaseDate}`;
        
        // Multi-channel notifications
        if (this.settings.store.showCoreNotification || manual) {
            this.logger.showInfo('New VRCX Plugin System update available: ' + release.tag_name);
            
            // Desktop notification
            if (this.settings.store.enableDesktopNotifications && (window as any).AppApi?.DesktopNotification) {
                (window as any).AppApi.DesktopNotification(
                    '🔄 Plugin System Update Available',
                    `${release.tag_name} is now available`,
                    ''
                );
            }
            
            // VR notifications
            if (this.settings.store.enableVrNotifications) {
                this.sendVrNotification(
                    '🔄 Plugin System Update',
                    `${release.tag_name} available`
                );
            }
            
            // IPC announcement
            if (this.settings.store.announceViaIpc && (window as any).AppApi?.SendIpc) {
                (window as any).AppApi.SendIpc('UpdateAvailable', JSON.stringify({
                    component: 'plugin-system',
                    currentVersion: currentBuild,
                    latestVersion: release.tag_name,
                    releaseUrl: release.html_url
                }));
            }
        }
        
        const result = await this.showConfirmDialog(
            '🔄 VRCX Plugin System Update Available',
            message,
            'View Release',
            'Dismiss'
        );
        
        if (result) {
            // Start the download
            await this.downloadCoreUpdate();
        } else {
            // User dismissed - add to dismissed list
            const dismissed = JSON.parse(this.settings.store.dismissedCoreVersions || '[]');
            if (!dismissed.includes(release.tag_name)) {
                dismissed.push(release.tag_name);
                this.settings.store.dismissedCoreVersions = JSON.stringify(dismissed);
            }
        }
    }

    private async checkPluginUpdates(manual: boolean): Promise<void> {
        if (this.isCheckingPlugins) {
            if (manual) {
                this.logger.showInfo('Plugin update check already in progress');
            }
            return;
        }
        
        this.isCheckingPlugins = true;
        
        try {
            if (manual) {
                this.logger.showInfo('Checking for plugin updates...');
            }
            
            const repos = (window as any).customjs?.repos || [];
            const enabledRepos = repos.filter((r: any) => r.enabled);
            
            if (enabledRepos.length === 0) {
                if (manual) {
                    this.logger.showWarning('No enabled plugin repositories found');
                }
                return;
            }
            
            const allPluginUpdates: PluginUpdateInfo[] = [];
            const newPlugins: any[] = [];
            const seenPlugins = new Set(JSON.parse(this.settings.store.seenPlugins || '[]'));
            
            for (const repo of enabledRepos) {
                try {
                    // Re-fetch repository data
                    await repo.fetch();
                    
                    const repoPlugins = repo.data?.modules || [];
                    
                    for (const plugin of repoPlugins) {
                        const pluginId = plugin.id || plugin.name;
                        
                        // Check if this is a new plugin
                        if (!seenPlugins.has(pluginId)) {
                            newPlugins.push({
                                ...plugin,
                                repoName: repo.metadata?.name || 'Unknown Repo'
                            });
                            seenPlugins.add(pluginId);
                        }
                        
                        // Check if plugin needs update
                        const loadedModule = (window as any).customjs?.modules?.find(
                            (m: any) => m.metadata?.id === pluginId || m.metadata?.name === plugin.name
                        );
                        
                        if (loadedModule) {
                            const needsUpdate = this.compareVersions(
                                loadedModule.metadata?.version,
                                plugin.version
                            ) < 0;
                            
                            if (needsUpdate) {
                                allPluginUpdates.push({
                                    id: pluginId,
                                    name: plugin.name,
                                    currentVersion: loadedModule.metadata?.version,
                                    latestVersion: plugin.version,
                                    needsUpdate: true,
                                    url: plugin.url,
                                    repoUrl: repo.url
                                });
                            }
                        }
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`Failed to check repository ${repo.url}: ${errorMsg}`);
                }
            }
            
            // Update seen plugins
            this.settings.store.seenPlugins = JSON.stringify(Array.from(seenPlugins));
            this.lastPluginCheck = Date.now();
            
            // Handle updates
            if (allPluginUpdates.length > 0) {
                await this.handlePluginUpdates(allPluginUpdates, manual);
            } else if (manual) {
                this.logger.showSuccess('All plugins are up to date');
            }
            
            // Handle new plugins
            if (newPlugins.length > 0 && this.settings.store.showNewPlugins) {
                await this.showNewPluginsModal(newPlugins);
            }
            
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to check for plugin updates:', errorMsg);
            if (manual) {
                this.logger.showError('Failed to check for plugin updates: ' + errorMsg);
            }
        } finally {
            this.isCheckingPlugins = false;
        }
    }

    private async applyPluginUpdates(updates: PluginUpdateInfo[]): Promise<void> {
        this.logger.showInfo(`Updating ${updates.length} plugin(s)...`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const update of updates) {
            try {
                const reloadModule = (window as any).customjs?.reloadModule;
                if (reloadModule) {
                    await reloadModule(update.id);
                    successCount++;
                    this.logger.log(`Updated plugin: ${update.name}`);
                } else {
                    throw new Error('Reload function not available');
                }
            } catch (error) {
                failCount++;
                const errorMsg = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to update ${update.name}: ${errorMsg}`);
            }
        }
        
        if (successCount > 0) {
            this.logger.showSuccess(`Successfully updated ${successCount} plugin(s)`);
        }
        if (failCount > 0) {
            this.logger.showError(`Failed to update ${failCount} plugin(s)`);
        }
    }

    private async showNewPluginsModal(newPlugins: any[]): Promise<void> {
        const dialogApi = (window as any).customjs?.getModule('dialog-api');
        if (!dialogApi) return;
        
        const pluginList = newPlugins.map(p => 
            `• ${p.name} (${p.version || 'unknown'})\n  From: ${p.repoName}\n  ${p.description || 'No description'}`
        ).join('\n\n');
        
        await this.showAlertDialog(
            '✨ New Plugins Discovered',
            `${newPlugins.length} new plugin(s) have been found in your repositories:\n\n${pluginList}\n\nYou can enable them from the Plugin Manager.`,
            'OK'
        );
    }

    private showRateLimitStatus(): void {
        if (!this.rateLimit) {
            this.logger.showInfo('No GitHub API requests made yet');
            return;
        }
        
        const resetTime = new Date(this.rateLimit.reset * 1000);
        const timeUntilReset = Math.max(0, this.rateLimit.reset * 1000 - Date.now());
        const minutesUntilReset = Math.floor(timeUntilReset / 60000);
        
        const hasToken = !!this.settings.store.githubToken;
        const message = `GitHub API Rate: ${this.rateLimit.used}/${this.rateLimit.limit} used, ${this.rateLimit.remaining} left | Resets in ${minutesUntilReset} min (${resetTime.toLocaleTimeString()}) | ${hasToken ? "✓ Using token" : "⚠ No token (60/h)"}`;
        
        this.logger.showInfo(message);
    }

    private compareVersions(v1?: string, v2?: string): number {
        if (!v1 && !v2) return 0;
        if (!v1) return -1;
        if (!v2) return 1;
        
        const parts1 = v1.split('.').map(n => parseInt(n) || 0);
        const parts2 = v2.split('.').map(n => parseInt(n) || 0);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 !== p2) return p1 - p2;
        }
        
        return 0;
    }

    private async downloadCoreUpdate(): Promise<void> {
        try {
            this.logger.showInfo('Starting core system download...');
            
            // Step 1: Copy target path to clipboard FIRST
            const utils = (window as any).customjs?.utils;
            const targetPath = this.TARGET_PATH;
            
            if (utils?.copyToClipboard) {
                await utils.copyToClipboard(targetPath, 'Install path');
            } else if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(targetPath);
            }
            
            // Step 2: Show instructions
            await this.showAlertDialog(
                '📥 Downloading Update',
                `The download will start in a moment.\n\n✅ Install path copied to clipboard:\n${targetPath}\n\n📝 When the browser's "Save As" dialog appears:\n1. Paste (Ctrl+V) into the "File name:" field\n2. Click "Save" to overwrite the existing file\n\nThe browser will handle the download.`,
                'Start Download'
            );
            
            // Step 3: Trigger download using utility
            if (utils?.downloadFile) {
                const result = await utils.downloadFile(this.downloadUrl, 'custom.js', 'application/javascript');
                
                if (result.success) {
                    this.logger.log(`Download initiated via ${result.method}`);
                    
                    // Step 4: Ask to reload after download
                    await this.promptForReload();
                } else {
                    throw new Error(result.error || 'Download failed');
                }
            } else {
                // Fallback: manual download link
                await this.showAlertDialog(
                    '⚠️ Download Utility Not Available',
                    `Please download manually from:\n\n${this.downloadUrl}\n\nAnd save to:\n${targetPath}`,
                    'OK'
                );
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to download core update: ${errorMsg}`);
            this.logger.showError('Download failed. Please try manually.');
            
            // Show download URL for manual download
            await this.showAlertDialog(
                '⚠️ Download Failed',
                `Automatic download failed.\n\nPlease download manually from:\n${this.downloadUrl}\n\nAnd save to:\n${this.TARGET_PATH}`,
                'OK'
            );
        }
    }

    private async getLatestRelease(): Promise<GitHubRelease | null> {
        try {
            const url = `${this.GITHUB_API}/repos/${this.coreRepoOwner}/${this.coreRepoName}/releases/latest`;
            const response = await this.fetchWithRateLimit(url);
            
            if (!response.ok) {
                return null;
            }
            
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    private async promptForReload(): Promise<void> {
        // Wait a bit for download to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const shouldReload = await this.showConfirmDialog(
            '🔄 Reload VRCX?',
            'The update has been downloaded.\n\nHave you saved it to the correct location?\n\nReload VRCX now to apply the update?',
            'Reload Now',
            'Later'
        );
        
        if (shouldReload) {
            this.logger.showInfo('Reloading VRCX to apply core system update...');
            window.location.reload();
        } else {
            this.logger.showInfo('Reload later to apply the update');
        }
    }

    private sendVrNotification(title: string, message: string): void {
        const AppApi = (window as any).AppApi;
        if (!AppApi) return;
        
        const timeout = (this.settings.store.vrNotificationTimeout || 10) * 1000;
        
        // Try XSOverlay
        try {
            if (AppApi.XSNotification) {
                AppApi.XSNotification(title, message, timeout, 1.0, '');
            }
        } catch (error) {
            this.logger.warn('Failed to send XSOverlay notification');
        }
        
        // Try OVRToolkit
        try {
            if (AppApi.OVRTNotification) {
                AppApi.OVRTNotification(true, true, title, message, timeout, 1.0, '');
            }
        } catch (error) {
            this.logger.warn('Failed to send OVRToolkit notification');
        }
    }

    private async handlePluginUpdates(updates: PluginUpdateInfo[], manual: boolean): Promise<void> {
        const dialogApi = (window as any).customjs?.getModule('dialog-api');
        
        if (!dialogApi) {
            this.logger.showWarning(`${updates.length} plugin update(s) available, but dialog-api not found`);
            return;
        }
        
        const updateList = updates.map(u => 
            `• ${u.name}: ${u.currentVersion || '?'} → ${u.latestVersion || '?'}`
        ).join('\n');
        
        this.logger.showInfo(`Found ${updates.length} plugin update(s)`);
        
        // Desktop notification for plugin updates
        if (this.settings.store.enableDesktopNotifications && (window as any).AppApi?.DesktopNotification) {
            (window as any).AppApi.DesktopNotification(
                '🔌 Plugin Updates Available',
                `${updates.length} plugin(s) can be updated`,
                ''
            );
        }
        
        // VR notification
        if (this.settings.store.enableVrNotifications) {
            this.sendVrNotification(
                '🔌 Plugin Updates',
                `${updates.length} update(s) available`
            );
        }
        
        // IPC announcement
        if (this.settings.store.announceViaIpc && (window as any).AppApi?.SendIpc) {
            (window as any).AppApi.SendIpc('PluginUpdates', JSON.stringify({
                count: updates.length,
                plugins: updates.map(u => ({
                    id: u.id,
                    name: u.name,
                    currentVersion: u.currentVersion,
                    latestVersion: u.latestVersion
                }))
            }));
        }
        
        if (this.settings.store.autoUpdatePlugins && !manual) {
            // Auto-update without confirmation
            await this.applyPluginUpdates(updates);
        } else {
            // Ask for confirmation
            const result = await this.showConfirmDialog(
                '🔄 Plugin Updates Available',
                `The following plugins have updates available:\n\n${updateList}\n\nWould you like to update them now?`,
                'Update All',
                'Skip'
            );
            
            if (result) {
                await this.applyPluginUpdates(updates);
            }
        }
    }
}

(window as any).customjs.__LAST_PLUGIN_CLASS__ = UpdateCheckerPlugin;
