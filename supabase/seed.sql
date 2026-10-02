-- NoCap seed challenges. Rubric maxes sum to 100 per challenge.

INSERT INTO public.nc_challenges (slug, title, category, difficulty, type, prompt, starter_code, options, correct_option, rubric, time_limit_minutes, points) VALUES
-- 1. Two Sum (code, beginner)
($$two-sum$$, $$Two Sum$$, $$Algorithms$$, $$Beginner$$, $$code$$,
$$Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.

Rules:
- Each input has exactly one solution.
- You may not use the same element twice.
- Return the answer as an array of two indices, e.g. `[0, 1]`.

Example: nums = [2, 7, 11, 15], target = 9 -> [0, 1]$$,
$$function twoSum(nums, target) {
  // Your code here — return [i, j]
}$$,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":50,"description":"Returns the right indices for all valid inputs, including edge cases"},{"criterion":"Code quality","max":25,"description":"Clean, readable code with sensible naming"},{"criterion":"Efficiency","max":25,"description":"Better than brute force where possible (aim for one pass)"}]$$,
20, 100),

-- 2. Valid Parentheses (code, intermediate)
($$valid-parentheses$$, $$Valid Parentheses$$, $$Algorithms$$, $$Intermediate$$, $$code$$,
$$Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.

A string is valid when:
- Open brackets are closed by the same type of brackets.
- Open brackets are closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.

Examples: `"()"` -> true, `"()[]{}"` -> true, `"(]"` -> false, `"([)]"` -> false$$,
$$function isValid(s) {
  // Your code here — return true or false
}$$,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":50,"description":"Handles all bracket types, nesting and edge cases (empty string, single char)"},{"criterion":"Code quality","max":25,"description":"Clear structure, no redundant checks"},{"criterion":"Efficiency","max":25,"description":"Linear time solution (stack-based)"}]$$,
25, 150),

-- 3. Debounce (code, intermediate, frontend)
($$debounce$$, $$Debounce It$$, $$Frontend$$, $$Intermediate$$, $$code$$,
$$Implement `debounce(fn, delay)`. It should return a new function that delays invoking `fn` until after `delay` milliseconds have elapsed since the last time the debounced function was called.

Example: a search box that fires an API call on every keystroke should instead wait until the user pauses typing.

Requirements:
- The returned function must forward all arguments to `fn`.
- Calling it repeatedly within the delay window resets the timer.
- `this` context does not need to be preserved (but bonus points if it is).$$,
$$function debounce(fn, delay) {
  // Your code here — return the debounced function
}$$,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":50,"description":"Timer resets on rapid calls, fn fires once with the latest arguments"},{"criterion":"Code quality","max":25,"description":"Tidy closure usage, no leaks (clearTimeout handled)"},{"criterion":"Efficiency","max":25,"description":"No unnecessary timers or memory growth"}]$$,
25, 150),

-- 4. Responsive navbar (code, beginner, frontend)
($$responsive-navbar$$, $$Responsive Navbar$$, $$Frontend$$, $$Beginner$$, $$code$$,
$$Build a responsive navigation bar with HTML and CSS.

Requirements:
- A logo/brand on the left and at least 4 nav links.
- On screens narrower than 768px, links collapse behind a hamburger button that toggles the menu (CSS-only checkbox hack or a tiny bit of JS — your choice).
- The navbar must not cause horizontal scrolling at any width.

Write your HTML and CSS below. Keep it clean and semantic.$$,
$$<!-- Write your HTML here -->
<nav class="navbar">
</nav>

<style>
/* Write your CSS here */
</style>$$,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":45,"description":"All requirements met: brand, links, working mobile toggle, no overflow"},{"criterion":"Code quality","max":30,"description":"Semantic HTML, organized CSS, sensible class names"},{"criterion":"Efficiency","max":25,"description":"Minimal, non-redundant CSS; no heavy hacks"}]$$,
20, 100),

-- 5. CSS specificity (mcq, beginner, frontend)
($$css-specificity$$, $$CSS Specificity Showdown$$, $$Frontend$$, $$Beginner$$, $$mcq$$,
$$Which selector wins when all three target the same element?

A) `#header .nav a`
B) `.header .nav .link.active`
C) `header nav ul li a.button`

