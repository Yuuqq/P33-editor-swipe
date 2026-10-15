# Code Review: P33-editor-swipe

Snapshot of this revision, not a standing claim that the tree is clean. Line numbers were taken with `nl` against the files in this commit. Items marked **FIXED** are no longer open defects. Items below that are still open.

This note sits on the review branch stacked on PR #2 (`code-review-7796092168285076780`), not on `master`. The race fix in `app.js` is the classroom bug. The rest of this file is an audit, and it will go stale when open PR #1 (`fix/classroom-cold-start`) lands.

## CRITICAL

No current RCE, data-exfil, or stored XSS. `CLUES` is a hardcoded literal array (`app.js` 13–34, 20 entries).

## FIXED

### 1. Rapid click / key-repeat applied the same clue twice

- **Status:** FIXED in this revision
- **Category:** Reliability
- **File:** `app.js` 110–151 (`commitDecision`, both button listeners, `keydown`)
- **What was wrong:** `idx` advanced only inside a 200ms `setTimeout`. A second click, or a held arrow key (`keydown` repeat), read the same `CLUES[idx]`, pushed a duplicate decision, applied the same delta twice, and skipped later cards. That is state corruption, not a reliable `TypeError`. `idx += 1` and `showEnding()` → `disabled = true` run in the same turn, and WHATWG `HTMLElement.click()` returns immediately on a disabled button.
- **What landed:**
  - `commitDecision` returns before setting the lock when `isAnimating` is set or `CLUES[idx]` is missing (110–112). The property read cannot throw and stick the lock.
  - The lock is cleared in a `finally` after `apply` / `idx += 1` / `showCard` (119–126), including when that work throws.
  - `keydown` ignores `e.repeat` (144). Arrow keys call `preventDefault` only while the round is still playable (146–147), so a finished round can still be scrolled. Input and textarea targets are ignored (143).

