const fs = require("fs");
const path = require("path");

console.log("🔧 Fixing logger error issues in all plugins...\n");

const pluginsDir = path.join(__dirname, "src/plugins");
const files = fs
  .readdirSync(pluginsDir)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => path.join(pluginsDir, f));

let totalFixed = 0;
let filesModified = 0;

files.forEach((file) => {
  const filename = path.basename(file);
  let content = fs.readFileSync(file, "utf8");
  const originalContent = content;
  let fileFixed = 0;

  // Pattern: this.logger.error("message:", error)
  // Replace with: const errorMsg = error instanceof Error ? error.message : String(error); this.logger.error("message: ${errorMsg}")

  // Find all occurrences
  const regex =
    /(\s+)(} catch \((error|err|e)\) \{)\s*\n(\s+)this\.logger\.(error|warn)\((["`])([^"`]+)\5,\s*(?:error|err|e)\);/g;

  content = content.replace(
    regex,
    (
      match,
      indent1,
      catchLine,
      errorVar,
      indent2,
      logMethod,
      quote,
      message
    ) => {
      fileFixed++;
      if (quote === '"') {
        return `${indent1}${catchLine}\n${indent2}const errorMsg = ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar});\n${indent2}this.logger.${logMethod}(\`${message}: \${errorMsg}\`);`;
      } else {
        return `${indent1}${catchLine}\n${indent2}const errorMsg = ${errorVar} instanceof Error ? ${errorVar}.message : String(${errorVar});\n${indent2}this.logger.${logMethod}(\`${message}: \${errorMsg}\`);`;
      }
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✓ ${filename}: Fixed ${fileFixed} instance(s)`);
    totalFixed += fileFixed;
    filesModified++;
  }
});

console.log(`\n========================================`);
console.log(
  `✓ Total: ${totalFixed} instances fixed across ${filesModified} files`
);
console.log(`========================================\n`);
