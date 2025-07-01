# Discovery Questions

## Q1: Are you using a Chromium-based browser (Chrome/Edge) when experiencing this issue?
**Default if unknown:** Yes (File System Access API behavior differs between browsers)

**Why this matters:** The codebase uses File System Access API for direct file saving in Chrome/Edge, but falls back to download method in Firefox/Safari. The behavior differs significantly between these paths.

## Q2: Do you want the system to overwrite the original file in place rather than downloading new copies?
**Default if unknown:** Yes (most users expect save to update the existing file)

**Why this matters:** True "save" functionality vs "save as" functionality affects the implementation approach and user experience expectations.

## Q3: Are you opening files using the "Load from File" button in the File Manager?
**Default if unknown:** Yes (this affects how file handles are established)

**Why this matters:** How the file is initially loaded determines what save capabilities are available and whether file handles are properly established.

## Q4: Should the save function work consistently across all browsers (Chrome, Firefox, Safari)?
**Default if unknown:** Yes (cross-browser compatibility is typically expected)

**Why this matters:** File System Access API limitations in non-Chromium browsers may require different UX patterns or workarounds.

## Q5: When you click save, do you expect it to work silently without showing file dialogs?
**Default if unknown:** Yes (seamless save experience is preferred)

**Why this matters:** Determines whether we need to implement true file handle persistence vs showing save dialogs each time.