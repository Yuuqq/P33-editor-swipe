# Code Review: P33-editor-swipe

This document summarizes the findings from a thorough code review of the `P33-editor-swipe` repository, evaluating architecture, security, reliability, test coverage, performance, and documentation.

## CRITICAL

*(No critical vulnerabilities or architectural flaws found that would cause immediate catastrophic failure or data breaches under normal use.)*

## HIGH

### 1. Rapid Click / Double-Click Race Condition
- **Category:** Reliability / Edge Cases
- **File:** `app.js` (Lines 109-135)
- **Impact:** The left and right button click listeners trigger a 200ms `setTimeout` for the swipe animation before updating the state and moving to the next clue. If a user clicks rapidly, or more commonly holds down the arrow keys triggering `keydown` repeats, before the 200ms timeout completes, the app pushes multiple decisions for the same clue. `idx++` and `disabled = true` happen in the same tick so it won't reliably throw a `TypeError` for `.click()` on disabled buttons (which natively return early per WHATWG). Instead, it logs the same clue multiple times, corrupts the final count and scores, and visually skips cards.
- **Fix Suggestion:** Introduce an `isAnimating` boolean flag. Set it to `true` at the beginning of the click handler and return early if it's already `true`. Reset it to `false` inside the `setTimeout` callback. Also, add `if (e.repeat) return;` to the keyboard event listener to ignore held-down keys.

## MEDIUM

## LOW

### 3. Tightly Coupled Logic and Lack of Automated Tests
- **Category:** Architecture / Test Coverage
- **File:** `app.js` (Entire file)
- **Impact:** Game logic is coupled with DOM manipulation. However, for a 160-line vanilla JS page, this is over-engineered. The larger issue here is QA falsifying test coverage.
- **Fix Suggestion:** Extract logic if the file grows, but currently not a priority.

### 4. Missing Implementation for Spec Feature
- **Category:** Documentation / Developer Experience
- **File:** `SPEC.md` (Section 7) and `app.js`
- **Impact:** The `SPEC.md` document explicitly lists "支持 JSON 自定义". This is mostly documentation drift / an abandoned risk mitigation rather than a missing core feature.
- **Fix Suggestion:** Remove the claim from `SPEC.md` if it's no longer planned.

### 5. Synchronous LocalStorage I/O on Every Tracking Event
- **Category:** Performance
- **File:** `pm-metrics.js` (Lines 28-32, 46-52)
- **Impact:** The `track` function calls `readEvents()` and `writeEvents()` on every single user interaction. These functions synchronously read, parse, stringify, and write up to 500 JSON objects to `localStorage`. While standard payloads are small, doing this on the main UI thread during every click is an unnecessary O(N) performance overhead that could cause micro-stutters on lower-end devices.
- **Fix Suggestion:** Keep the events array in memory and append to it. Batch writes to `localStorage` using `requestIdleCallback`, `setTimeout`, or update the storage incrementally rather than rewriting the entire array every time.

### 6. Unsafe Use of `innerHTML` as Default
- **Category:** Security (Unsafe Defaults)
- **File:** `app.js` (Lines 79-92)
- **Impact:** The application uses `card.innerHTML` and `resultEl.innerHTML` to inject HTML structures. Currently, this is safe because the injected variables (`emoji`, `title`, `desc`, `cred`, `traffic`) are either hardcoded or strict numbers. However, this is an unsafe default pattern. If the app is later updated to support the "JSON 自定义" feature (as mentioned in the Spec), malicious JSON payloads could easily introduce DOM-based XSS attacks.
- **Fix Suggestion:** Refactor DOM generation to use `document.createElement()` and `.textContent`, or implement a sanitization library (like DOMPurify) before inserting dynamic content via `innerHTML`.
