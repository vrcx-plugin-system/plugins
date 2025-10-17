# User Badge Pipeline Patch Plugin

## Overview

This plugin adds support for VRChat's `user-badge-assigned` pipeline event type, which is sent when you earn a new badge but isn't currently handled by VRCX's core websocket pipeline.

## Problem

When you earn a badge in VRChat (like the "Candy Codex Completionist" from Spookality 2025), VRCX receives a `user-badge-assigned` pipeline message but doesn't know how to handle it, resulting in:

```
Unknown pipeline type {type: 'user-badge-assigned', content: {...}}
```

## Solution

This plugin:

- ✅ Intercepts the "Unknown pipeline type" console message
- ✅ Handles `user-badge-assigned` events properly
- ✅ Creates notifications for earned badges
- ✅ Adds badge info to the notification table
- ✅ Shows a success toast with badge name and description
- ✅ Updates the shared feed

## Features

- **Badge Notifications**: Get notified in VRCX when you earn a new badge
- **Notification History**: Badge earnings are added to your notification table
- **Badge Details**: Shows badge name, description, and image URL
- **Non-Intrusive**: Patches console.log cleanly and restores it when disabled
- **No Core Modifications**: Works as a plugin without modifying VRCX source code

## Badge Event Structure

The plugin handles events with this structure:

```javascript
{
  type: "user-badge-assigned",
  content: {
    badge: {
      badgeId: "bdg_...",
      badgeName: "Badge Name",
      badgeDescription: "Badge description",
      badgeImageUrl: "https://assets.vrchat.com/badges/...",
      assignedAt: "2025-10-16T08:20:54.206Z",
      hidden: false,
      showcased: false,
      updatedAt: "2025-10-16T08:20:54.206Z"
    }
  }
}
```

## Installation

1. Copy `user-badge-pipeline-patch.js` to your VRCX plugins folder
2. Enable it in the VRCX Plugin Manager
3. That's it! Badge notifications will now work

## Usage

Once enabled, the plugin runs automatically. When you earn a badge:

1. You'll see a success toast: `🏅 Badge Earned: [Badge Name]`
2. The badge will appear in your notification feed
3. No more "Unknown pipeline type" errors

## Technical Details

The plugin:

- Waits for Pinia stores to be available
- Intercepts `console.log` to catch unknown pipeline messages
- Checks if the pipeline type is `user-badge-assigned`
- Accesses notification, shared feed, and UI stores
- Creates and queues a proper notification entry
- Falls back to basic notifications if stores aren't ready

## Dependencies

None - this is a standalone plugin.

## Author

Bluscream

## Version

1.0.0

## Tags

`Bugfix`, `Notifications`
