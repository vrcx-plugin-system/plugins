# Tag Manager 🏷️

Manages and applies custom user tags from remote JSON sources with automatic updates.

## Overview

| Property         | Value                    |
| ---------------- | ------------------------ |
| **ID**           | `tag-manager`            |
| **Category**     | Social Feature           |
| **Tags**         | Social, Tags, Management |
| **Dependencies** | None                     |
| **Author**       | Bluscream                |

## Features

- ✅ Load tags from multiple remote URLs
- ✅ Apply tags to friends, blocked users, interact-off users
- ✅ Periodic automatic updates
- ✅ Manual refresh on demand
- ✅ Tag statistics and summaries
- ✅ Multiple tag source support
- ✅ CSV and JSON format support
- ✅ VRChat game log integration
- ✅ Notification log integration
- ✅ Copy tag lists to clipboard

## Action Buttons

| Button                | Description                        |
| --------------------- | ---------------------------------- |
| **Refresh Tags**      | Manually reload all tag sources    |
| **Show Tag Summary**  | Display statistics in console      |
| **Copy Tagged Users** | Copy all tagged users to clipboard |

## Settings

| Setting          | Type     | Default | Description                   |
| ---------------- | -------- | ------- | ----------------------------- |
| `tagSources`     | String   | `[]`    | JSON array of tag source URLs |
| `updateInterval` | Timespan | 1 hour  | How often to refresh tags     |
| `logToConsole`   | Boolean  | `true`  | Log tag operations to console |

## Tag Source Format

### JSON Format

```json
{
  "UserId": "usr_xxx-xxx-xxx",
  "DisplayName": "Username",
  "Tags": "Tag1,Tag2,Tag3"
}
```

### CSV Format

```csv
UserId,DisplayName,Tags
usr_xxx-xxx-xxx,Username,"Tag1,Tag2,Tag3"
```

## Usage

### Add Tag Source

1. Open Tag Manager settings
2. Add URL to `tagSources` array:

```json
["https://example.com/tags.json"]
```

3. Save settings
4. Tags load automatically

### View Tagged Users

```javascript
const tagManager = window.customjs.getModule("tag-manager");

// Get all tagged users
const tagged = await tagManager.findTaggedUsers(false);

console.log(tagged.friends); // Tagged friends
console.log(tagged.blocked); // Tagged blocked users
console.log(tagged.interactOff); // Tagged interact-off users
```

### Get Tag Count

```javascript
const tagManager = window.customjs.getModule("tag-manager");

const count = tagManager.getLoadedTagsCount();
console.log(`Loaded ${count} tags`);
```

### Manual Tag Refresh

```javascript
const tagManager = window.customjs.getModule("tag-manager");
await tagManager.loadTags();
```

### Copy Tagged Users

Copies to clipboard in format:

```
friends: 18 | blocked: 8 | interactOff: 1
```

## Tag Application Categories

| Category      | Applied To                       |
| ------------- | -------------------------------- |
| `friends`     | Users in your friends list       |
| `blocked`     | Users in your blocked list       |
| `interactOff` | Users with interactions disabled |

## Implementation Details

### Tag Loading

1. Fetches each URL in `tagSources`
2. Parses JSON or CSV format automatically
3. Stores in memory map: `userId → tags`
4. Applies tags to VRCX's moderation cache
5. Logs summary statistics

### Tag Application

Tags are applied to:

```javascript
window.$pinia?.moderation?.cachedPlayerModerations;
```

Each user gets tags appended to their moderation entry.

### Automatic Updates

- On login: Loads tags after 5-second delay
- Periodic: Reloads tags at configured interval
- Manual: Via action button or console

### Game Log Integration

Checks VRChat game log for:

- Player join events
- Auto-applies tags to joined users
- Updates in real-time

## Best Practices

1. **Use reliable sources** - Host tag files on GitHub or stable servers
2. **Keep tags concise** - Short tags are more readable
3. **Update regularly** - Use automatic update interval
4. **Monitor statistics** - Check tag summary periodically
5. **Categorize appropriately** - Use friends/blocked/interactOff correctly

## Tag Source Examples

### GitHub Hosted

```json
{
  "tagSources": ["https://github.com/username/tags/raw/main/usertags.json"]
}
```

### Multiple Sources

```json
{
  "tagSources": [
    "https://source1.com/tags.json",
    "https://source2.com/moretags.csv"
  ]
}
```

## Troubleshooting

| Issue             | Solution                                    |
| ----------------- | ------------------------------------------- |
| Tags not loading  | Check URL accessibility, verify JSON format |
| Tags not applying | Check Pinia moderation cache availability   |
| Old tags persist  | Clear browser cache, reload tags            |
| Statistics wrong  | Refresh tags manually                       |

## See Also

- [Bio Updater](bio-updater.md) - Uses tag statistics in bio
- [Yoinker Detector](yoinker-detector.md) - Can auto-tag detected users
