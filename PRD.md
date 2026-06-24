# Nucleic Acid QC Auditor — Product Requirements Document

## Overview

A stateless, client-side single-page web app for laboratory researchers. Accepts CSV exports from NanoDrop or Qubit fluorometers, automatically detects the instrument format, applies configurable QC thresholds, and presents pass/fail results in a professional dark-themed UI. All sample data is processed entirely in the browser — no data is ever transmitted to a server.

**Intended use:** Research support tool. Not a clinical or compliance-certified device.

---

## Scope

### In v1
- NanoDrop (classic 1000/2000 format) CSV parser
- Qubit 4 (standard format) CSV parser
- Auto-detection of instrument format from column headers, with manual fallback dropdown
- Configurable QC thresholds (editable in UI per-session; reset to defaults on page refresh)
- Per-sample nucleic acid type (DNA/RNA) via CSV column or batch-level modal
- Full-width results table: sticky header, dark clinical theme, status badges
- CSV download of results (original columns + QC flag columns appended)
- PDF report download (header block + results table + disclaimer footer)
- In-memory per-session audit log, downloadable as CSV
- Dismissible first-load disclaimer banner + persistent footer disclaimer
- Security headers via `vercel.json`
- Deployed to Vercel (free tier, auto-deploy from GitHub)

### Out of v1
- Authentication, accounts, or user management
- Persistent sample database
- Additional instrument parsers beyond NanoDrop + Qubit
- Multi-file batch processing
- Server-side processing of any kind
- localStorage persistence (thresholds, audit log, banner dismissal)
- Rate limiting or abuse protection (no backend attack surface)

---

## Input Formats & Detection Logic

### NanoDrop (classic 1000/2000)

| Column name | Required? | Notes |
|---|---|---|
| Sample ID | Yes | Row identifier |
| Sample Name | No | Optional label |
| Nucleic acid conc. (ng/uL) | Yes | Concentration metric |
| A260 10mm | Yes | Absorbance reading |
| A280 10mm | Yes | Absorbance reading |
| 260/280 | Yes | **Detection key** |
| 260/230 | Yes | **Detection key** |

**Detection rule:** File headers contain both `"260/280"` AND `"260/230"` → NanoDrop format.

### Qubit 4 (standard)

| Column name | Required? | Notes |
|---|---|---|
| Test Name | No | Assay type label |
| Sample ID | Yes | Row identifier |
| Original sample conc. | Yes | **Detection key** |
| Units | No | Unit of concentration |
| Dilution factor | No | Dilution applied |
| Qubit tube conc. | Yes | **Detection key** |

**Detection rule:** File headers contain `"Qubit tube conc."` OR `"Original sample conc."` → Qubit format. Qubit detection is checked first (more distinctive columns).

**Note on Qubit variants:** Column names may vary slightly by assay (dsDNA/RNA/protein). Detection keys `"Qubit tube conc."` and `"Original sample conc."` cover the common cases. Unrecognized variants trigger the unrecognized-format error path.

### Auto-detection flow

1. Check Qubit signatures first; if matched → Qubit parser.
2. If not Qubit, check NanoDrop signatures; if matched → NanoDrop parser.
3. If neither matched → show manual format selector dropdown.
4. If user selects a format but the required columns are still absent → file-level error.

### Normalized internal structure (parser output)

All parsers produce an array of `NormalizedSample` objects:

```ts
interface NormalizedSample {
  sampleId: string;
  sampleName: string | null;
  concentration: number | null;   // ng/µL
  ratio260_280: number | null;    // NanoDrop only
  ratio260_230: number | null;    // NanoDrop only
  naType: "DNA" | "RNA" | null;   // resolved per-row or from batch modal
  source: "nanodrop" | "qubit";
  rawRow: Record<string, string>; // original CSV row for error display
  rowIndex: number;
  errors: string[];               // row-level parse errors
}
```

---

## Nucleic Acid Type Resolution (NanoDrop)

