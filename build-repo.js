/**
 * Build repo.json from compiled plugin files in dist/
 * Scans dist/ directory and extracts metadata from each plugin
 */

const fs = require("fs");
const path = require("path");

// Configuration
const DIST_DIR = path.join(__dirname, "dist");
const REPO_FILE = path.join(DIST_DIR, "repo.json");
const BASE_URL =
  "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist";
const SOURCE_BASE_URL =
  "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/src/plugins";

// Files to exclude from scanning
const EXCLUDE_FILES = [];

// Default enabled plugins (core functionality)
const DEFAULT_ENABLED = [
  "bio-symbols-patch",
  "api-retry-patch",
  "user-badge-pipeline-patch",
  "invite-params-fix",
  "context-menu-api",
  "nav-menu-api",
  "dialog-api",
  "dialog-events-api",
  "tag-api",
  "plugin-analyzer",
  "invite-message-api",
  "plugin-manager-ui",
];

/**
 * Extract plugin metadata from JavaScript file
 */
function extractPluginMetadata(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const pluginId = fileName.replace(".js", "");

    // Get file modification time for build timestamp
    const stats = fs.statSync(filePath);
    const buildTimestamp = Math.floor(stats.mtimeMs / 1000).toString();

    // Extract constructor metadata
    const metadata = {
      id: pluginId,
      name: pluginId
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      description: "",
      authors: [{ name: "Unknown" }],
      build: buildTimestamp, // Use file modification time
      url: `${BASE_URL}/${fileName}`,
      sourceUrl: `${SOURCE_BASE_URL}/${fileName.replace(".js", ".ts")}`,
      tags: [],
      enabled: DEFAULT_ENABLED.includes(pluginId),
    };

    // Extract name (handles minified code) and decode Unicode escapes
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    if (nameMatch) {
      let name = nameMatch[1];
      // Decode Unicode escape sequences
      name = name.replace(/\\u\{([0-9A-Fa-f]+)\}/g, (match, code) => {
        return String.fromCodePoint(parseInt(code, 16));
      });
      name = name.replace(/\\u([0-9A-Fa-f]{4})/g, (match, code) => {
        return String.fromCodePoint(parseInt(code, 16));
      });
      metadata.name = name;
    }

    // Extract description (handles minified code) and decode Unicode escapes
    const descMatch = content.match(/description:\s*["']([^"']+)["']/);
    if (descMatch) {
      let description = descMatch[1];
      // Decode Unicode escape sequences
      description = description.replace(
        /\\u\{([0-9A-Fa-f]+)\}/g,
        (match, code) => {
          return String.fromCodePoint(parseInt(code, 16));
        }
      );
      description = description.replace(
        /\\u([0-9A-Fa-f]{4})/g,
        (match, code) => {
          return String.fromCodePoint(parseInt(code, 16));
        }
      );
      metadata.description = description;
    }

    // Extract authors array
    const authorsMatch = content.match(/authors:\s*\[([\s\S]*?)\]/);
    if (authorsMatch) {
      try {
        // Parse the authors array from minified code
        const authorsCode = authorsMatch[1];
        const authors = [];

        // Extract author objects - handle properties in any order
        const authorObjMatches = authorsCode.matchAll(/\{[^}]+\}/g);

        for (const match of authorObjMatches) {
          const authorStr = match[0];
          const author = {};

          const nameMatch = authorStr.match(/name:\s*["']([^"']+)["']/);
          if (nameMatch) author.name = nameMatch[1];

          const descMatch = authorStr.match(/description:\s*["']([^"']+)["']/);
          if (descMatch) author.description = descMatch[1];

          const userIdMatch = authorStr.match(/userId:\s*["']([^"']+)["']/);
          if (userIdMatch) author.userId = userIdMatch[1];

          const avatarMatch = authorStr.match(/avatarUrl:\s*["']([^"']+)["']/);
          if (avatarMatch) author.avatarUrl = avatarMatch[1];

          if (author.name) authors.push(author);
        }

        if (authors.length > 0) {
          metadata.authors = authors;
        }
      } catch (e) {
        console.warn(
          `  ⚠ Failed to parse authors for ${pluginId}, using default`
        );
      }
    }

    // Note: build field is no longer extracted from plugin source
    // It's generated from file modification time above

    // Extract tags
    const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
    if (tagsMatch) {
      const tagsStr = tagsMatch[1];
      metadata.tags = tagsStr
        .split(",")
        .map((t) => t.trim().replace(/["']/g, ""))
        .filter((t) => t.length > 0);
    }

    return metadata;
  } catch (error) {
    console.error(`Error extracting metadata from ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Scan dist directory and build repository
 */
function buildRepository() {
  console.log("🔍 Scanning dist directory...");

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ Dist directory not found: ${DIST_DIR}`);
    console.log(`💡 Run 'npm run build' first to compile plugins`);
    process.exit(1);
  }

  // Read all files in dist directory
  const files = fs.readdirSync(DIST_DIR);
  const pluginFiles = files.filter((file) => {
    return file.endsWith(".js") && !EXCLUDE_FILES.includes(file);
  });

  console.log(`📦 Found ${pluginFiles.length} module files`);

  // Extract metadata from each plugin
  const plugins = [];
  for (const file of pluginFiles) {
    const filePath = path.join(DIST_DIR, file);
    const metadata = extractPluginMetadata(filePath, file);

    if (metadata) {
      plugins.push(metadata);
      console.log(`  ✓ ${metadata.name} (${metadata.id})`);
    } else {
      console.log(`  ✗ Failed to extract metadata from ${file}`);
    }
  }

  // Sort plugins by name
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  // Build repository object
  const repository = {
    name: "VRCX Plugin Repository",
    description: "Default repository for VRCX plugins",
    authors: [
      {
        name: "Bluscream",
        userId: "usr_08082729-592d-4098-9a21-83c8dd37a844",
        description: "VRCX Plugin System Maintainer",
      },
    ],
    build: Date.now().toString(),
    url: "https://github.com/vrcx-plugin-system/plugins",
    modules: plugins,
  };

  // Write to file
  try {
    fs.writeFileSync(REPO_FILE, JSON.stringify(repository, null, 2));
    console.log(`\n✅ Repository file created: ${REPO_FILE}`);
    console.log(`📊 Total modules: ${plugins.length}`);

    // Show tag breakdown
    const tagCount = {};
    plugins.forEach((p) => {
      p.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    if (Object.keys(tagCount).length > 0) {
      console.log(`\n🏷️  Tags: ${Object.keys(tagCount).length}`);
    }

    // Show enabled/disabled breakdown
    const enabledCount = plugins.filter((p) => p.enabled).length;
    const disabledCount = plugins.length - enabledCount;
    console.log(`🔌 Enabled: ${enabledCount}, Disabled: ${disabledCount}`);
  } catch (error) {
    console.error(`❌ Error writing repository file: ${error.message}`);
    process.exit(1);
  }
}

// Only run if called directly (not when required from build.js)
if (require.main === module) {
  console.log("🚀 Building repository from plugins...\n");
  buildRepository();
  console.log("\n✨ Done!");
} else {
  // Export for use in build.js
  module.exports = buildRepository;
}
