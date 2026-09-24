import ts from "typescript";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, ".test-runtime", "test-run");
for (const source of ["config/outlets.ts", "lib/feedback.ts", "lib/email.ts", "lib/runtime-env.ts", "lib/http-security.ts", "tests/feedback.test.ts", "tests/outlets.test.ts"]) {
  const target = path.join(output, source.replace(/\.ts$/, ".js"));
  mkdirSync(path.dirname(target), { recursive: true });
  const compiled = ts.transpileModule(readFileSync(path.join(root, source), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  writeFileSync(target, compiled.outputText);
}
writeFileSync(path.join(output, "package.json"), '{"type":"commonjs"}');
const result = spawnSync(process.execPath, ["--test", path.join(output, "tests/feedback.test.js"), path.join(output, "tests/outlets.test.js")], { stdio: "inherit" });
process.exit(result.status ?? 1);

