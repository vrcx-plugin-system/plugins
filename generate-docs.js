const fs = require("fs");
const path = require("path");

console.log("📚 Generating plugin documentation...\n");

const pluginsDir = path.join(__dirname, "src/plugins");
const plugins = fs
  .readdirSync(pluginsDir)
  .filter((f) => f.endsWith(".ts") && !f.endsWith("-test.ts"))
  .map((f) => path.join(pluginsDir, f));

let docsCreated = 0;

plugins.forEach((filepath) => {
  const filename = path.basename(filepath);
  const content = fs.readFileSync(filepath, "utf8");

  // Extract metadata
  const nameMatch = content.match(/name:\s*["`]([^"`]+)["`]/);
  const descMatch = content.match(/description:\s*["`]([^"`]+)["`]/);
  const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);
  const depsMatch = content.match(/required_dependencies:\s*\[([^\]]+)\]/);
  const optDepsMatch = content.match(/optional_dependencies:\s*\[([^\]]+)\]/);
  const authorMatch = content.match(
    /name:\s*["`]([^"`]+)["`][^}]*userId:\s*["`]([^"`]+)["`]/
  );

  const pluginId = filename.replace(".ts", "");
  const name = nameMatch ? nameMatch[1] : pluginId;
  const description = descMatch ? descMatch[1] : "No description available";
  const tags = tagsMatch ? tagsMatch[1].replace(/["'\s]/g, "").split(",") : [];
  const deps = depsMatch
    ? depsMatch[1]
        .replace(/["'\s]/g, "")
        .split(",")
        .filter(Boolean)
    : [];
  const optDeps = optDepsMatch
    ? optDepsMatch[1]
        .replace(/["'\s]/g, "")
        .split(",")
        .filter(Boolean)
    : [];
  const author = authorMatch ? authorMatch[1] : "Unknown";

  // Extract action buttons
  const actionButtons = [];
  const actionButtonRegex =
    /{\s*title:\s*["`]([^"`]+)["`][^}]*description:\s*["`]([^"`]+)["`]/g;
  let match;
  while ((match = actionButtonRegex.exec(content)) !== null) {
    actionButtons.push({ title: match[1], description: match[2] });
  }

  // Extract settings
  const settings = [];
  const settingsRegex =
    /(\w+):\s*{\s*type:\s*SettingType\.(\w+)[^}]*description:\s*["`]([^"`]+)["`][^}]*default:\s*([^,}]+)/g;
  while ((match = settingsRegex.exec(content)) !== null) {
    settings.push({
      name: match[1],
      type: match[2],
      description: match[3],
      default: match[4].trim(),
    });
  }

  // Determine category
  let category = "Feature Plugin";
  if (tags.includes("API")) category = "Core API";
  else if (tags.includes("Test")) category = "Test Plugin";
  else if (tags.includes("Utility") || tags.includes("Tool"))
    category = "Utility";

  // Generate markdown
  let md = `# ${name}\n\n${description}\n\n## Overview\n\n`;
  md += `| Property | Value |\n|----------|-------|\n`;
  md += `| **ID** | \`${pluginId}\` |\n`;
  md += `| **Category** | ${category} |\n`;
  md += `| **Tags** | ${tags.join(", ")} |\n`;
  if (deps.length > 0)
    md += `| **Required Dependencies** | ${deps
      .map((d) => `\`${d}\``)
      .join(", ")} |\n`;
  if (optDeps.length > 0)
    md += `| **Optional Dependencies** | ${optDeps
      .map((d) => `\`${d}\``)
      .join(", ")} |\n`;
  md += `| **Author** | ${author} |\n\n`;

  if (actionButtons.length > 0) {
    md += `## Action Buttons\n\n`;
    md += `| Button | Description |\n|--------|-------------|\n`;
    actionButtons.forEach((btn) => {
      md += `| **${btn.title}** | ${btn.description} |\n`;
    });
    md += `\n`;
  }

  if (settings.length > 0) {
    md += `## Settings\n\n`;
    md += `| Setting | Type | Default | Description |\n|---------|------|---------|-------------|\n`;
    settings.forEach((s) => {
      md += `| \`${s.name}\` | ${s.type} | \`${s.default}\` | ${s.description} |\n`;
    });
    md += `\n`;
  }

  md += `## Usage\n\n`;
  md += `\`\`\`javascript\n`;
  md += `// Get the plugin instance\n`;
  md += `const plugin = window.customjs.getModule('${pluginId}');\n\n`;
  md += `// Check if loaded\n`;
  md += `if (plugin && plugin.enabled) {\n`;
  md += `  console.log('${name} is running');\n`;
  md += `}\n`;
  md += `\`\`\`\n\n`;

  md += `## Source Files\n\n`;
  md += `| File | Description |\n|------|-------------|\n`;
  md += `| \`${filename}\` | TypeScript source |\n`;
  md += `| \`${pluginId}.js\` | Compiled JavaScript |\n`;

  const mdPath = filepath.replace(".ts", ".md");
  fs.writeFileSync(mdPath, md, "utf8");
  console.log(`✓ ${filename} → ${path.basename(mdPath)}`);
  docsCreated++;
});

console.log(`\n✅ Generated ${docsCreated} plugin documentation files\n`);
