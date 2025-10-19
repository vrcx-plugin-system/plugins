# Invite Message API ✉️

Core API for managing custom invite, invite response, and invite request messages.

## Overview

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| **ID**           | `invite-message-api`                   |
| **Category**     | Core API                               |
| **Tags**         | API, Core, Invite, Messages            |
| **Dependencies** | None                                   |
| **Author**       | Bluscream                              |

## Features

- ✅ Manage invite messages
- ✅ Manage invite response messages
- ✅ Manage invite request messages
- ✅ Multiple message slots per type
- ✅ Message selection dialogs
- ✅ Template variable support
- ✅ Persistent storage
- ✅ Default message management

## Message Types

| Type              | Used For                        | Default Count |
| ----------------- | ------------------------------- | ------------- |
| Invite            | Sending invites to users        | 5 slots       |
| Invite Response   | Responding to invite requests   | 5 slots       |
| Invite Request    | Requesting invites from users   | 5 slots       |

## Core Methods

| Method                    | Parameters              | Returns           | Description                  |
| ------------------------- | ----------------------- | ----------------- | ---------------------------- |
| `getInviteMessages`       | -                       | `string[]`        | Get all invite messages      |
| `getInviteResponseMessages`| -                      | `string[]`        | Get all response messages    |
| `getInviteRequestMessages`| -                       | `string[]`        | Get all request messages     |
| `setInviteMessage`        | `index, message`        | `void`            | Update invite message        |
| `setInviteResponseMessage`| `index, message`        | `void`            | Update response message      |
| `setInviteRequestMessage` | `index, message`        | `void`            | Update request message       |

## Usage

### Get Messages

```javascript
const api = window.customjs.getModule('invite-message-api');

const invites = api.getInviteMessages();
console.log('Invite messages:', invites);

const responses = api.getInviteResponseMessages();
console.log('Response messages:', responses);
```

### Set Custom Message

```javascript
const api = window.customjs.getModule('invite-message-api');

// Set first invite message
api.setInviteMessage(0, 'Join me in VRChat!');

// Set response message
api.setInviteResponseMessage(0, 'Sure, sending invite!');

// Set request message
api.setInviteRequestMessage(0, 'Can I join you?');
```

### Template Variables

Messages support variables (when used with Auto-Invite/Auto-Follow):

| Variable          | Replaced With        |
| ----------------- | -------------------- |
| `{userId}`        | Target user ID       |
| `{userName}`      | User display name    |
| `{worldName}`     | Current world name   |
| `{instanceId}`    | Instance ID          |

## Default Messages

### Invite Messages

1. `Auto-invite from VRCX`
2. `Join me!`
3. `Come hang out!`
4. Empty slot
5. Empty slot

### Invite Response Messages

1. `Sure, sending invite!`
2. `Okay, one moment`
3. `Coming!`
4. Empty slot
5. Empty slot

### Invite Request Messages

1. `Can I join you?`
2. `May I join?`
3. `Request invite please`
4. Empty slot
5. Empty slot

## Implementation Details

### Storage

Messages stored in `localStorage`:
- Key: `invite-message-api:inviteMessages`
- Key: `invite-message-api:inviteResponseMessages`
- Key: `invite-message-api:inviteRequestMessages`
- Format: JSON array of strings

### Integration

Used by:
- **Auto-Invite Plugin** - Uses invite messages
- **Auto-Follow Plugin** - Uses invite request messages

## Best Practices

1. **Keep messages friendly** - Avoid spam-like language
2. **Be clear** - Recipients should understand purpose
3. **Use templates** - Personalize with variable substitution
4. **Have variety** - Multiple messages prevent monotony
5. **Keep it short** - VRChat has character limits

## Troubleshooting

| Issue               | Solution                                 |
| ------------------- | ---------------------------------------- |
| Messages not saving | Check localStorage availability          |
| Wrong message sent  | Verify message index, check defaults     |
| Variables not working| Ensure used with compatible plugins     |

## See Also

- [Auto-Invite](auto-invite.md) - Uses invite messages
- [Auto-Follow](auto-follow.md) - Uses request messages

