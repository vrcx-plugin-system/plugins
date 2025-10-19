# Auto Follow 👥

Automatically send invite requests to users when you join their instance.

## Overview

| Property         | Value                          |
| ---------------- | ------------------------------ |
| **ID**           | `auto-follow`                  |
| **Category**     | Social Feature                 |
| **Tags**         | Social, Automation, Follow     |
| **Dependencies** | `context-menu-api` (required)  |
| **Author**       | Bluscream                      |

## Features

- ✅ Track users to auto-follow
- ✅ Automatic invite request when joining their instance
- ✅ Custom invite request message with template variables
- ✅ Context menu integration
- ✅ Location monitoring
- ✅ Per-user tracking
- ✅ Persistent user list

## Action Buttons

| Button                   | Description                        |
| ------------------------ | ---------------------------------- |
| **Clear All Auto-Follows** | Remove all users from follow list |

## Context Menu Items

| Item             | Location   | Description                      |
| ---------------- | ---------- | -------------------------------- |
| Auto Follow      | User menu  | Add user to auto-follow list     |
| Clear Auto Follow| User menu  | Remove user from auto-follow list|

## Settings

| Setting                    | Type   | Default           | Description                           |
| -------------------------- | ------ | ----------------- | ------------------------------------- |
| `customInviteRequestMessage` | String | `Can I join you?` | Message template for invite requests |

### Template Variables

| Variable          | Replaced With              |
| ----------------- | -------------------------- |
| `{userId}`        | Target user ID             |
| `{userName}`      | Target user display name   |
| `{userDisplayName}` | Target user display name |
| `{worldName}`     | Current world name         |
| `{worldId}`       | Current world ID           |
| `{instanceId}`    | Current instance ID        |

## Usage

### Add User to Auto-Follow

**From Context Menu:**
1. Right-click on any user
2. Click "Auto Follow"
3. User is added to auto-follow list

**From Console:**
```javascript
const autoFollow = window.customjs.getModule('auto-follow');
autoFollow.addAutoFollow('usr_xxx-xxx-xxx', 'UserName');
```

### Remove User from Auto-Follow

**From Context Menu:**
1. Right-click on the user
2. Click "Clear Auto Follow"

**From Console:**
```javascript
const autoFollow = window.customjs.getModule('auto-follow');
autoFollow.removeAutoFollow('usr_xxx-xxx-xxx');
```

### View Auto-Follow List

```javascript
const autoFollow = window.customjs.getModule('auto-follow');
console.log(Array.from(autoFollow.autoFollowUsers.entries()));
// [['usr_xxx', 'UserName'], ...]
```

## How It Works

1. **Location Monitoring**: Checks current location every 10 seconds
2. **User Detection**: When you join an instance, checks if any auto-follow users are present
3. **Invite Request**: Automatically sends invite request with custom message
4. **One-time per Session**: Only sends once per instance visit

## Implementation Details

### Location Checking

Uses `window.utils.parseLocation()` to get:
- `worldId`
- `instanceId`
- `worldName`

### Invite Request Sending

Calls `window.API.sendRequestInvite()` with:
```javascript
{
  instanceId: currentInstanceId,
  worldId: currentWorldId,
  worldName: currentWorldName,
  message: customMessage // Optional
}
```

### Persistence

Auto-follow list stored in `localStorage` under plugin settings.

## Best Practices

1. **Use sparingly** - Only add close friends to avoid spam
2. **Customize message** - Make it personal and recognizable
3. **Monitor list** - Periodically review and clean up old users
4. **Respect privacy** - Remove users if they express discomfort

## Troubleshooting

| Issue                        | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| Invite not sending           | Check if user is in same instance          |
| Wrong message                | Update message template in settings        |
| Multiple invites sent        | Plugin should prevent this - report bug    |
| Context menu item missing    | Ensure context-menu-api is loaded          |

## See Also

- [Auto Invite](auto-invite.md)
- [Context Menu API](context-menu-api.md)

