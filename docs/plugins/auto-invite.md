# Auto Invite 📨

Automatically send invites to users when you change instances.

## Overview

| Property         | Value                         |
| ---------------- | ----------------------------- |
| **ID**           | `auto-invite`                 |
| **Category**     | Social Feature                |
| **Tags**         | Social, Automation, Invite    |
| **Dependencies** | `context-menu-api` (required) |
| **Author**       | Bluscream                     |

## Features

- ✅ Track users to auto-invite
- ✅ Automatic invite when you change instances
- ✅ Custom invite message with template variables
- ✅ Context menu integration
- ✅ Location monitoring
- ✅ Per-user tracking
- ✅ Persistent user list

## Action Buttons

| Button                     | Description                       |
| -------------------------- | --------------------------------- |
| **Clear All Auto-Invites** | Remove all users from invite list |

## Context Menu Items

| Item              | Location  | Description                       |
| ----------------- | --------- | --------------------------------- |
| Auto Invite       | User menu | Add user to auto-invite list      |
| Clear Auto Invite | User menu | Remove user from auto-invite list |

## Settings

| Setting               | Type   | Default                 | Description                  |
| --------------------- | ------ | ----------------------- | ---------------------------- |
| `customInviteMessage` | String | `Auto-invite from VRCX` | Message template for invites |

### Template Variables

| Variable            | Replaced With            |
| ------------------- | ------------------------ |
| `{userId}`          | Target user ID           |
| `{userName}`        | Target user display name |
| `{userDisplayName}` | Target user display name |
| `{worldName}`       | Current world name       |
| `{worldId}`         | Current world ID         |
| `{instanceId}`      | Current instance ID      |

## Usage

### Add User to Auto-Invite

**From Context Menu:**

1. Right-click on any user
2. Click "Auto Invite"
3. User is added to auto-invite list

**From Console:**

```javascript
const autoInvite = window.customjs.getModule("auto-invite");
autoInvite.addAutoInvite("usr_xxx-xxx-xxx", "UserName");
```

### Remove User from Auto-Invite

**From Context Menu:**

1. Right-click on the user
2. Click "Clear Auto Invite"

**From Console:**

```javascript
const autoInvite = window.customjs.getModule("auto-invite");
autoInvite.removeAutoInvite("usr_xxx-xxx-xxx");
```

### View Auto-Invite List

```javascript
const autoInvite = window.customjs.getModule("auto-invite");
console.log(Array.from(autoInvite.autoInviteUsers.entries()));
// [['usr_xxx', 'UserName'], ...]
```

### Get List for Other Plugins

```javascript
const autoInvite = window.customjs.getModule("auto-invite");
const list = autoInvite.getAutoInviteUsersList();
// [{ userId: 'usr_xxx', displayName: 'UserName' }, ...]
```

## How It Works

1. **Location Monitoring**: Watches for location store changes
2. **Travel Detection**: Detects when you join a new instance
3. **User Filtering**: Checks if any auto-invite users are NOT in the new instance
4. **Invite Sending**: Sends invite to each tracked user not present
5. **Message Customization**: Applies template variables to message

## Implementation Details

### Location Monitoring

Watches Pinia location store for changes:

```javascript
window.$pinia?.location?.store;
```

### Invite Sending

Calls `window.API.sendInvite()` with:

```javascript
{
  instanceId: newInstanceId,
  worldId: newWorldId,
  worldName: newWorldName,
  message: customMessage // Optional
}
```

### Persistence

Auto-invite list stored in `localStorage` under plugin settings.

## Best Practices

1. **Invite considerate** - Only add users who appreciate frequent invites
2. **Customize message** - Make it friendly and recognizable
3. **Review regularly** - Remove users who don't respond
4. **Communicate** - Let users know you've added them
5. **Respect boundaries** - Remove if requested

## Difference from Auto Follow

| Feature      | Auto Follow                 | Auto Invite                |
| ------------ | --------------------------- | -------------------------- |
| **Trigger**  | When joining THEIR instance | When you join ANY instance |
| **Action**   | Request invite TO them      | Send invite FROM you       |
| **Use Case** | Join specific users         | Bring users to you         |

## Troubleshooting

| Issue                     | Solution                               |
| ------------------------- | -------------------------------------- |
| Invite not sending        | Check API permissions, verify user IDs |
| Wrong message             | Update message template in settings    |
| Users already in instance | Plugin filters these out automatically |
| Invite spam               | Review and reduce auto-invite list     |

## See Also

- [Auto Follow](auto-follow.md)
- [Context Menu API](context-menu-api.md)
- [Invite Message API](invite-message-api.md)
