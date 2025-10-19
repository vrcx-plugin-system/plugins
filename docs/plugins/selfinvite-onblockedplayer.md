# Self Invite on Blocked Player 🚫

Automatically creates a self-invite when a blocked player joins your instance.

## Overview

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| **ID**           | `selfinvite-onblockedplayer`             |
| **Category**     | Social Feature                           |
| **Tags**         | Social, Automation, Safety, Instance     |
| **Dependencies** | None                                     |
| **Author**       | Bluscream                                |

## Features

- ✅ Automatic self-invite creation
- ✅ Blocked player join detection
- ✅ Configurable delay
- ✅ Cool down period
- ✅ Event-based triggering
- ✅ Prevents invite spam

## Settings

| Setting      | Type     | Default     | Description                          |
| ------------ | -------- | ----------- | ------------------------------------ |
| `delayMs`    | Timespan | 1 second    | Delay before creating self-invite    |
| `cooldownMs` | Timespan | 30 seconds  | Minimum time between self-invites    |

## Usage

### Automatic Operation

The plugin works automatically:
1. Blocked player joins instance
2. Wait `delayMs`
3. Create self-invite
4. Enter cooldown period

### Manual Trigger

```javascript
const selfInvite = window.customjs.getModule('selfinvite-onblockedplayer');
// Automatic only - no manual methods
```

## How It Works

### Detection

Hooks into player join events:
```javascript
$app.data.playerJoins
```

Checks if joining player is in blocked list via moderation cache.

### Self-Invite Creation

Calls `window.API.selfInvite()` with current instance details:
```javascript
{
  worldId: currentWorldId,
  instanceId: currentInstanceId,
  worldName: currentWorldName
}
```

### Cooldown

Prevents multiple self-invites by tracking:
- Last blocked player join time
- Last invite creation time
- Enforces `cooldownMs` wait period

## Why This is Useful

**Quick Escape**: When a blocked user joins your instance, you may want to quickly create an invite to the same instance so friends can follow you to a different instance ID.

**Use Case**: 
1. You're in a public instance
2. Blocked user joins
3. Self-invite created automatically
4. Share invite with friends
5. Friends join you in new instance (same world, different ID)

## Implementation Details

### Delay Purpose

The `delayMs` ensures:
- Instance fully loaded
- API ready for self-invite
- Reduces race conditions

### Cooldown Purpose

The `cooldownMs` prevents:
- Multiple invites if several blocked users join
- API spam
- Notification flooding

## Best Practices

1. **Keep delay short** - 1-2 seconds is optimal
2. **Set reasonable cooldown** - 30-60 seconds prevents spam
3. **Have friends ready** - They'll need the invite to follow you
4. **Use with caution** - Frequent instance hopping may disrupt experience

## Troubleshooting

| Issue                       | Solution                                 |
| --------------------------- | ---------------------------------------- |
| Self-invite not creating    | Check if VRChat API is responsive        |
| Multiple invites created    | Increase `cooldownMs`                    |
| Invite created too late     | Reduce `delayMs`                         |
| Not detecting blocked users | Verify user is actually in blocked list  |

## See Also

- [Auto-Invite](auto-invite.md) - Manages invite automation
- [Auto-Follow](auto-follow.md) - Manages follow automation

