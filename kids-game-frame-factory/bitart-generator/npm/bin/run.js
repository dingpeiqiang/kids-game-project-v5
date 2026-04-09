#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");

// 检测 Windows 平台
const isWindows = process.platform === "win32";
const binaryName = isWindows ? "bitart.exe" : "bitart";
const binary = path.join(__dirname, binaryName);

try {
  execFileSync(binary, process.argv.slice(2), { stdio: "inherit" });
} catch (e) {
  if (e.status !== null) {
    process.exit(e.status);
  }
  console.error("Failed to run bitart:", e.message);
  process.exit(1);
}
