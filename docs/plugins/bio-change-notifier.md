# Bio Change Notifier 🔔

Monitors and notifies you when friends or other users change their VRChat bio.

## Overview

| Property         | Value                            |
| ---------------- | -------------------------------- |
| **ID**           | `bio-change-notifier`            |
| **Category**     | Social Feature                   |
| **Tags**         | Social, Notification, Monitoring |
| **Dependencies** | None                             |
| **Author**       | Bluscream                        |

## Features

- ✅ Real-time bio change detection
- ✅ Desktop notifications
- ✅ Diff display (old vs new)
- ✅ Friends-only filtering
- ✅ Minimum change length filtering
- ✅ Persistent bio tracking
- ✅ Emoji support in notifications
- ✅ Click notification to show full details

## Settings

### Notifications

| Setting         | Type    | Default | Description                     |
| --------------- | ------- | ------- | ------------------------------- |
| `enabled`       | Boolean | `true`  | Enable bio change notifications |
| `showInConsole` | Boolean | `true`  | Log bio changes to console      |
| `playSound`     | Boolean | `false` | Play sound on bio change        |

### Filters

| Setting             | Type    | Default | Description                          |
| ------------------- | ------- | ------- | ------------------------------------ |
| `notifyFriendsOnly` | Boolean | `true`  | Only notify for friends              |
| `minChangeLength`   | Number  | `5`     | Minimum characters changed to notify |

### Display

| Setting          | Type    | Default | Description                         |
| ---------------- | ------- | ------- | ----------------------------------- |
| `showDiff`       | Boolean | `true`  | Show old vs new bio in notification |
| `truncateLength` | Number  | `100`   | Max characters to show in preview   |

## Usage

### View Tracked Bios

```javascript
const notifier = window.customjs.getModule("bio-change-notifier");

// Map of userId → last known bio
console.log(notifier.bioCache);
```

### Clear Bio Cache

```javascript
const notifier = window.customjs.getModule("bio-change-notifier");
notifier.bioCache.clear();
```

## How It Works

### Bio Tracking

1. **Initialization**: Loads tracked bios from `localStorage`
2. **Monitoring**: Watches for user data updates in Pinia
3. **Comparison**: Compares new bio with cached bio
4. **Filtering**: Applies friends-only and minimum length filters
5. **Notification**: Shows desktop notification with diff
6. **Cache Update**: Stores new bio in cache and localStorage

### Detection Hook

Monitors Pinia user store updates:

```javascript
window.$pinia?.user?.users;
```

### Diff Calculation

- Compares old and new bio character by character
- Applies minimum change length threshold
- Formats output as "old bio" → "new bio"

## Notification Format

```
🔔 Bio Changed: UserName

Old: Previous bio text here...
New: Updated bio text here...
```

If `truncateLength` is set, both old and new are truncated with `...`

## Implementation Details

### Change Detection

```javascript
if (oldBio && newBio && oldBio !== newBio) {
  const changed = Math.abs(newBio.length - oldBio.length);

  if (changed >= minChangeLength) {
    showNotification(user, oldBio, newBio);
  }
}
```

### Friend Filtering

```javascript
const friends = window.$pinia?.favorite?.favoriteFriends;
const isFriend = Array.from(friends.values()).some((f) => f.id === userId);
```

### Persistence

- Cached bios stored in `localStorage`
- Key: `bio-change-notifier:bioCache`
- Format: `{userId: bio, ...}`

## Best Practices

1. **Enable friends-only** - Reduces noise from random users
2. **Set appropriate threshold** - `minChangeLength` prevents minor edit spam
3. **Use truncation** - Keeps notifications readable
4. **Clear cache occasionally** - Prevents storage bloat
5. **Disable if overwhelming** - Lots of friends = lots of notifications

## Notification Behavior

- **Click notification**: Shows full bio in dialog (future enhancement)
- **Auto-dismiss**: Based on system notification settings
- **Sound**: Optional, disabled by default

## Troubleshooting

| Issue                         | Solution                                               |
| ----------------------------- | ------------------------------------------------------ |
| No notifications              | Check `enabled` setting, verify permissions            |
| Too many notifications        | Enable `notifyFriendsOnly`, increase `minChangeLength` |
| Old bios not accurate         | Clear cache to reset tracking                          |
| Notifications for non-friends | Disable `notifyFriendsOnly` setting                    |

## See Also

- [Bio Updater](bio-updater.md) - Manages your own bio
- [Bio Symbols Patch](bio-symbols-patch.md) - Handles emoji/symbol rendering
