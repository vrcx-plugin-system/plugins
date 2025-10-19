# Plugin Analyzer 🔍

Analyzes plugin code and shows detailed metadata, statistics, and source code (minified and original).

## Overview

| Property         | Value                   |
| ---------------- | ----------------------- |
| **ID**           | `plugin-analyzer`       |
| **Category**     | Utility                 |
| **Tags**         | Tool, Utility, Analysis |
| **Dependencies** | `dialog-api` (required) |
| **Author**       | Bluscream               |

## Features

- ✅ Code metrics (size, lines, functions)
- ✅ Metadata extraction
- ✅ Dependency analysis
- ✅ Settings and category counting
- ✅ Resource usage detection
- ✅ Lifecycle method detection
- ✅ External API usage detection
- ✅ Side-by-side minified and original source code view
- ✅ File size comparison
- ✅ Size reduction percentage

## Analysis Sections

### Basic Information

| Field              | Description                      |
| ------------------ | -------------------------------- |
| Name               | Plugin display name              |
| Description        | Plugin description               |
| Authors            | Comma-separated author names     |
| Build              | Build number/timestamp           |
| Class Name         | JavaScript class name            |
| URL                | Minified JavaScript URL          |
| Source URL         | Original TypeScript source URL   |
| Module ID          | Unique module identifier         |
| Enabled by Default | Repository default state         |
| Status             | Runtime status (Running/Stopped) |

### Code Metrics

| Metric         | Description                              |
| -------------- | ---------------------------------------- |
| Minified Size  | Size of compiled JavaScript file         |
| Original Size  | Size of TypeScript source (if available) |
| Size Reduction | Percentage reduction from TS to JS       |
| Line Count     | Total lines in code                      |
| Function Count | Number of function definitions           |
| Event Handlers | Number of event listener registrations   |

### Settings Analysis

| Metric           | Description                     |
| ---------------- | ------------------------------- |
| Settings Count   | Number of configurable settings |
| Categories Count | Number of setting categories    |

### Resource Registrations

| Resource      | Detection Method                |
| ------------- | ------------------------------- |
| Observers     | `registerObserver()` calls      |
| Listeners     | `registerListener()` calls      |
| Subscriptions | `registerSubscription()` calls  |
| Hooks         | `registerPreHook()`, etc. calls |
| Timers        | `registerTimer()` calls         |

### Lifecycle Methods

| Method      | Checked For                |
| ----------- | -------------------------- |
| `load()`    | Method definition in class |
| `start()`   | Method definition in class |
| `stop()`    | Method definition in class |
| `onLogin()` | Method definition in class |

### External APIs

| API        | Detection Pattern               |
| ---------- | ------------------------------- |
| AppApi     | `window.AppApi` references      |
| Pinia      | `window.$pinia` references      |
| Vue Router | `window.$router` references     |
| VRCX API   | `window.API` references         |
| Web API    | `fetch()`, `localStorage`, etc. |

### Resource Usage

| Resource       | Detection Pattern                  |
| -------------- | ---------------------------------- |
| Creates DOM    | `createElement()` calls            |
| Modifies DOM   | `innerHTML`, `appendChild()`, etc. |
| localStorage   | `localStorage` references          |
| sessionStorage | `sessionStorage` references        |
| WebSocket      | `WebSocket` references             |

## Source Code View

### Minified Tab

- Shows compiled JavaScript code
- Displays file size (e.g., "10.92 KB")
- What's actually running in VRCX
- Syntax highlighted
- Scrollable with max-height

### Original Tab

- Shows TypeScript source code
- Displays file size (e.g., "23.58 KB")
- Only available if plugin has `sourceUrl` in repository
- Syntax highlighted
- Scrollable with max-height

### Tab Switching

Click tabs to toggle between minified and original source code views.

## Usage

### Analyze from Plugin Manager

1. Open Plugin Manager UI
2. Find the plugin you want to analyze
3. Click the "Analyze" button (🔍 icon)
4. View the analysis dialog

### Analyze Programmatically

```javascript
const analyzer = window.customjs.getModule("plugin-analyzer");

await analyzer.analyzePlugin("https://github.com/.../my-plugin.js");
```

## Implementation Details

### Metadata Fetching

Uses `CustomModule.fetchMetadata()` static method to:

1. Fetch plugin code from URL
2. Parse metadata from code comments
3. Count various code patterns
4. Extract settings and lifecycle methods

### Source Code Fetching

- **Minified**: Included in `fetchMetadata()` result
- **Original**: Fetched from `sourceUrl` if available in repository metadata
- Both cached in analysis results

### Size Calculation

```javascript
const reduction = Math.round((1 - minifiedSize / originalSize) * 100);
// Example: 54% reduction
```

## Output Example

```
Basic Information:
  Name: Update Checker 🔄
  Description: Automatically checks for updates...
  Authors: Bluscream
  Status: ✓ Running

Code Metrics:
  Minified Size: 10.92 KB
  Original Size: 23.58 KB
  Size Reduction: 54%
  Line Count: 617
  Function Count: 15

Settings:
  Settings Count: 11
  Categories Count: 0

Lifecycle Methods:
  Has load(): ✓
  Has start(): ✓
  Has stop(): ✓
  Has onLogin(): ✗
```

## Troubleshooting

| Issue                       | Solution                                  |
| --------------------------- | ----------------------------------------- |
| Original source not showing | Check if plugin has `sourceUrl` in repo   |
| Analysis dialog empty       | Verify plugin URL is valid and accessible |
| Metrics show 0              | Plugin may not use detected patterns      |
| Source code truncated       | Scroll within code section                |

## See Also

- [Plugin Manager UI](plugin-manager-ui.md)
- [Dialog API](dialog-api.md)