No automated test covers this. `QA.md` still says there is no serious known issue (see LOW #6).

## MEDIUM

### 2. FR-1 swipe is not implemented

- **Category:** Product
- **File:** `SPEC.md` 7, 13, 28; `app.js` has no gesture handler
- **Impact:** The project name, SPEC goal, and FR-1 are Tinder-style swipe. `app.js` only listens for button clicks and paints `translateX`. `pm-metrics.js` 165 listens for `pointerdown` solely to record `first_interaction`. There is no `pointermove` / touch tracking in the game. “移动端可用” (`SPEC.md` 55, still unchecked) is two large buttons, not a swipe.

### 3. `aria-label` replaces the visible decision text

- **Category:** Accessibility
- **File:** `index.html` 43–44
- **Impact:** `aria-label="left"` and `aria-label="right"` override the visible labels “左滑（扣留）” and “右滑（发布）”. SPEC NFR (`SPEC.md` 35) asks for keyboard, aria-label, and WCAG AA. A screen-reader user hears an English direction word, not the editorial action. `QA.md` 24–25 checks “键盘导航可达所有交互元素” and “输入控件绑定可见 label”.

### 4. README, QA, and SPEC do not describe this tree

- **Category:** Documentation integrity
- **File:** `README.md` 16–20 and 26–28; `QA.md` 11–15, 23–27, 35–45; `SPEC.md` 50–56; `index.html` 12, 73
- **Impact:**
  - README documents `` `1` `2` `3` `` 分级评分. No such keys exist. Handled keys are only ArrowLeft / ArrowRight (`app.js` 145–150).
  - README lists dark mode, Ctrl+K, and PWA as features of this repo. `index.html` 73 loads `../shared/releases/v2.6/loader.js`, which is not in this repository. `README.md` 39 still names `dark-toggle.js`.
  - `QA.md` 12: “打开 index.html → 输入测试数据 → 执行核心操作”, marked Pass. The page has no text inputs. `QA.md` 37: “暂无已知严重问题”, with three Approved sign-offs (43–45), while the race above was trivial to hit and FR-1 is absent.
  - `SPEC.md` 51–56 acceptance boxes are all `[ ]`.

### 5. Shared-asset 404 and an origin-wide service worker

- **Category:** Reliability
- **File:** `index.html` 12, 73–74; `sw.js` 6–19, 34–46, 49–68
- **Impact:**
  - `index.html` 12 requests `../shared/design-tokens.css`. A bare clone, or a host without `yuuqq.github.io/shared/`, loses tokens. The loader on line 73 fails the same way.
  - `sw.js` 19 precaches `../shared/dark-toggle.js`, which this page does not load.
  - `CACHE_NAME = "journalism-tool-v1"` (`sw.js` 11) is an origin-level name. `activate` (38–46) deletes every other cache on that origin (`caches.delete` at 42). `skipWaiting` (34) and `clients.claim` (46) plus cache-first for every same-origin GET (`caches.match` at 58, return at 68) can keep serving an old `app.js`. The file comment says network-first for API requests (8); the `fetch` handler never branches that way.
- **Related:** PR #1 (`fix/classroom-cold-start`, base `master`) is still open and already edits `index.html`, `styles.css`, and `QA.md` (teach card, shared fallback, button pulse). This memo does not include that diff. Do not treat the two documents as the same truth.

## LOW

### 6. Game logic is inline, and QA certifies a template

- **Category:** Test coverage
- **File:** `app.js` (167 lines); `QA.md` 11–15 and 35–45
- **Impact:** Score clamp (`apply`, 69–72) and the ending tier (`showEnding`, 80–88) sit next to DOM writes. A `GameEngine` plus Jest is optional for this size. The sharper gap is `QA.md`: it records a pass for “输入测试数据” on a page with no inputs, and it signs off “暂无已知严重问题”.
- **Fix suggestion:** Keep logic inline until the file grows. Replace the QA template with steps that match the page (click, key-repeat, ending counts).

### 7. “支持 JSON 自定义” is an abandoned mitigation

- **Category:** Documentation
- **File:** `SPEC.md` 44–47
- **Impact:** Section 7 lists JSON customization as a mitigation for limited preset content. It is not FR-1/2/3. `app.js` never fetches or parses a clues file. Drift, not a missing core feature.
- **Fix suggestion:** Delete the mitigation if it is not planned. If it is added later, do not feed it to `innerHTML` (see #8).

### 8. `innerHTML` for trusted strings

- **Category:** Unsafe default, not a current XSS
- **File:** `app.js` 48–49 (`updateBars`), 90–98 (`card.innerHTML`), 104–106 (`resultEl.innerHTML`). `showCard` already uses `textContent` (60).
- **Impact:** Today the interpolated values are literals or numbers (`emoji`, `title`, `desc`, `cred`, `traffic`, and decision deltas from `CLUES`). That is not a vulnerability. It becomes DOM XSS if untrusted JSON is later interpolated the same way.
- **Fix suggestion:** Build those nodes with `createElement` / `textContent` when the data stops being a literal.

### 9. Classroom CSS, and no rematch control

- **Category:** UX
- **File:** `styles.css` 18, 51, 93–98, 296–311; `app.js` 101
- **Impact:**
  - `button[id*="Btn"]:not(:disabled)` runs `btnPulse` forever (97–98). PR #1 already targets the pulse; this branch does not.
  - `[class*="card"]:hover` (18) matches `news-card`, and `.news-card:hover` (300) sets `transform`. Both fight the inline `translateX` the script uses to swipe.
  - `@media (max-width: 600px)` sets `button { width: 100%; }` (51), so the two actions stop sitting in one row.
  - Ending copy says refresh to replay (`app.js` 101). `styles.css` 296 already selects `[id="restartBtn"]`. No such button exists. `pm-metrics.js` exports `markTaskComplete` (86–93, 192) and `app.js` never calls it (153–167 only `markTaskStart`).
- **Not a dark-mode bug:** `.news-card { background:#fffdf9 }` at `styles.css` 7 is overridden by the later `.news-card` rule at 305–308, which uses `var(--card)`.

## NIT

### 10. Synchronous `localStorage` rewrite on each `track`

- **Category:** Performance
- **File:** `pm-metrics.js` 24–39 (`readEvents`, `writeEvents`) and 52–58 (`track`)
- **Impact:** Each `track` reads, parses, and rewrites up to 500 events. The payload is small and a 20-card session will not stutter. In-memory batching would be tidier. It is not a defect at this size.
- **Earlier cite was wrong:** lines 28–32 are the `JSON.parse` catch, and 46–52 are `basePayload` fields. Do not use those ranges.
