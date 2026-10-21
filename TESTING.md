# Validation — October 21, 2026

Browser: Chromium 154.0.8037.57, Playwright, loopback HTTP serving the exact single-file build. No Edge installation is available. File URL startup is blocked by managed browser policy; no bypass was attempted.

## Workflow checks

`tests/workflows.cjs`

- Creates candidates and roles; Screening does not set a submission date.
- Prevents duplicate candidate-role relationships; allows independent stages for multiple roles.
- Notes preserve other unsaved valid edits; markup is rendered as text.
- Pipeline reminders complete into a retained task/history event; reopen and snooze.
- IndexedDB save/read/reload, profile autosave, recovery of incomplete required fields.
- Archive hides linked pipeline records and restore returns them.
- Text profile review and explicit duplicate update preserve one candidate.
- Invalid backups rejected without data change; export/import round-trip preserves state and history.
- Stage drag/undo; no browser page errors or external HTTP requests.
- Version 1 migration with 1,500 records; 40 cards initially per stage, 50 table rows per page; search, reorder and reload.
- Database blocked → fallback saving and reload; all writes blocked → visible in-memory-only warning.

`tests/documents.cjs`

- Actual locally generated DOCX and PDF fixtures extract expected name/contact/skills.
- Image-only PDF produces an OCR/text-copy warning.
- No external document-processing requests.
- Records the managed file-URL block separately from workflow results.

`tests/safety.cjs`

- Two tabs loaded at the same revision: stale writes are refused, latest saved records remain.
- Delete cancel/confirm/persistence.
- Actual file-drop handler, and corrupted primary saved data cannot be silently overwritten.
- Incomplete pipeline form recovery without premature candidate-job creation.
- 390-pixel viewport has no page-wide horizontal overflow; board itself scrolls horizontally.

Test data is synthetic and only exists in isolated browser contexts and test fixtures. No demo candidates are embedded in the delivered app. Screenshots show test data, not user records.

## Practical limits

These tests are functional checks, not a guarantee of durability under browser/company policies or proof that all memory leaks are eliminated. The 1,500-record check validates bounded rendering, not an extensive performance benchmark. A real migration with the user's current exported data is still pending their file. Current user candidate records were not imported or modified.

## Pipeline stage update — kdesk 2.1

`tests/stages.cjs` verifies the exact nine-column order, new-stage drag/reload and timestamped history, independent candidate-role stages, Not Proceeding exclusion from active metrics/pipeline follow-ups, restoration of reminders when reopened, filters, undo, backup export/import, and stage options in creation/edit forms. Existing version 1 Rejected records are preserved. The original workflow suite also passes after this change.
