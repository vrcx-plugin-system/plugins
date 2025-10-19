/**
 * Update Checker 🔄
 * Checks for updates to the core system and plugins, with automatic hot-reload support
 */

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

export default class UpdateCheckerPlugin {
    metadata: any;
    settings: any;
    actionButtons: any[];
    logger: any;
    enabled: boolean = true;
    started: boolean = false;

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

    constructor() {
        this.metadata = {
            name: 'Update Checker 🔄',
            version: '1.0.0',
            author: 'Bluscream',
            description: 'Automatically checks for updates to VRCX core system and plugins with hot-reload support',
            required_dependencies: ['dialog-api', 'logger']
        };

        this.logger = (window as any).customjs?.logger;

        this.settings = (window as any).customjs?.definePluginSettings({
            // Core update checking
            checkCoreOnStartup: {
                type: 'boolean' as const,
                default: true,
                label: 'Check for Core Updates on Startup',
                description: 'Automatically check for VRCX core system updates when the application starts'
            },
            coreCheckInterval: {
                type: 'timespan' as const,
                default: 3600000, // 1 hour
                min: 300000, // 5 minutes
                label: 'Core Update Check Interval',
                description: 'How often to check for core system updates (minimum 5 minutes)'
            },
            showCoreNotification: {
                type: 'boolean' as const,
                default: true,
                label: 'Show Core Update Notifications',
                description: 'Display a notification when a new core version is available'
            },
            openReleasePageOnUpdate: {
                type: 'boolean' as const,
                default: false,
                label: 'Auto-Open Release Page',
                description: 'Automatically open the GitHub release page when an update is found'
            },

            // Plugin update checking
            checkPluginsOnStartup: {
                type: 'boolean' as const,
                default: true,
                label: 'Check for Plugin Updates on Startup',
                description: 'Automatically check for plugin updates when the application starts'
            },
            pluginCheckInterval: {
                type: 'timespan' as const,
                default: 7200000, // 2 hours
                min: 300000, // 5 minutes
                label: 'Plugin Update Check Interval',
                description: 'How often to check for plugin updates (minimum 5 minutes)'
            },
            autoUpdatePlugins: {
                type: 'boolean' as const,
                default: false,
                label: 'Auto-Update Plugins',
                description: 'Automatically hot-reload updated plugins without confirmation'
            },
            showNewPlugins: {
                type: 'boolean' as const,
                default: true,
                label: 'Show New Plugin Discoveries',
                description: 'Display a modal when new plugins are discovered in repositories'
            },

            // GitHub API settings
            githubToken: {
                type: 'string' as const,
                default: '',
                label: 'GitHub Personal Access Token',
                description: 'Optional: Increases API rate limit from 60 to 5000 requests/hour'
            },
            showRateLimitWarnings: {
                type: 'boolean' as const,
                default: true,
                label: 'Show Rate Limit Warnings',
                description: 'Display warnings when approaching GitHub API rate limits'
            },

            // Hidden settings for tracking
            seenPlugins: {
                type: 'array' as const,
                default: [],
                hidden: true
            },
            lastCoreVersion: {
                type: 'string' as const,
                default: '',
                hidden: true
            },
            dismissedCoreVersions: {
                type: 'array' as const,
                default: [],
                hidden: true
            }
        }, this.metadata.name);

        this.actionButtons = [
            {
                title: 'Check Core Updates',
                description: 'Manually check for VRCX core system updates',
                callback: async () => {
                    await this.checkCoreUpdate(true);
                }
            },
            {
                title: 'Check Plugin Updates',
                description: 'Manually check for plugin updates',
                callback: async () => {
                    await this.checkPluginUpdates(true);
                }
            },
            {
                title: 'Show Rate Limit Status',
                description: 'Display current GitHub API rate limit status',
                callback: () => {
                    this.showRateLimitStatus();
                }
            },
            {
                title: 'Reset Dismissed Updates',
                description: 'Clear the list of dismissed update notifications',
                callback: () => {
                    this.settings.store.dismissedCoreVersions = [];
                    this.logger.showSuccess('Dismissed updates cleared');
                }
            }
        ];
    }

    getDisplayName(): string {
        return this.metadata.name;
    }

