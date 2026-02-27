import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const distDir = "dist";
const publicDir = "public";

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy extension files
const extensionFiles = [
  "manifest.json",
  "extension/background.js",
  "extension/content.js",
];

extensionFiles.forEach((file) => {
  const src = join(publicDir, file);
  const dest = join(distDir, file);

  if (existsSync(src)) {
    // Ensure destination directory exists
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  } else {
    console.warn(`Warning: ${file} not found in public/`);
  }
});

console.log("Extension files copied successfully!");