1. Check file headers (case-insensitive) for: `"Nucleic Acid Type"`, then `"Sample Type"`, then `"NA Type"` (in that priority order).
2. If a column is found: read per-row. Accepted values (case-insensitive): `"DNA"`, `"RNA"`. Any other value → row-level error `"Unrecognized nucleic acid type: <value>"`.
3. If no matching column is found: show a batch-level modal before processing. User selects DNA or RNA; all rows in the file use that value. This is the common case — NanoDrop's standard export does not include a sample-type column.
4. No ambiguity category: every sample is definitively DNA or RNA.

---

## QC Logic

### NanoDrop QC rules

| Metric | Condition | Classification |
|---|---|---|
| A260/280 | ≥ 1.7 (DNA) / ≥ 1.9 (RNA) | PASS |
| A260/280 | < 1.7 (DNA) / < 1.9 (RNA) | FAIL |
| A260/230 | ≥ 1.5 | PASS |
| A260/230 | < 1.5 | FAIL |
| Concentration | ≥ threshold (default 10 ng/µL) | — informational only |
| Concentration | < threshold (default 10 ng/µL) | LOW YIELD (not a QC FAIL) |

**Overall sample status:**
- **PASS**: A260/280 PASS AND A260/230 PASS
- **FAIL**: Either ratio fails
- **LOW YIELD** badge: shown independently of PASS/FAIL (a sample can be PASS + LOW YIELD simultaneously)

### Qubit QC rules

| Metric | Condition | Classification |
|---|---|---|
| Qubit tube conc. | ≥ threshold (default 1 ng/µL) | PASS |
| Qubit tube conc. | < threshold | FAIL |
| Qubit tube conc. | string value: "Out of range" / "TOO LOW" / "TOO HIGH" | FAIL |

### Configurable thresholds

Accessible via a settings panel (header button). Session-only — no persistence. "Reset to defaults" restores all values.

| Setting | Default |
|---|---|
| A260/280 DNA minimum | 1.7 |
| A260/280 RNA minimum | 1.9 |
| A260/230 minimum | 1.5 |
| NanoDrop LOW YIELD concentration threshold | 10 ng/µL |
| Qubit concentration minimum | 1 ng/µL |

---

## Output Format