    async load(): Promise<void> {
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

    private parseRepositoryInfo(): void {
        try {
            const sourceUrl = (window as any).customjs?.sourceUrl || '';
            if (!sourceUrl) {
                this.logger.warn('No sourceUrl found in window.customjs');
                return;
            }
            
            // Parse GitHub URL: https://github.com/{owner}/{repo}/...
            const match = sourceUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (match) {
                this.coreRepoOwner = match[1];
                this.coreRepoName = match[2];
                this.logger.log(`Parsed repository: ${this.coreRepoOwner}/${this.coreRepoName}`);
            } else {
                this.logger.warn('Failed to parse repository info from sourceUrl');
            }
        } catch (error) {
            this.logger.error('Error parsing repository info:', error);
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
            const isDismissed = this.settings.store.dismissedCoreVersions.includes(latestVersion);
            const isNewer = latestBuild > currentBuild;
            
            if (isNewer && !isDismissed) {
                this.settings.store.lastCoreVersion = latestVersion;
                await this.showCoreUpdateNotification(release, manual);
            } else if (manual) {
                if (isDismissed) {
                    this.logger.showInfo(`Update ${latestVersion} was previously dismissed. Current: ${currentBuild}`);
                } else {
                    this.logger.showSuccess(`VRCX is up to date (build ${currentBuild})`);
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
        const message = `A new version of VRCX is available!\n\nCurrent: ${currentBuild}\nLatest: ${release.tag_name}\n\nReleased: ${new Date(release.published_at).toLocaleString()}`;
        
        if (this.settings.store.showCoreNotification || manual) {
            this.logger.showInfo('New VRCX update available: ' + release.tag_name);
        }
        
        const dialogApi = (window as any).customjs?.getModule('dialog-api');
        if (dialogApi) {
            const result = await (dialogApi as any).showConfirm({
                title: '🔄 VRCX Update Available',
                message: message,
                confirmText: 'View Release',
                cancelText: 'Dismiss',
                width: 500
            });
            
            if (result) {
                if (this.settings.store.openReleasePageOnUpdate || manual) {
                    window.open(release.html_url, '_blank');
                }
            } else {
                // User dismissed - add to dismissed list
                const dismissed = this.settings.store.dismissedCoreVersions;
                if (!dismissed.includes(release.tag_name)) {
                    dismissed.push(release.tag_name);
                    this.settings.store.dismissedCoreVersions = dismissed;
                }
            }
        } else if (this.settings.store.openReleasePageOnUpdate) {
            window.open(release.html_url, '_blank');
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
            const seenPlugins = new Set(this.settings.store.seenPlugins);
            
            for (const repo of enabledRepos) {
                try {
                    // Re-fetch repository data
                    await repo.load();
                    
                    const repoPlugins = repo.data?.plugins || [];
                    
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
                    this.logger.error(`Failed to check repository ${repo.url}:`, error);
                }
            }
            
            // Update seen plugins
            this.settings.store.seenPlugins = Array.from(seenPlugins);
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
        
        if (this.settings.store.autoUpdatePlugins && !manual) {
            // Auto-update without confirmation
            await this.applyPluginUpdates(updates);
        } else {
            // Ask for confirmation
            const result = await (dialogApi as any).showConfirm({
                title: '🔄 Plugin Updates Available',
                message: `The following plugins have updates available:\n\n${updateList}\n\nWould you like to update them now?`,
                confirmText: 'Update All',
                cancelText: 'Skip',
                width: 500
            });
            
            if (result) {
                await this.applyPluginUpdates(updates);
            }
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
                this.logger.error(`Failed to update ${update.name}:`, error);
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
        
        await (dialogApi as any).showAlert({
            title: '✨ New Plugins Discovered',
            message: `${newPlugins.length} new plugin(s) have been found in your repositories:\n\n${pluginList}\n\nYou can enable them from the Plugin Manager.`,
            confirmText: 'OK',
            width: 600
        });
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
        const message = [
            `GitHub API Rate Limit Status`,
            ``,
            `Used: ${this.rateLimit.used}/${this.rateLimit.limit}`,
            `Remaining: ${this.rateLimit.remaining}`,
            `Resets in: ${minutesUntilReset} minutes`,
            `Reset time: ${resetTime.toLocaleTimeString()}`,
            ``,
            hasToken ? `✓ Using personal access token` : `⚠ No token configured (60 req/hour limit)`
        ].join('\n');
        
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
}
