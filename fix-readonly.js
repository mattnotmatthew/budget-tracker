const fs = require("fs");

// Read the file
let content = fs.readFileSync("./src/components/BudgetInput.tsx", "utf8");

// Replace all occurrences of {...getInputProps({})} with readOnly props
content = content.replace(
  /\{\.\.\. getInputProps\(\{\}\)\}/g,
  "readOnly={isReadOnly} disabled={isReadOnly} style={{ opacity: isReadOnly ? 0.7 : 1, backgroundColor: isReadOnly ? '#f5f5f5' : 'white', cursor: isReadOnly ? 'not-allowed' : 'text' }}"
);

// Write the file back
fs.writeFileSync("./src/components/BudgetInput.tsx", content);

console.log("Fixed all getInputProps references");
