/**
 * Build script for VRCX plugins
 * Compiles TypeScript plugins from src/ to minified JavaScript in dist/
 *
 * Note: Build timestamps are managed in repo.json during the build-repo step,
 * not written to individual plugin files.
 *
 * Flags:
 *   --dev                    Build in development mode (no minification)
 */

const fs = require("fs");
const path = require("path");
const { build } = require("esbuild");

// Configuration
const SRC_DIR = path.join(__dirname, "src", "plugins");
const DIST_DIR = path.join(__dirname, "dist");
const isDev = process.argv.includes("--dev");

// Ensure directories exist
if (!fs.existsSync(SRC_DIR)) {
  console.error(`❌ Source directory not found: ${SRC_DIR}`);
  console.log(`\n💡 Create ${SRC_DIR} and add your TypeScript plugins there.`);
  process.exit(1);
}

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Build a single plugin
 * Note: Build timestamps are now managed in repo.json, not in plugin source files
 */
async function buildPlugin(fileName) {
  const inputFile = path.join(SRC_DIR, fileName);
  const outputFile = path.join(DIST_DIR, fileName.replace(/\.ts$/, ".js"));

  try {
    await build({
      entryPoints: [inputFile],
      outfile: outputFile,
      bundle: false, // Don't bundle - each plugin is standalone
      minify: !isDev, // Minify in production mode
      target: "es2020",
      format: "iife", // Immediately Invoked Function Expression
      platform: "browser",
      sourcemap: false,
      legalComments: "none",
      keepNames: true, // Keep class/function names for debugging
      logLevel: "warning",
    });

    const stats = fs.statSync(outputFile);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(
      `  ✓ ${fileName} → ${outputFile.split(path.sep).pop()} (${sizeKB} KB)`
    );
    return true;
  } catch (error) {
    console.error(`  ✗ ${fileName}: ${error.message}`);
    return false;
  }
}

/**
 * Build all plugins
 */
async function buildAll() {
  const mode = isDev ? "development" : "production";
  console.log(`🔨 Building plugins (${mode} mode)...\n`);

  // Read all TypeScript files in src directory
  const files = fs.readdirSync(SRC_DIR);
  const pluginFiles = files.filter((file) => file.endsWith(".ts"));

  if (pluginFiles.length === 0) {
    console.warn("⚠️ No TypeScript plugin files found in src/");
    return;
  }

  console.log(`📦 Found ${pluginFiles.length} plugin file(s)\n`);

  // Build each plugin
  let successCount = 0;
  let failCount = 0;

  for (const file of pluginFiles) {
    const success = await buildPlugin(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  console.log(`\n✨ Build complete!`);
  console.log(`  ✓ Success: ${successCount}`);
  if (failCount > 0) {
    console.log(`  ✗ Failed: ${failCount}`);
  }
  console.log(`  📁 Output: ${DIST_DIR}`);

  // Build repo.json after building plugins
  console.log(`\n🔄 Building repository metadata...`);
  try {
    require("./build-repo.js");
  } catch (error) {
    console.error(`❌ Failed to build repo.json: ${error.message}`);
  }
}

// Run the build
buildAll().catch((error) => {
  console.error("❌ Build failed:", error);
  process.exit(1);
});
