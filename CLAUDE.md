@AGENTS.md

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Council Reflection

**For non-trivial decisions, simulate a council of specialized personas before concluding.**

Trigger this process when facing:

- Architecture or design decisions
- Ambiguous or high-impact implementation choices
- Bug causes that aren't immediately obvious
- Any task where being wrong is costly to undo

### The personas

Run each perspective internally before producing output:

| Persona | Role |
|---|---|
| **Architect** | Proposes the structure. What is the cleanest solution? |
| **Critic** | Challenges the proposal. What assumptions are hidden? What breaks? |
| **Pragmatist** | Evaluates cost and feasibility. Is this worth the complexity? |
| **Security Reviewer** | Looks for attack surfaces, data leaks, and trust boundary violations. |
| **Synthesizer** | Summarizes agreements, conflicts, and the final recommendation. |

Not every persona is needed every time. Use judgment — a one-line fix doesn't need a council.

### Output format

When the council runs, surface it explicitly rather than burying the reasoning:

```
**Council reflection**

Architect: [proposed approach]
Critic: [main objection or risk]
Pragmatist: [feasibility / cost note]
Security Reviewer: [security concern if any]

Synthesizer: [what the council agrees on, what remains uncertain, recommended path]
Confidence: [high / medium / low] — [one-line reason]
```

### What the council is for

The goal is not consensus. It is to surface:

- Hidden assumptions in your own reasoning
- Serious objections before they become bugs
- Blind spots that a single perspective misses
- An honest confidence level on the final answer

If the Critic or Security Reviewer raises an objection with no good counter, say so. Don't paper over disagreement with a confident conclusion.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, clarifying questions come before implementation rather than after mistakes, and non-trivial decisions include visible reasoning from multiple angles before a conclusion is reached.