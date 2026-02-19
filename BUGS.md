# Bug Report

## Bug 1 (High): `lib/notify.ts` -- `getNextMondayDate()` returns malformed date format

**File:** `lib/notify.ts`, line 19  
**Description:** The function uses abbreviated month *names* (`Jan`, `Feb`, etc.) instead of zero-padded numeric months. It returns strings like `"2026-Feb-23"` instead of the `"2026-02-23"` ISO format used everywhere else in the codebase (e.g., `toISOString().split('T')[0]`). If this date is compared or parsed against the standard format used by `weekStart` or other plan dates, it will fail silently.

**Fix:** Replace the `months` array lookup with a zero-padded numeric month:  
`String(nextMonday.getUTCMonth() + 1).padStart(2, '0')`

---

## Bug 2 (High): `app/page.tsx` -- Dashboard approve handler doesn't handle API errors

**File:** `app/page.tsx`, lines 54-66  
**Description:** When the plan is locked, the `/api/plan` PATCH endpoint returns `{ error: 'Plan is locked...' }` with status 403. The Dashboard blindly calls `setPlan(updatedPlan)` without checking for errors first, setting the entire plan state to `{ error: "..." }`. This corrupts the UI -- `plan.meals` becomes `undefined`, causing the calendar and other components to crash or render nothing. Compare with the Plan page (`app/plan/page.tsx` line 175-176) which correctly checks `if (data.error)` before updating state.

**Fix:** Check `if (updatedPlan.error) { alert(updatedPlan.error); return; }` before calling `setPlan`.

---

## Bug 3 (High): `app/page.tsx` -- Dashboard approve handler doesn't strip `locked` field from API response

**File:** `app/page.tsx`, lines 54-66  
**Description:** The `/api/plan` PATCH endpoint returns `{ ...updatedPlan, locked: false }` (see `app/api/plan/route.ts` line 52). The Plan page correctly destructures this with `const { locked: isLocked, ...planData } = data;`, but the Dashboard just does `setPlan(updatedPlan)`, which means the `locked` field leaks into the `WeeklyPlan` state object, polluting it with a property not in the type definition.

**Fix:** Destructure `locked` out of the response before calling `setPlan`, similar to how the Plan page does it.

---

## Bug 4 (Medium): `app/page.tsx` -- Dashboard doesn't track or enforce plan lock state

**File:** `app/page.tsx`  
**Description:** The Dashboard fetches the `locked` property on initial load (line 26) but immediately discards it. There is no `locked` state variable, unlike the Plan page. This means the "Approve" buttons on the `WeeklyCalendar` component remain clickable even when the plan is locked. Users can click approve from the dashboard on a locked plan, which triggers Bug #2 (unhandled error response).

**Fix:** Track `locked` state in the Dashboard and pass it to `WeeklyCalendar` to disable approval buttons when locked.

---

## Bug 5 (Medium): `app/recipes/new/page.tsx` -- Missing cuisines in new recipe form dropdown

**File:** `app/recipes/new/page.tsx`, lines 7-9  
**Description:** The hardcoded `cuisineOptions` list is missing `middle-eastern` and `greek` which are defined in `AVAILABLE_CUISINES` in `types/index.ts`. Users manually adding recipes cannot select these cuisine types, but the AI can generate recipes with them, creating an inconsistency.

**Fix:** Import and use `AVAILABLE_CUISINES` from `@/types` instead of a hardcoded array, or add the missing entries.

---

## Bug 6 (Low-Medium): `app/recipes/new/page.tsx` -- Cuisine name display doesn't properly capitalize hyphenated words

**File:** `app/recipes/new/page.tsx`, line 248  
**Description:** The display logic `c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')` only capitalizes the first character and replaces hyphens with spaces. This means `"indian-fusion"` displays as "Indian fusion" (lowercase 'f') instead of "Indian Fusion".

**Fix:** Split on hyphens, capitalize each word, then rejoin: `c.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')`

---

## Bug 7 (Medium): `lib/storage.ts` -- MongoDB connection race condition

**File:** `lib/storage.ts`, lines 11-23  
**Description:** If multiple API requests arrive simultaneously on a cold serverless instance, they all see `db === null` and each create a separate `MongoClient` connection. The earlier connections are leaked because the module-level `client` variable gets overwritten by the last one to finish.

**Fix:** Cache the connection *promise* itself instead of the resolved result, so concurrent callers await the same in-flight connection attempt.

---

## Bug 8 (Low-Medium): `lib/plan-lock.ts` -- Hardcoded PST offset doesn't account for Daylight Saving Time

**File:** `lib/plan-lock.ts`, line 21  
**Description:** The code hardcodes Sunday 6 PM PST (UTC-8) = Monday 2 AM UTC. But during Daylight Saving Time (March to November), the Pacific timezone is PDT (UTC-7). This means the lockdown effectively happens at 7 PM PDT instead of 6 PM PDT during summer, giving users an extra unintended hour.

**Fix:** Use a timezone-aware calculation or detect whether DST is active to adjust the UTC offset accordingly.

---

## Bug 9 (Low): `lib/meal-generator.ts` and `lib/recipes.ts` -- Use of deprecated `String.prototype.substr()`

**Files:** `lib/meal-generator.ts` line 6, `lib/recipes.ts` line 16  
**Description:** `String.prototype.substr()` is deprecated per the ECMAScript spec (Annex B). While still functional, it should be replaced.

**Fix:** Replace `.substr(2, 9)` with `.substring(2, 11)` or `.slice(2, 11)`.

---

## Bug 10 (Low): `next.config.js` -- Deprecated Next.js config key

**File:** `next.config.js`  
**Description:** With `"next": "^14.2.0"`, the `experimental.serverComponentsExternalPackages` config key has been moved to root-level `serverExternalPackages` (since Next.js 14.1). The Anthropic SDK might not be properly externalized with the old key.

**Fix:** Move to `serverExternalPackages: ['@anthropic-ai/sdk']` at the root config level.