### On-screen results table
- Summary stats bar at top: **Total | Passed | Failed | Low Yield | Errors**
- Full-width table with sticky header
- Columns: Sample ID · Sample Name · Source · NA Type · Conc. (ng/µL) · 260/280 · 260/230 · Status · Low Yield · Notes
- Status badges: PASS (#52c47a green) · FAIL (#e05252 red) · ERROR (#e0a052 amber)
- LOW YIELD shown as a separate badge, independent of PASS/FAIL status
- Error rows: inline ERROR badge + tooltip on hover describing the specific issue
- Summary banner when errors are present: "X rows could not be evaluated and are shown with ERROR status below."

### CSV download
- All original columns from the uploaded file, plus appended columns: `qc_status`, `low_yield`, `ratio_260_280_status`, `ratio_260_230_status`, `qc_notes`
- Filename: `<original-filename>-qc-results.csv`

### PDF report
- Header block: App name · Filename · Upload timestamp · Total samples · Passed · Failed · Low Yield
- Full results table (same columns as on-screen)
- Footer: full disclaimer text
- Filename: `<original-filename>-qc-report.pdf`

---

## Error Handling

### File-level errors (block all processing — show full error panel, no partial results)
- File extension is not `.csv`
- File is not parseable as CSV
- File is empty or has no data rows after the header
- Format is unrecognized (auto-detection failed AND manual selection still finds missing required columns)
- Required columns are absent for the identified format

### Row-level errors (show inline ERROR status — valid rows are still processed normally)
- Missing required field value (e.g., blank concentration cell)
- Non-numeric value in a numeric field
- Unrecognized nucleic acid type value in the type column
- Duplicate Sample ID — all affected rows are flagged; tooltip: `"Duplicate Sample ID — also appears at row N"`

**Duplicate handling:** All duplicate rows are shown with ERROR status. No silent deduplication.

---

## Audit Log Behavior

- **Storage:** In-memory only. Resets on page refresh. No localStorage, no server.
- **Scope:** Accumulates across all files processed in the current browser session.
- **Record fields** (one record per file processed, even on error):
  - Timestamp (ISO 8601)
  - Filename
  - Detected format (`nanodrop` | `qubit` | `unknown`)
  - Total rows attempted
  - Rows successfully parsed
  - Rows with QC FAIL status
  - Rows with LOW YIELD flag
  - Rows with ERROR status
  - File-level error message (if applicable)
- **Download:** "Download audit log" button in header, always visible. Exports session log as CSV.

---

## Disclaimer Language

**Exact text:**
> This tool is for research support only. It is not a clinical or compliance-certified device. All outputs must be independently verified by qualified personnel before use in any regulated context.

**Display:**
1. **Dismissible banner** on first page load each session (no localStorage — appears on every page load). Dismissed per-session by clicking ✕.
2. **Persistent footer** on every page view (non-dismissible).

---

## Styling Direction

**Theme:** Clinical/scientific dark theme — lab instrument interface aesthetic.

| Design token | Value |
|---|---|
| Background | `#0f1117` |
| Surface | `#1a1d27` |
| Accent (interactive) | `#00c896` (teal-green) |
| PASS | `#52c47a` |
| FAIL | `#e05252` |
| LOW YIELD / WARN / ERROR | `#e0a052` |
| Body text | `#e2e8f0` |
| Muted text | `#64748b` |
| Body font | Inter (self-hosted) |
| Data/mono font | IBM Plex Mono (self-hosted) |

**Layout:** Full-width table, sticky header, no card grid, no shadows on data rows. Summary stats bar above table. Settings panel as modal/drawer overlay. Dense, data-forward. Subtle teal glow on active/accent elements.

**Fonts are self-hosted** (npm `@fontsource` packages) — no Google Fonts CDN call, zero external network requests, `font-src 'self'` in CSP.

---

## Hosting Target

**Platform:** Vercel (primary), Netlify (fallback).
**Deploy method:** GitHub repo connected to Vercel; auto-deploys on push to `main`. Free tier.
**Build:** React 18 + TypeScript + Vite. Static output.

### Security headers (`vercel.json`)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Security considerations
- **Client-side only:** All processing (CSV parsing, QC evaluation, PDF/CSV generation) runs entirely in the browser. No sample data is ever sent to a server, logged server-side, or transmitted to any third-party API or analytics service. `connect-src 'none'` enforces this at the CSP level.
- **No secrets:** App has no backend; no API keys or credentials exist in the codebase.
- **File validation:** Check `.csv` extension AND attempt CSV parse; reject invalid files with a file-level error before any QC processing.
- **Dependency audit:** Run `npm audit` before final deploy; fix any high/critical vulnerabilities.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| CSV parsing | Papa Parse |
| PDF generation | jsPDF + jspdf-autotable |
| Styling | Tailwind CSS v3 (custom dark theme) |
| Fonts | `@fontsource/inter`, `@fontsource/ibm-plex-mono` (self-hosted) |
| Deployment | Vercel |

---

## Definition of Done

- [ ] Upload a NanoDrop CSV → auto-detected, parsed, QC applied, results table rendered
- [ ] Upload a Qubit CSV → auto-detected, parsed, QC applied, results table rendered
- [ ] Upload a file with missing required columns → file-level error shown, no partial results
- [ ] Upload a file with bad rows → valid rows processed, bad rows show inline ERROR with tooltip
- [ ] Upload a NanoDrop CSV with no nucleic acid type column → batch-level modal appears, user picks DNA or RNA, QC runs with correct thresholds
- [ ] Adjust a threshold in settings panel → results re-evaluate with new values
- [ ] Reset thresholds → defaults restored
- [ ] Download CSV → file downloads with QC columns appended
- [ ] Download PDF → formatted report renders with header block and results table
- [ ] Download audit log → CSV file with all session file records
- [ ] Disclaimer banner appears on every page load, is dismissible, reappears on next load
- [ ] Disclaimer text visible in footer at all times
- [ ] `vercel.json` security headers verified in browser DevTools → Network tab → response headers
- [ ] `npm audit` passes with zero high/critical vulnerabilities
- [ ] Deployed to Vercel at a public URL, linked from portfolio/resume
