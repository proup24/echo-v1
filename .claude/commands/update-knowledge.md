Review the current codebase and recent changes, then update all project knowledge files.

## Knowledge Files

- `.claude/knowledge/conventions.md` — coding patterns, naming conventions, module structures
- `.claude/knowledge/domain-glossary.md` — domain concepts, terminology, entity relationships
- `.claude/knowledge/core.md` — core API modules, services, workers, shared libs, DB tables

## Steps

1. Read all three knowledge files listed above
2. Review recent git changes (`git diff HEAD~5..HEAD` or staged changes) and scan the codebase for new or modified modules
3. For each knowledge file, identify gaps:
   - **conventions.md** — new coding patterns, file structures, workflow conventions
   - **domain-glossary.md** — new domain concepts, entity relationships, terminology
   - **core.md** — new/removed/renamed modules, services, workers, queues, DB tables, shared libs; verify the module dependency tree is accurate
4. Update each file with the identified changes. Remove entries that are no longer accurate.
5. Report a summary of what was added, changed, or removed in each file
