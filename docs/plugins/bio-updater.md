# Bio Updater 📝

Automatically updates your VRChat bio with dynamic information using customizable templates.

## Overview

| Property         | Value                                        |
| ---------------- | -------------------------------------------- |
| **ID**           | `bio-updater`                                |
| **Category**     | Social Feature                               |
| **Tags**         | Social, Bio, Automation, Personalization     |
| **Dependencies** | None (integrates with Tag Manager if loaded) |
| **Author**       | Bluscream                                    |

## Features

- ✅ Auto-update bio at intervals
- ✅ Template system with 20+ variables
- ✅ Steam playtime integration
- ✅ Friend group tracking
- ✅ Tag statistics integration
- ✅ Auto-invite list integration
- ✅ Moderation counts
- ✅ Preserve custom bio prefix
- ✅ Auto-truncation to 512 character limit
- ✅ Manual update trigger

## Action Buttons

| Button        | Description                |
| ------------- | -------------------------- |
| **Update Bio**| Manually trigger bio update|

## Settings

| Setting        | Type     | Default  | Description                          |
| -------------- | -------- | -------- | ------------------------------------ |
| `updateInterval`| Timespan | 2 hours | How often to update bio              |
| `template`     | String   | See below| Bio template with variables          |
| `steamId`      | String   | ``       | Steam ID (base64 or plain)           |
| `apiKey`       | String   | ``       | Steam Web API key (base64 or plain)  |
| `appId`        | String   | `438100` | Steam App ID (VRChat)                |
| `bioSeparator` | String   | `---`    | Separator between custom and auto bio|

## Template Variables

### User Information

| Variable     | Replaced With                |
| ------------ | ---------------------------- |
| `{user_id}`  | Your VRChat user ID          |
| `{steam_id}` | Your Steam ID                |
| `{oculus_id}`| Your Oculus ID               |
| `{pico_id}`  | Your Pico ID                 |
| `{vive_id}`  | Your Vive ID                 |
| `{rank}`     | Your trust level             |

### Time & Activity

| Variable          | Replaced With                    |
| ----------------- | -------------------------------- |
| `{last_activity}` | Time since last activity         |
| `{playtime}`      | VRChat playtime                  |
| `{date_joined}`   | Account creation date            |
| `{now}`           | Current date/time                |

### Social Stats

| Variable          | Replaced With                    |
| ----------------- | -------------------------------- |
| `{friends}`       | Friend count                     |
| `{blocked}`       | Blocked user count               |
| `{muted}`         | Muted user count                 |
| `{tags_loaded}`   | Tag count (Tag Manager)          |
| `{tagged_users}`  | Tagged user count (Tag Manager)  |

### Friend Groups

| Variable    | Replaced With                      |
| ----------- | ---------------------------------- |
| `{group1}`  | Group 1 friends (comma-separated)  |
| `{group2}`  | Group 2 friends (comma-separated)  |
| `{group3}`  | Group 3 friends (comma-separated)  |
| `{autojoin}`| Same as group2 (legacy)            |

### Auto-Invite Integration

| Variable             | Replaced With                     |
| -------------------- | --------------------------------- |
| `{autoinvite}`       | Auto-invite users (comma-separated)|
| `{autoinviteprefix}` | "Auto Invite: " if list not empty |

## Default Template

```
Last Active: {last_activity}
Playtime: {playtime}
Friends: {friends} | Blocked: {blocked} | Muted: {muted}
Joined: {date_joined}
```

## Usage

### Configure Bio Template

1. Open Bio Updater settings
2. Edit `template` field with desired variables
3. Save settings
4. Bio updates automatically

### Manual Update

```javascript
const bioUpdater = window.customjs.getModule('bio-updater');
await bioUpdater.triggerUpdate();
```

### Steam Playtime Setup

1. Get your Steam ID (decimal format)
2. Get Steam Web API key from https://steamcommunity.com/dev/apikey
3. Optionally base64 encode both for privacy
4. Enter in Bio Updater settings

## How It Works

### Bio Structure

```
[Custom Prefix]
---
[Auto-Generated Template Content]
```

- Everything before `---` is preserved
- Everything after is replaced with template
- If no separator, entire bio is replaced

### Update Triggers

| Trigger      | When                                  |
| ------------ | ------------------------------------- |
| Login        | 20 seconds after login                |
| Interval     | Every `updateInterval` (default 2h)   |
| Manual       | Via action button or console          |

### Template Processing

1. Fetches data from various sources (Pinia, Tag Manager, Auto-Invite)
2. Replaces each variable with current value
3. Formats timestamps and durations
4. Truncates to 512 characters if needed
5. Submits via `window.utils.saveBio()`

### Steam Playtime

If configured, fetches from:
```
GET https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/
?key={apiKey}&steamid={steamId}&format=json&include_played_free_games=1
```

Returns total playtime in minutes, displayed as `XXXXh` in bio.

## Time Format Examples

| Duration    | Displayed As |
| ----------- | ------------ |
| 45 seconds  | `45s`        |
| 5 minutes   | `5m 0s`      |
| 2 hours     | `2h 30m`     |
| 3 days      | `3d 12h`     |

## Best Practices

1. **Keep it concise** - Remember 512 character limit
2. **Use separators** - Preserve custom bio prefix
3. **Test template** - Trigger manual update after changes
4. **Monitor length** - Check logs for truncation warnings
5. **Update intervals** - Balance freshness vs API calls
6. **Protect keys** - Use base64 encoding for Steam credentials

## Template Examples

### Minimal

```
{playtime} | {friends} friends
Last active: {last_activity}
```

### Detailed

```
🎮 Playtime: {playtime} ({date_joined})
👥 Friends: {friends} | Blocked: {blocked}
🏷️ Tags: {tags_loaded} ({tagged_users} users)
📅 {now}
```

### With Friend Groups

```
⭐ VIP: {group1}
🎯 Auto-Join: {group2}
{autoinviteprefix}{autoinvite}
```

## Troubleshooting

| Issue                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| Bio not updating       | Check update interval, verify login       |
| Variables not replaced | Check spelling, verify data sources loaded|
| Truncated bio          | Reduce template length                    |
| Steam playtime wrong   | Verify Steam ID and API key               |
| No friend groups       | Friends must be in VRChat groups          |

## Integration Points

### Tag Manager

- Uses `findTaggedUsers()` for `{tagged_users}`
- Uses `getLoadedTagsCount()` for `{tags_loaded}`

### Auto-Invite

- Uses `getAutoInviteUsersList()` for `{autoinvite}`
- Formats as comma-separated display names

### Pinia Stores

- `$pinia.user.currentUser` - User info
- `$pinia.favorite.favoriteFriends` - Friend groups
- `$pinia.moderation.cachedPlayerModerations` - Block/mute counts

## See Also

- [Tag Manager](tag-manager.md) - Provides tag statistics
- [Auto Invite](auto-invite.md) - Provides auto-invite list
- [Bio Change Notifier](bio-change-notifier.md) - Monitors bio changes of others

