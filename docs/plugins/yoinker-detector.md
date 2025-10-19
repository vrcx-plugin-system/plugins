# Yoinker Detector 🚨

Detects and tracks users who "yoink" (rip/copy) avatars using external API services.

## Overview

| Property         | Value                               |
| ---------------- | ----------------------------------- |
| **ID**           | `yoinker-detector`                  |
| **Category**     | Social Feature                      |
| **Tags**         | Social, Detection, Avatar, Security |
| **Dependencies** | None                                |
| **Author**       | Bluscream                           |

## Features

- ✅ Automatic yoinker detection via API
- ✅ Real-time player join monitoring
- ✅ User dialog detection
- ✅ Notification system
- ✅ Auto-tagging integration
- ✅ Processed user caching
- ✅ Queue system with rate limiting
- ✅ Statistics tracking
- ✅ Configurable detection endpoint

## Action Buttons

| Button          | Description                                |
| --------------- | ------------------------------------------ |
| **Clear Cache** | Remove all processed users and reset stats |

## Settings

### Detection

| Setting             | Type    | Default                    | Description                          |
| ------------------- | ------- | -------------------------- | ------------------------------------ |
| `endpoint`          | String  | `https://yd.just-h.party/` | Yoinker detection API endpoint       |
| `logToConsole`      | Boolean | `true`                     | Log detection events                 |
| `checkOnJoin`       | Boolean | `true`                     | Check users when they join instances |
| `checkOnUserDialog` | Boolean | `true`                     | Check when opening user dialogs      |

### Notifications

| Setting               | Type    | Default | Description                          |
| --------------------- | ------- | ------- | ------------------------------------ |
| `showNotifications`   | Boolean | `true`  | Show desktop notifications           |
| `notifyOnConfidence`  | Boolean | `true`  | Notify based on confidence threshold |
| `confidenceThreshold` | Number  | `0.7`   | Minimum confidence for notifications |

### Auto-Tagging

| Setting   | Type    | Default              | Description                    |
| --------- | ------- | -------------------- | ------------------------------ |
| `autoTag` | Boolean | `false`              | Auto-tag detected yoinkers     |
| `tagName` | String  | `Yoinker (Detected)` | Tag to apply to detected users |

### Advanced

| Setting             | Type     | Default    | Description                         |
| ------------------- | -------- | ---------- | ----------------------------------- |
| `cacheExpiry`       | Timespan | 24 hours   | How long to cache detection results |
| `queueProcessDelay` | Timespan | 1 second   | Delay between queue processing      |
| `rateLimitDelay`    | Timespan | 30 seconds | Delay after rate limit hit          |

## Usage

### Check User Manually

```javascript
const detector = window.customjs.getModule("yoinker-detector");

const result = await detector.checkUser("usr_xxx-xxx-xxx");

if (result.isYoinker) {
  console.log(`Confidence: ${result.confidence}%`);
  console.log(`Avatars ripped: ${result.count}`);
}
```

### View Statistics

```javascript
const detector = window.customjs.getModule("yoinker-detector");

console.log("Checked:", detector.stats.checked);
console.log("Yoinkers found:", detector.stats.yoinkersFound);
console.log("API errors:", detector.stats.apiErrors);
```

### Clear Cache

```javascript
const detector = window.customjs.getModule("yoinker-detector");
detector.clearCache();
```

## How It Works

### Detection Flow

1. **Trigger**: User joins instance or you open their dialog
2. **Cache Check**: Looks in processed users cache first
3. **API Request**: If not cached, queries detection endpoint
4. **Response Processing**: Parses confidence level and avatar count
5. **Tagging**: Optionally applies tag if threshold met
6. **Notification**: Shows notification if enabled and confidence high enough
7. **Caching**: Stores result for cache duration

### API Request Format

```javascript
GET https://yd.just-h.party/check/{userId}

Response:
{
  "isYoinker": true,
  "confidence": 0.85,
  "count": 15,
  "lastSeen": "2024-10-19T12:00:00Z"
}
```

### Queue System

- **Purpose**: Prevents API spam
- **Processing**: One user at a time with delays
- **Rate Limiting**: Backs off on API errors
- **Priority**: Dialog checks prioritized over join checks

### Caching

- **Location**: `sessionStorage` (cleared on VRCX restart)
- **Key**: `yoinker-detector:processed`
- **Format**: `Map<userId, { result, timestamp }>`
- **Expiry**: Configurable, default 24 hours

## Notification Format

```
🚨 Yoinker Detected!

UserName (usr_xxx)
Confidence: 85%
Avatars: 15
```

## Auto-Tagging Integration

When `autoTag` is enabled and confidence ≥ threshold:

1. Adds tag to user's moderation entry in Pinia
2. Tag appears in VRCX UI immediately
3. Integrates with Tag Manager if loaded

## Best Practices

1. **Respect privacy** - Detection is not 100% accurate
2. **Use high thresholds** - Set confidence threshold ≥ 0.7
3. **Verify manually** - Check before taking action
4. **Don't harass** - Use info for personal awareness only
5. **Report false positives** - Help improve detection accuracy

## API Endpoints

### Default Endpoint

| Endpoint                   | Description               |
| -------------------------- | ------------------------- |
| `https://yd.just-h.party/` | Just-H's Yoinker Detector |

### Custom Endpoints

You can configure any compatible endpoint that returns:

```json
{
  "isYoinker": boolean,
  "confidence": number,
  "count": number
}
```

## Troubleshooting

| Issue                    | Solution                           |
| ------------------------ | ---------------------------------- |
| No detections happening  | Verify endpoint URL, check network |
| Too many false positives | Increase confidence threshold      |
| API rate limited         | Increase `rateLimitDelay` setting  |
| Notifications spamming   | Disable or increase threshold      |
| Cache growing large      | Reduce `cacheExpiry` duration      |

## See Also

- [Tag Manager](tag-manager.md) - Works with auto-tagging feature
- [Context Menu API](context-menu-api.md) - Could add menu items for manual checking
