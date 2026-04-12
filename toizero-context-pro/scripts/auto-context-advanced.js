const fs = require("fs");
const fg = require("fast-glob");
const path = require("path");

function read(file) {
  try { return fs.readFileSync(file, "utf-8") } catch { return "" }
}

function extractImports(content) {
  const imports = new Set();
  
  // import ... from "..." or export ... from "..."
  const regexFrom = /from\s+['"](.*?)['"]/g;
  let m;
  while ((m = regexFrom.exec(content))) imports.add(m[1]);

  // require("...")
  const regexRequire = /require\s*\(\s*['"](.*?)['"]\s*\)/g;
  while ((m = regexRequire.exec(content))) imports.add(m[1]);

  // import("...") or import "..."
  const regexImport = /import\s*\(?\s*['"](.*?)['"]\s*\)?/g;
  while ((m = regexImport.exec(content))) imports.add(m[1]);

  return Array.from(imports);
}

function extractExports(content) {
  const exportsList = new Set();
  // export const/let/var/function/class/type/interface X
  const regexExport = /export\s+(?:default\s+)?(?:const|let|var|function|class|type|interface)\s+([a-zA-Z0-9_]+)/g;
  let m;
  while ((m = regexExport.exec(content))) {
    exportsList.add(m[1]);
  }
  return Array.from(exportsList);
}

async function main() {
  const rootDir = path.resolve(__dirname, "../../");
  const files = await fg(["backend/src/**/*.ts", "frontend/src/**/*.{ts,tsx}"], { cwd: rootDir });

  let graph = {};
  let output = ["# ADVANCED CONTEXT\n"];

  for (const f of files) {
    const absolutePath = path.join(rootDir, f);
    const c = read(absolutePath);
    
    const deps = extractImports(c);
    const exportsList = extractExports(c);

    graph[f] = { deps, exports: exportsList };

    output.push("## " + f);
    if (exportsList.length) output.push("Exports: " + exportsList.join(", "));
    if (deps.length) output.push("Depends on: " + deps.join(", "));
    output.push("");
  }

  // Save in the toizero-context-pro folder
  const outputDir = path.resolve(__dirname, "..");
  fs.writeFileSync(path.join(outputDir, "dependency-graph.json"), JSON.stringify(graph, null, 2));
  fs.writeFileSync(path.join(outputDir, ".context-advanced.txt"), output.join("\n"));

  console.log("Advanced context + dependency graph generated at: " + outputDir);
}

main();
