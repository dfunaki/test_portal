# Prompts

The prompts used to build this project, in the order they were given.

The work ran through [OpenSpec](https://github.com/Fission-AI/OpenSpec) in three
phases. Each phase is a slash command that loads a set of instructions; those
instructions are the *rules* half of the deliverable and live in `.claude/` and
`.agents/`, with project artifacts under `openspec/`.

| File | Phase | What it produced |
|---|---|---|
| [`01-explore.md`](01-explore.md) | `/opsx:explore` | The requirements, the architecture, and the decisions — no code |
| [`02-propose.md`](02-propose.md) | `/opsx:propose` | `proposal.md`, three delta specs, `design.md`, `tasks.md` |
| [`03-apply.md`](03-apply.md) | `/opsx:apply` | The implementation, task by task |

## What the rules are

- **`.claude/commands/opsx/*.md`** — the slash commands. Each defines a stance
  and a workflow: `explore.md` forbids writing code, `propose.md` forbids
  starting implementation, `apply.md` walks the task list.
- **`.claude/skills/`, `.agents/skills/`** — the same workflows as skills, in
  portable form.
- **`openspec/config.yaml`** — project context and per-artifact rules.
- **`openspec/changes/add-carrier-lane-search/`** — what those rules produced:
  the proposal, the specs, the design, and the task list the code was written
  against.

## Note on fidelity

Prompts are reproduced as they were typed, including typos. The point is what
was actually said, not a tidied version of it.
