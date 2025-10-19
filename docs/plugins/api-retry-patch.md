# API Retry Patch 🔄

Patches VRChat API methods to automatically retry on failure with exponential backoff.

## Overview

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| **ID**           | `api-retry-patch`                        |
| **Category**     | Core Utility                             |
| **Tags**         | API, Patch, Reliability, Network         |
| **Dependencies** | None                                     |
| **Author**       | Bluscream                                |

## Features

- ✅ Automatic retry for failed API calls
- ✅ Exponential backoff strategy
- ✅ Configurable retry count
- ✅ Configurable base delay
- ✅ Logs retry attempts
- ✅ Statistics tracking
- ✅ Patches 26+ API methods

## Settings

| Setting      | Type     | Default    | Description                     |
| ------------ | -------- | ---------- | ------------------------------- |
| `maxRetries` | Number   | `3`        | Maximum retry attempts          |
| `baseDelay`  | Timespan | 1 second   | Base delay between retries      |

## Patched API Methods

### Authentication

- `verifyOTP` - Email OTP verification
- `verifyTOTP` - 2FA verification
- `verifyEmailOTP` - Email OTP verification

### User Operations

- `getConfig` - Get VRChat config
- `getUser` - Get user by ID
- `getCachedUser` - Get cached user
- `getUsers` - Get multiple users
- `saveCurrentUser` - Save user updates

### World & Instance

- `getWorld` - Get world by ID
- `getCachedWorld` - Get cached world
- `saveWorld` - Save world data
- `getInstance` - Get instance by ID
- `getCachedInstance` - Get cached instance
- `selfInvite` - Send self-invite
- `createInstance` - Create new instance

### Social

- `getFriends` - Get friends list
- `sendFriendRequest` - Send friend request
- `deleteFriend` - Remove friend
- `sendInvite` - Send invite
- `sendRequestInvite` - Request invite
- `getNotifications` - Get notifications
- `getNotificationsV2` - Get notifications (v2)

### Avatar & Content

- `getAvatar` - Get avatar by ID
- `saveAvatar` - Save avatar data
- `getGroup` - Get group by ID
- `getGroupMember` - Get group member info

## Usage

### View Retry Statistics

```javascript
const retryPatch = window.customjs.getModule('api-retry-patch');

console.log('Total retries:', retryPatch.retryStats.totalRetries);
console.log('Successful:', retryPatch.retryStats.successfulRetries);
console.log('Failed:', retryPatch.retryStats.failedRetries);
```

## How It Works

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: Wait baseDelay × 1 (1 second)
Attempt 3: Wait baseDelay × 2 (2 seconds)
Attempt 4: Wait baseDelay × 3 (3 seconds)
```

### Patching Process

1. Saves original API method
2. Wraps in retry logic
3. On error, waits with exponential backoff
4. Retries up to `maxRetries` times
5. Logs each retry attempt
6. Returns original error if all retries fail

### Error Detection

Retries on any thrown error or rejected promise from API methods.

## Console Output Example

```
[CJS|api-retry-patch] ⟳ Retry attempt 1/3 for getWorld (Error: Network timeout) - waiting 1147ms
[CJS|api-retry-patch] ✓ Retry successful for getWorld after 1 attempt(s)
```

## Implementation Details

### Patch Template

```javascript
const originalMethod = window.API[methodName];

window.API[methodName] = async function(...args) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = baseDelay * (attempt + 1);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
};
```

### Statistics Tracking

```javascript
{
  totalRetries: 150,
  successfulRetries: 142,
  failedRetries: 8
}
```

## Best Practices

1. **Keep default settings** - 3 retries with 1s delay works well
2. **Monitor statistics** - High retry rates may indicate network issues
3. **Don't disable** - Improves VRChat API reliability significantly
4. **Check console** - Retry logs help diagnose connectivity problems

## Troubleshooting

| Issue                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| Too many retries       | Reduce `maxRetries`                       |
| Slow API responses     | Reduce `baseDelay` for faster retries     |
| Still failing after retries | Check network connection, VRChat API status |

## See Also

- [Retry Auto Login](retry-auto-login.md) - Retries authentication

