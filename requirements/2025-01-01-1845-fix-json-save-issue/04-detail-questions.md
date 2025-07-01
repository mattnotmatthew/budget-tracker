# Detail Questions

## Q6: Should Safari users see a "Save As" dialog each time they click save to choose where to overwrite their file?
**Default if unknown:** Yes (this provides true overwrite capability in Safari)

**Context:** Safari cannot write to arbitrary file locations without user permission. The only way to "overwrite" the original file is to prompt the user to select the save location each time, allowing them to choose the same file to overwrite it.

## Q7: Should the system remember the last save location per browser session for Safari users?
**Default if unknown:** Yes (improves UX by defaulting to previous save location)

**Context:** We could store the last used directory/filename in sessionStorage and pre-populate the save dialog, making it easier for users to consistently save to the same location.

## Q8: When Chrome/Edge users lose file handle connection (after browser inactivity), should they get the same "Save As" behavior as Safari users?
**Default if unknown:** Yes (consistent cross-browser experience for handle expiration)

**Context:** Currently Chrome/Edge shows a reconnection dialog, but we could standardize the experience to always show "Save As" when file handles are unavailable, regardless of browser.

## Q9: Should the save button be disabled or hidden when no file is currently loaded?
**Default if unknown:** No (allow saving to new file even without loading first)

**Context:** The current implementation allows saving even without a loaded file. We could restrict this or provide different save behavior based on whether a file is loaded.

## Q10: Should we preserve the exact original filename (including any file extensions) when saving in Safari?
**Default if unknown:** Yes (maintains file integrity and user expectations)

**Context:** The current code uses `currentFile.name` for downloads. We want to ensure the full filename including `.json` extension is preserved correctly in the save dialog.