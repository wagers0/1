# kdesk 2.1 — local recruiting workspace

A single-file, offline recruiting workspace. **Open `dist/kdesk.html` in Microsoft Edge. No installation, server, account, API key, or external network dependency is required by the application.** Browser/company policies may still restrict local files or storage.

## Move from the earlier app

1. In your existing app, click **Export Backup**. Keep both the JSON backup and the old HTML file.
2. Save/open the complete `dist/kdesk.html` file in Edge. This replaces the patch-based build; do not paste it into the old file.
3. Click **Import Backup**, select the exported JSON, review the record counts, and confirm replacement. This is a replacement, not a merge.
4. Check the candidates, jobs, stages, notes, and archived records. Make a harmless edit, wait for **Saved on this device**, close and reopen the same file path in the same Edge profile, and check the edit.
5. Keep a consistent file location. Export regular backups; browser storage can be cleared by browser settings or company policies.

The app can offer to copy an earlier `recruiter-desk.state.v1` localStorage workspace if the browser exposes it at the current file origin. An explicit fresh JSON export is preferable: this clean build does not automatically read the previous application's separate recovery database. The old app's storage key is not overwritten. The user's actual HTML and current backup were not supplied for this rebuild, so migration was verified using representative version 1 fixtures, not their live data.

## Pipeline columns

Screening → Ready to Submit → Submitted → Interviewing → Waiting On Feedback → Offer → Onboarding → Placed → Not Proceeding.

Not Proceeding retains the candidate, linked record, and history. It is excluded from the active pipeline metric and automatic pipeline follow-up queue. Standalone follow-ups remain independent. Moving a card back to an eligible stage restores its scheduled pipeline next action. Existing On Hold, Rejected, and Withdrawn records remain unchanged in the separate outcomes section. New stages work in dropdowns, filters, forms, drag/reorder, history, undo, and backups. Backups containing these stages need this version or later; older builds do not recognize the new stage names.

## What changed

- One maintained application, no appended feature patches or brand-replacement observers.
- Charcoal/cyan kdesk styling, compact sidebar, workspace metrics, consistent forms, sortable pipeline positions, searchable and paginated record tables, bench cards/list, mobile layout.
- **Add to pipeline** starts at **Screening**. Adding a card does not imply client submission; actual submission date remains blank until entered. A job is still required for a pipeline card.
- Independent candidate/role stages, timestamped notes/stage history, undo, and keyboard-accessible stage menus / reorder buttons.
- Bulk select/archive/restore/delete. Archive retains linked data; delete shows counts and requires confirmation.
- **Follow-ups** collects open pipeline next actions plus standalone reminders. Due today/overdue/upcoming/undated/completed filters; complete, reopen, snooze until tomorrow. Completing a pipeline next action logs history and retains a completed task. Reopening that task creates an open standalone reminder rather than overwriting a newer pipeline next action.
- **Import profiles** accepts PDF, DOCX, TXT or pasted text. All extraction runs locally. Review suggested fields and source text; duplicate matching uses email, phone, LinkedIn, or exact name. Duplicate updates require explicit review and confirmation. Updating a candidate preserves other profile fields and pipeline relationships. No automatic qualification/rating, outreach, submission, or AI call.
- IndexedDB primary persistence, localStorage fallback if database saving fails, serialized writes, revision checks against conflicting tabs, error states, exportable in-memory records, recoverable record/pipeline drafts.
- Existing profiles autosave after a short pause; new records require Create. Import review requires Save reviewed profile. Unsaved notes require Add note and can remain as drafts.
- Debounced search and editing; indexed candidate/role lookups; initial 40 cards per stage and 50 candidates/roles per page. Show more/pagination retains all records in storage.
- Version 1 Recruiter Desk backup import; version 2 export includes tasks. Earlier app builds do not understand the new tasks.

## Known limits

- Not hosted, no AI integration or company connections. No notifications while the app is closed; reminders appear inside the app.
- No OCR/scanned-PDF extraction and no legacy `.doc` parsing. Use text-based PDFs or save Word files as DOCX. Maximum 10 files per batch, 10 MB per file, 60 PDF pages, 200,000 extracted characters per profile. Word archives with more than 30 MB declared expanded data are rejected.
- Extraction is heuristic and can misread names, columns, skills or contact fields. Always review against source text. No remote font/CMap resources are loaded; some unusual PDF encodings may need a text/DOCX copy.
- The original binary document is not retained; reviewed source text and filename are. No document-preview uploads or external links are opened automatically.
- At most one recoverable record/pipeline draft is kept. Finish or recover it before editing another record. Import review is not a durable multi-file draft queue.
- Source text adds backup/storage size. Backups are plain JSON; handle them as recruiting records.
- Same-origin IndexedDB writes have conflict checks. localStorage fallback is best-effort and does not have transactional locking; use one tab when fallback mode is shown.
- If all browser storage is blocked/full, changes remain in memory and the app displays a warning. Export before closing. Nothing can make policy-blocked storage durable.
- User's restricted Edge/local-file behavior remains unverified. Managed Chromium in this environment rejects `file://` with `ERR_BLOCKED_BY_ADMINISTRATOR`. Tests use a temporary loopback HTTP server; the delivered app contains no server requirement and no external requests. No policy was bypassed.

## Source and build

`src/model.js` — record schema, validation, migration, duplicates, stage movement.
`src/storage.js` — storage, revisions, fallback, drafts.
`src/importer.js` — local PDF/Word/text extraction.
`src/app.js` — views and interactions.
`src/styles.css`, `src/shell.html` — interface.
`build.cjs` — embeds styles, bundled application and PDF worker into one HTML file.

Developer-only commands (not required on the user's computer):

```
npm ci
npm run build
npm test
```

Build dependencies are pinned in package-lock.json. See THIRD_PARTY_NOTICES.md. `dist/kdesk.html` is the complete deliverable.

## Design references

Comparable application patterns, not copied assets or a claim of affiliation:

- Salesforce Lightning Design System: record lists, clear field labels and consistent action placement — https://www.lightningdesignsystem.com/
- Jira / Atlassian Design System: stage columns, counts, workflow controls — https://atlassian.design/components/
- Linear: compact navigation and restrained visual hierarchy — https://linear.app/

These were used as familiar design references. Live reference pages could not be retrieved from this environment (proxy returned 403); no current-page audit is claimed. kdesk uses original CSS and a simple original monogram with colors inspired by the user-provided Kforce logo.
