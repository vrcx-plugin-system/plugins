const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing all remaining logger error issues...\n");

const fixes = [
  "auto-disable-untrusted-urls.ts",
  "avatar-log.ts",
  "context-menu-api.ts",
  "dialog-api.ts",
  "invite-message-api.ts",
  "monitor-invisibleplayers.ts",
  "nav-menu-api.ts",
  "plugin-analyzer.ts",
  "plugin-manager-ui.ts",
  "registry-overrides.ts",
  "retry-auto-login.ts",
  "start-game-button.ts",
  "tag-manager.ts",
  "yoinker-detector.ts",
];

let totalFixed = 0;

fixes.forEach((filename) => {
  const filepath = path.join(__dirname, "src/plugins", filename);
  let content = fs.readFileSync(filepath, "utf8");
  let fileFixed = 0;

  // Fix: this.logger.error("message", error);
  content = content.replace(
    /(\s+)(this\.logger\.(error|warn))\("([^"]+)",\s*(error|err|e)\);/g,
    (match, indent, loggerCall, method, message, errorVar) => {
      fileFixed++;
      return `${indent}const errorMsg = ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar});\n${indent}${loggerCall}(\`${message}: \${errorMsg}\`);`;
    }
  );

  // Fix: this.logger.error(`message`, error);
  content = content.replace(
    /(\s+)(this\.logger\.(error|warn))\(`([^`]+)`,\s*(error|err|e)\);/g,
    (match, indent, loggerCall, method, message, errorVar) => {
      fileFixed++;
      return `${indent}const errorMsg = ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar});\n${indent}${loggerCall}(\`${message}: \${errorMsg}\`);`;
    }
  );

  if (fileFixed > 0) {
    fs.writeFileSync(filepath, content, "utf8");
    console.log(`✓ ${filename}: Fixed ${fileFixed} instance(s)`);
    totalFixed += fileFixed;
  }
});

console.log(`\n========================================`);
console.log(
  `✓ Total: ${totalFixed} instances fixed across ${fixes.length} files`
);
console.log(`========================================\n`);