Pick the one with the highest specificity.$$,
NULL,
$$[{"id":"a","text":"A) #header .nav a — the ID selector wins"},{"id":"b","text":"B) .header .nav .link.active — four classes beat an ID"},{"id":"c","text":"C) header nav ul li a.button — element selectors stack up"}]$$,
$$a$$,
$$[{"criterion":"Correctness","max":100,"description":"One ID outweighs any number of classes: A wins"}]$$,
5, 50),

-- 6. Big-O basics (mcq, beginner, algorithms)
($$big-o-basics$$, $$Big-O Basics$$, $$Algorithms$$, $$Beginner$$, $$mcq$$,
$$What is the time complexity of this function?

```
function findPair(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) return [i, j];
    }
  }
}
```$$,
NULL,
$$[{"id":"a","text":"A) O(n) — it returns early"},{"id":"b","text":"B) O(n log n) — nested loops divide the work"},{"id":"c","text":"C) O(n^2) — every pair is checked in the worst case"}]$$,
$$c$$,
$$[{"criterion":"Correctness","max":100,"description":"Nested loops over n give quadratic worst-case time: C"}]$$,
5, 50),

-- 7. Event loop (mcq, intermediate, backend)
($$event-loop$$, $$Event Loop Trap$$, $$Backend$$, $$Intermediate$$, $$mcq$$,
$$What order do these print in?

```
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```$$,
NULL,
$$[{"id":"a","text":"A) A, B, C, D"},{"id":"b","text":"B) A, D, C, B"},{"id":"c","text":"C) A, D, B, C"}]$$,
$$b$$,
$$[{"criterion":"Correctness","max":100,"description":"Sync first (A, D), then microtasks (C), then macrotasks (B)"}]$$,
5, 60),

-- 8. REST design (open, intermediate, backend)
($$rest-design$$, $$Design a URL Shortener API$$, $$Backend$$, $$Intermediate$$, $$open$$,
$$Design the REST API for a URL shortener service (think bit.ly).

Cover:
1. The endpoints you would expose (method + path) for creating, resolving and deleting short links, plus one analytics endpoint.
2. What each endpoint accepts and returns (status codes included).
3. How you would handle collisions when generating short codes.
4. One trade-off in your design (e.g. redirect speed vs. analytics accuracy) and why you chose your side.

Write clearly and concisely — this is graded on thinking, not code.$$,
NULL,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":40,"description":"Endpoints are RESTful, complete and coherent"},{"criterion":"Depth of thinking","max":35,"description":"Collision handling and trade-off show real engineering judgment"},{"criterion":"Clarity","max":25,"description":"Well-structured, precise, easy to follow"}]$$,
20, 120),

-- 9. Rate limiter (open, advanced, backend)
($$rate-limiter$$, $$Rate Limiter at 10k RPS$$, $$Backend$$, $$Advanced$$, $$open$$,
$$Design a rate limiter for a public API handling 10,000 requests per second across 20 servers.

Cover:
1. Which algorithm you would pick (token bucket, sliding window, fixed window...) and why.
2. Where the counter state lives and how the 20 servers stay consistent.
3. How you handle the thundering-herd edge when a window resets.
4. What headers the API returns so clients can back off gracefully.

Assume you can use Redis. Be specific — vague answers score low.$$,
NULL,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":40,"description":"Algorithm choice fits the scale; consistency story is sound"},{"criterion":"Depth of thinking","max":35,"description":"Edge cases (herd, clock skew, failover) addressed concretely"},{"criterion":"Clarity","max":25,"description":"Precise, structured, no hand-waving"}]$$,
30, 200),

-- 10. Promise.all (code, advanced, frontend)
($$promise-all$$, $$Rebuild Promise.all$$, $$Frontend$$, $$Advanced$$, $$code$$,
$$Implement your own `myPromiseAll(promises)` that behaves like `Promise.all`:

- Accepts an array of promises (and plain values).
- Resolves with an array of results **in input order** when all fulfill.
- Rejects immediately with the first rejection reason.
- Resolves with `[]` for an empty array.

Do not use the native `Promise.all` inside your implementation.$$,
$$function myPromiseAll(promises) {
  // Your code here — return a Promise
}$$,
$$[]$$, NULL,
$$[{"criterion":"Correctness","max":55,"description":"Order preserved, early rejection, empty array and plain values handled"},{"criterion":"Code quality","max":25,"description":"Readable promise handling, no anti-patterns"},{"criterion":"Efficiency","max":20,"description":"No unnecessary wrapping or serial execution"}]$$,
30, 200);
