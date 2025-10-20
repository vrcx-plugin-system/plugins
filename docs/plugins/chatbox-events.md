# ChatBox Events 💬

Send social events and API errors to VRChat chatbox via OSC Bridge.

## Overview

Automatically sends notifications to your VRChat chatbox when:

- Friends join or leave your instance
- You block/unblock players
- You mute/unmute players
- VRChat API errors occur

**Dependencies:** Requires OSC Bridge plugin to be enabled and connected to VRCOSC.

## Features

### 👥 Social Events

- **Player Joined**: Shows when friends join your instance
- **Player Left**: Shows when friends leave your instance
- **Friends Only Filter**: Option to only show events for friends (not all players)

### 🚫 Moderation Events

- **Blocked**: Shows when you block someone
- **Unblocked**: Shows when you unblock someone
- **Muted**: Shows when you mute someone
- **Unmuted**: Shows when you unmute someone

### ⚠️ API Errors

- **Rate Limits**: Notifies when VRChat API rate limits you (429)
- **Authentication**: Shows auth failures (401)
- **Forbidden**: Shows permission errors (403)
- **Server Errors**: Shows VRChat server issues (5xx)
- **Configurable Severity**: Filter by error severity level

## Settings

### General

- **Enable chatbox events**: Master toggle for all events
- **Deduplicate seconds**: Prevent duplicate messages within X seconds
- **Message prefix**: Add prefix to all messages (e.g., "[VRCX]")

### Social Events

- **Show when friends join**: Display join notifications
- **Show when friends leave**: Display leave notifications
- **Only show friends**: Filter to friends only (ignore non-friend players)

### Moderation Events

- **Show blocks**: Display when you block someone
- **Show unblocks**: Display when you unblock someone
- **Show mutes**: Display when you mute someone
- **Show unmutes**: Display when you unmute someone

### API Errors

- **Show API errors**: Enable API error notifications
- **Minimum severity**:
  - `All`: Includes rate limits (429)
  - `Warning`: Client errors only (4xx)
  - `Error`: Critical errors only (5xx)

## Example Output

```
[VRCX] Natsumi joined
[VRCX] PyPy left
[VRCX] Blocked ToxicPlayer
[VRCX] Rate limited by VRChat API
[VRCX] VRChat API server error
[VRCX] VRChat issue: Partial System Outage: API, Website
[VRCX] VRChat services operational
```

## Requirements

1. **OSC Bridge** plugin must be installed and enabled
2. **VRCOSC** must be running and connected
3. **VRChat** must have OSC enabled

## How It Works

### Event Flow

```
VRCX detects event
  ↓
ChatBox Events plugin processes it
  ↓
Sends message to OSC Bridge
  ↓
OSC Bridge sends IPC to VRCOSC
  ↓
VRCOSC sends to VRChat via OSC
  ↓
Appears in VRChat chatbox
```

### Game Log Monitoring

The plugin hooks into VRCX's game log system:

- Monitors `addGameLog()` function
- Filters for `OnPlayerJoined` and `OnPlayerLeft` events
- Checks if player is a friend (if enabled)
- Sends formatted message to chatbox

### API Error Monitoring

The plugin hooks into VRCX's WebAPI:

- Monitors `WebApi.call()` responses
- Checks HTTP status codes
- Filters by configured severity
- Sends error notifications to chatbox

## Tips

### Reduce Spam

- Enable "Only show friends" to ignore non-friend players
- Increase "Deduplicate seconds" to prevent message flooding
- Disable leave notifications if you only care about joins
- Set API error severity to "Error" to hide rate limit warnings

### Custom Prefix

Add a custom prefix to identify VRCX messages:

```
[VRCX] PlayerName joined
[MyTag] PlayerName joined
🔔 PlayerName joined
```

## Troubleshooting

### No messages in chatbox

1. Check that OSC Bridge is enabled and shows "OSC Ready"
2. Verify VRCOSC is running and connected
3. Enable "Log VRCX Commands" in OSC Bridge to see if messages are being sent
4. Check VRChat OSC is enabled in settings

### Too many messages

1. Enable "Only show friends" filter
2. Disable leave notifications
3. Increase deduplicate seconds
4. Disable API error notifications

### Messages delayed

- VRCOSC processes chatbox messages in batches
- VRChat may queue chatbox messages
- Increase deduplicate seconds if seeing duplicates

## Author

**Bluscream** - VRCX Plugin System Maintainer
