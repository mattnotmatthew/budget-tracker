# Discovery Answers

## Q1: Are you using a Chromium-based browser (Chrome/Edge) when experiencing this issue?
**Answer:** No - using Safari
**Note:** User clarified they're using Safari, but also testing with Chrome/Edge

## Q2: Do you want the system to overwrite the original file in place rather than downloading new copies?
**Answer:** Yes

## Q3: Are you opening files using the "Load from File" button in the File Manager?
**Answer:** Yes
**Note:** User also uses first-time setup functionality depending on testing scenario

## Q4: Should the save function work consistently across all browsers (Chrome, Firefox, Safari)?
**Answer:** Yes, but priority is Chrome and Edge

## Q5: When you click save, do you expect it to work silently without showing file dialogs?
**Answer:** Yes

## Summary
- Primary issue occurs in Safari (no File System Access API)
- User wants true "save" behavior (overwrite original) not "save as" (new files)
- Uses both file loading methods depending on testing
- Cross-browser support needed with Chrome/Edge priority
- Silent save preferred without additional dialogs