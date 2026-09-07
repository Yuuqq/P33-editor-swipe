# Code Review: P33-editor-swipe

This document summarizes the findings from a thorough code review of the `P33-editor-swipe` repository, evaluating architecture, security, reliability, test coverage, performance, and documentation.

## CRITICAL

*(No critical vulnerabilities or architectural flaws found that would cause immediate catastrophic failure or data breaches under normal use.)*

## HIGH

### 1. Rapid Click / Double-Click Race Condition
- **Category:** Reliability / Edge Cases
- **File:** `app.js` (Lines 80-103)
- **Impact:** The left and right button click listeners trigger a 200ms `setTimeout` for the swipe animation before updating the state and moving to the next clue. If a user clicks rapidly (or double-clicks) before the 200ms timeout completes, the app pushes multiple decisions for the same clue, increments `idx` multiple times, and skips subsequent clues. This corrupts the game state and will throw an `Uncaught TypeError` when `idx` exceeds the bounds of `CLUES.length`.
- **Fix Suggestion:** Introduce an `isAnimating` boolean flag. Set it to `true` at the beginning of the click handler and return early if it's already `true`. Reset it to `false` inside the `setTimeout` callback. Alternatively, temporarily set `leftBtn.disabled = true` and `rightBtn.disabled = true` during the animation.

## MEDIUM

### 2. Keyboard Shortcut Bypasses End-of-Game State
- **Category:** Reliability / Edge Cases
- **File:** `app.js` (Lines 106-110)
- **Impact:** The keyboard event listener maps `ArrowLeft` and `ArrowRight` to `leftBtn.click()` and `rightBtn.click()`. At the end of the game, the buttons are disabled via DOM properties (`disabled = true`), but if the browser allows programmatic `.click()` calls on disabled buttons, or if the user presses keys before the UI fully updates, the handler will fire. This results in accessing `CLUES[idx]` out of bounds, causing a JavaScript runtime error.
- **Fix Suggestion:** Add a bounds check in the click handlers (e.g., `if (idx >= CLUES.length) return;`) or explicitly verify the button state in the keydown listener (e.g., `if (!leftBtn.disabled) leftBtn.click();`).

### 3. Tightly Coupled Logic and Lack of Automated Tests
- **Category:** Architecture / Test Coverage
- **File:** `app.js` (Entire file)
- **Impact:** Game logic (calculating `cred` and `traffic` scores, decision recording, and evaluating the final tier) is tightly coupled with DOM manipulation. According to `QA.md`, only manual functional testing is performed. There are no unit tests. Any future refactor or addition of features risks introducing unverified regressions in the scoring logic.
- **Fix Suggestion:** Extract the core state management and score calculation into a pure JavaScript class or object (e.g., `GameEngine`). Add an automated testing framework (like Jest) to write unit tests for the core logic independently of the DOM.

### 4. Missing Implementation for Spec Feature
- **Category:** Documentation / Developer Experience
- **File:** `SPEC.md` (Section 7) and `app.js`
- **Impact:** The `SPEC.md` document explicitly lists "支持 JSON 自定义" (Supports custom JSON) as a mitigation for the risk of limited preset content. However, `app.js` hardcodes the `CLUES` array and lacks any mechanism to fetch or parse external JSON files. This creates a mismatch between product specifications and the actual implementation.
- **Fix Suggestion:** Either remove the claim from `SPEC.md` if it's no longer planned, or update `app.js` to fetch a `clues.json` file asynchronously on startup.

## LOW

### 5. Synchronous LocalStorage I/O on Every Tracking Event
- **Category:** Performance
- **File:** `pm-metrics.js` (Lines 28-32, 46-52)
- **Impact:** The `track` function calls `readEvents()` and `writeEvents()` on every single user interaction. These functions synchronously read, parse, stringify, and write up to 500 JSON objects to `localStorage`. While standard payloads are small, doing this on the main UI thread during every click is an unnecessary O(N) performance overhead that could cause micro-stutters on lower-end devices.
- **Fix Suggestion:** Keep the events array in memory and append to it. Batch writes to `localStorage` using `requestIdleCallback`, `setTimeout`, or update the storage incrementally rather than rewriting the entire array every time.

### 6. Unsafe Use of `innerHTML` as Default
- **Category:** Security (Unsafe Defaults)
- **File:** `app.js` (Lines 60-70)
- **Impact:** The application uses `card.innerHTML` and `resultEl.innerHTML` to inject HTML structures. Currently, this is safe because the injected variables (`emoji`, `title`, `desc`, `cred`, `traffic`) are either hardcoded or strict numbers. However, this is an unsafe default pattern. If the app is later updated to support the "JSON 自定义" feature (as mentioned in the Spec), malicious JSON payloads could easily introduce DOM-based XSS attacks.
- **Fix Suggestion:** Refactor DOM generation to use `document.createElement()` and `.textContent`, or implement a sanitization library (like DOMPurify) before inserting dynamic content via `innerHTML`.
