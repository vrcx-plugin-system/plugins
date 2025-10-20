# VRCX Plugins Documentation

This directory contains documentation for all VRCX plugins.

## 📖 Browse Plugins

**[View Plugin Browser](https://vrcx-plugin-system.github.io/plugins)** - Interactive Bootstrap table showing all available plugins

> **Local**: [Open index.html](./index.html) | **API**: [repo.json](https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/repo.json)

## 📚 Individual Plugin Docs

Each plugin has its own detailed documentation in the `plugins/` subdirectory:

- [avatar-log.md](./plugins/avatar-log.md)
- [chatbox-events.md](./plugins/chatbox-events.md)
- [debug.md](./plugins/debug.md)
- [osc-bridge.md](./plugins/osc-bridge.md)
- ... and many more!

## 🔗 Quick Links

- **Plugin Source Code**: `../src/plugins/`
- **Compiled Plugins**: `../dist/`
- **Repository Metadata**: `../dist/repo.json`

## 🌐 Online Access

If you're viewing this on GitHub, you can browse the plugin documentation:

- **Interactive Browser**: Open `index.html` in your browser
- **Individual Docs**: Browse the `plugins/` folder

## 📝 Documentation Format

Each plugin documentation follows this structure:

```markdown
# Plugin Name

Description

## Overview

...

## Features

...

## Settings

...

## Usage Examples

...

## Requirements

...

## Author

...
```

## 🔄 Updating Documentation

Documentation is manually maintained. When creating a new plugin:

1. Create the plugin in `../src/plugins/your-plugin.ts`
2. Build the plugin: `npm run build`
3. Create documentation: `./plugins/your-plugin.md`
4. The HTML browser will automatically pick it up from `repo.json`

---

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.
