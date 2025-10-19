# Avatar Logger 📸

Automatically detects avatar changes and submits them to multiple avatar database providers.

## Overview

| Property         | Value                             |
| ---------------- | --------------------------------- |
| **ID**           | `avatar-log`                      |
| **Category**     | Social Feature                    |
| **Tags**         | Social, Avatar, Logging, Database |
| **Dependencies** | None                              |
| **Author**       | Bluscream                         |

## Features

- ✅ Automatic avatar change detection
- ✅ Multi-provider submission (avtrDB, NSVR, PAW, VRCDB, VRCWB)
- ✅ Queue-based processing
- ✅ Duplicate detection
- ✅ Statistics per provider
- ✅ Batch processing
- ✅ Processed avatar tracking
- ✅ Discord attribution support
- ✅ Configurable providers

## Action Buttons

| Button          | Description                                  |
| --------------- | -------------------------------------------- |
| **Clear Cache** | Remove all processed avatars and reset stats |

## Supported Providers

| Provider | URL                    | Features                    |
| -------- | ---------------------- | --------------------------- |
| avtrDB   | avatars.just-h.party   | Main database, unique check |
| NSVR     | api.nsvr.solutions     | Fallback service            |
| PAW      | avtr.just-h.party      | Additional tracking         |
| VRCDB    | api.vrchat-legends.com | Community database          |
| VRCWB    | vrchat.photo           | Photo database              |

## Settings

### General

| Setting        | Type    | Default | Description                          |
| -------------- | ------- | ------- | ------------------------------------ |
| `attribution`  | String  | ``      | Your Discord User ID for attribution |
| `logToConsole` | Boolean | `true`  | Log submissions to console           |

### Avatar Database Providers

| Setting           | Type    | Default | Description      |
| ----------------- | ------- | ------- | ---------------- |
| `provider_avtrDB` | Boolean | `true`  | Submit to avtrDB |
| `provider_NSVR`   | Boolean | `true`  | Submit to NSVR   |
| `provider_PAW`    | Boolean | `true`  | Submit to PAW    |
| `provider_VRCDB`  | Boolean | `true`  | Submit to VRCDB  |
| `provider_VRCWB`  | Boolean | `true`  | Submit to VRCWB  |

### Performance & Processing

| Setting                 | Type     | Default   | Description                 |
| ----------------------- | -------- | --------- | --------------------------- |
| `batchSize`             | Number   | `5`       | Max concurrent API requests |
| `submitDelay`           | Timespan | 2 seconds | Delay between submissions   |
| `enableQueueProcessing` | Boolean  | `true`    | Enable queue system         |

## Usage

### View Statistics

```javascript
const avatarLog = window.customjs.getModule("avatar-log");

console.log("Total processed:", avatarLog.stats.totalProcessed);
console.log("Total submitted:", avatarLog.stats.totalSubmitted);
console.log("Duplicates:", avatarLog.stats.duplicates);

// Per-provider stats
console.log("avtrDB:", avatarLog.stats.byProvider.avtrDB);
```

### Get Processed Avatars

```javascript
const avatarLog = window.customjs.getModule("avatar-log");

// Set of avatar IDs
console.log(avatarLog.processedAvatars);
```

### Submit Avatar Manually

```javascript
const avatarLog = window.customjs.getModule("avatar-log");

await avatarLog.processAvatar({
  avatarId: "avtr_xxx-xxx-xxx",
  userId: "usr_xxx-xxx-xxx",
  userName: "UserName",
});
```

## How It Works

### Detection

Hooks into avatar change events:

```javascript
window.$pinia?.user?.setCurrentAvatar;
window.$pinia?.user?.updateRemoteAvatar;
```

### Processing Pipeline

1. **Event Trigger**: Avatar change detected
2. **Duplicate Check**: Skips if already processed
3. **Queue Add**: Adds to processing queue
4. **Batch Processing**: Processes up to `batchSize` at once
5. **Provider Submission**: Submits to enabled providers in parallel
6. **Result Tracking**: Records success/failure per provider
7. **Cache Update**: Marks avatar as processed

### API Submission Format

```javascript
POST /submit
{
  avatarId: 'avtr_xxx-xxx-xxx',
  userId: 'usr_xxx-xxx-xxx',
  userName: 'UserName',
  attribution: 'DiscordID' // Optional
}
```

### Duplicate Handling

- avtrDB: Returns `unique: false` if avatar exists
- Other providers: Don't check uniqueness
- Plugin tracks all processed avatars locally

## Statistics Structure

```javascript
{
  totalProcessed: 150,
  totalSubmitted: 720,  // 150 × 5 providers (minus failures)
  duplicates: 23,
  errors: 5,
  byProvider: {
    avtrDB: { submitted: 145, errors: 2, duplicates: 23 },
    NSVR: { submitted: 140, errors: 3, duplicates: 0 },
    PAW: { submitted: 148, errors: 0, duplicates: 0 },
    // ...
  }
}
```

## Best Practices

1. **Add Discord ID** - Helps providers track contributors
2. **Enable multiple providers** - Redundancy ensures data preservation
3. **Monitor statistics** - Check for high error rates
4. **Clear cache periodically** - Prevents memory bloat in long sessions
5. **Report issues** - Contact provider if submissions fail consistently

## Provider Notes

### avtrDB

- Checks for duplicates before accepting
- Returns `unique: true/false` in response
- Most reliable for duplicate detection

### NSVR

- May go offline occasionally
- Warnings instead of errors for failed submissions
- Secondary/backup provider

### Others

- Accept all submissions without uniqueness check
- Used for data redundancy and availability

## Troubleshooting

| Issue                   | Solution                                 |
| ----------------------- | ---------------------------------------- |
| Submissions failing     | Check provider status, verify network    |
| Duplicates not filtered | Only avtrDB filters, others submit all   |
| Queue not processing    | Check `enableQueueProcessing` setting    |
| High error rate         | Disable problematic provider temporarily |
| Memory usage high       | Clear cache, reduce `batchSize`          |

## See Also

- [Bio Updater](bio-updater.md) - Tracks avatar usage
- [Bio Change Notifier](bio-change-notifier.md) - Monitors bio changes
