# Retry Auto Login 🔑

Automatically retries login when disconnected from VRChat API.

## Overview

| Property         | Value                           |
| ---------------- | ------------------------------- |
| **ID**           | `retry-auto-login`              |
| **Category**     | Utility                         |
| **Tags**         | Utility, Login, Automation      |
| **Dependencies** | None                            |
| **Author**       | Bluscream                       |

## Features

- ✅ Auto-retry on startup if logged out
- ✅ Periodic login checks
- ✅ Configurable retry intervals
- ✅ Success/failure notifications
- ✅ Manual retry trigger
- ✅ Login state monitoring

## Action Buttons

| Button          | Description                 |
| --------------- | --------------------------- |
| **Retry Login** | Manually trigger login retry|

## Settings

| Setting                | Type     | Default   | Description                              |
| ---------------------- | -------- | --------- | ---------------------------------------- |
| `autoRetryOnStartup`   | Boolean  | `true`    | Retry login on plugin startup if logged out|
| `autoRetryOnInterval`  | Boolean  | `true`    | Periodically check and retry login       |
| `retryInterval`        | Timespan | 5 minutes | How often to check login state           |
| `showNotifications`    | Boolean  | `true`    | Show success/failure notifications       |

## Usage

### Manual Retry

```javascript
const retryLogin = window.customjs.getModule('retry-auto-login');
await retryLogin.attemptAutoLogin();
```

### Check Login State

```javascript
const retryLogin = window.customjs.getModule('retry-auto-login');
const isLoggedIn = await retryLogin.checkLoginState();
console.log('Logged in:', isLoggedIn);
```

## How It Works

### Login Check Process

1. Checks `window.$pinia?.user?.isLoggedIn`
2. If logged out, attempts auto-login
3. Calls `window.API.autoLogin()`
4. Shows notification based on result
5. Schedules next check based on interval

### Trigger Conditions

| Condition           | When                                |
| ------------------- | ----------------------------------- |
| Startup Retry       | Plugin starts + user logged out     |
| Interval Retry      | Every `retryInterval` if logged out |
| Manual Retry        | Via action button                   |

## Implementation Details

### Login State Detection

```javascript
const isLoggedIn = window.$pinia?.user?.isLoggedIn || false;
```

### Auto-Login Call

```javascript
const result = await window.API.autoLogin();
// Returns: { success: boolean, message?: string }
```

### Interval Management

- Starts timer in `start()` method
- Clears timer in `stop()` method
- Uses `setInterval()` for periodic checks

## Best Practices

1. **Enable on startup** - Catches disconnections overnight
2. **Set reasonable interval** - 5-10 minutes is good balance
3. **Keep notifications on** - Know when reconnection happens
4. **Monitor console** - Check for repeated failures

## Troubleshooting

| Issue                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| Not retrying           | Check if auto-retry settings are enabled  |
| Repeated failures      | Verify VRChat API credentials are saved   |
| Too frequent retries   | Increase `retryInterval`                  |
| No notifications       | Enable `showNotifications` setting        |

## See Also

- [API Retry Patch](api-retry-patch.md) - Retries failed API calls

