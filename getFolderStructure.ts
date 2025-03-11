import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
//eslint-disable-next-line
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, "folder-structure.txt");

// Function to get folder structure in a tree format
const getFolderStructure = (dir: string, prefix: string = ""): string => {
  let structure = "";
  const files = fs
    .readdirSync(dir)
    .filter((file) => file !== "node_modules" && !file.startsWith("."));

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const isDirectory = fs.statSync(fullPath).isDirectory();
    const isLast = index === files.length - 1;

    // Use tree characters
    const newPrefix = prefix + (isLast ? "└── " : "├── ");
    structure += `${newPrefix}${file}\n`;

    if (isDirectory) {
      const nextPrefix = prefix + (isLast ? "    " : "│   ");
      structure += getFolderStructure(fullPath, nextPrefix);
    }
  });

  return structure;
};

// Generate and save the tree structure
console.log("Generating folder structure...");
const structure = "Project Folder Structure:\n" + getFolderStructure(__dirname);
fs.writeFileSync(OUTPUT_FILE, structure);

console.log(`Folder structure saved to ${OUTPUT_FILE}`);
