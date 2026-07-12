# Skill Registry

This file is an index of all available custom skills and convention files for this project.

## Registry Contract

- This registry serves as a lookup index for the orchestrator and sub-agents.
- Individual `SKILL.md` files remain the absolute source of truth for runtime instructions.
- Sub-agents should read the full skill source at the specified paths.

## Scanned Skills

| Skill Name | Triggers / Description | Scope | Exact Path |
| --- | --- | --- | --- |
| **branch-pr** | Trigger: `creating, opening, or preparing PRs for review` <br> Create Gentle AI pull requests with issue-first checks. | project | `.gemini/antigravity-cli/skills/branch-pr/SKILL.md` |
| **chained-pr** | Trigger: `PRs over 400 lines, stacked PRs, review slices` <br> Split oversized changes into chained PRs that protect review focus. | project | `.gemini/antigravity-cli/skills/chained-pr/SKILL.md` |
| **cognitive-doc-design** | Trigger: `writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs.` <br> Design docs that reduce cognitive load. | project | `.gemini/antigravity-cli/skills/cognitive-doc-design/SKILL.md` |
| **comment-writer** | Trigger: `PR feedback, issue replies, reviews, Slack messages, or GitHub comments.` <br> Write warm, direct collaboration comments. | project | `.gemini/antigravity-cli/skills/comment-writer/SKILL.md` |
| **go-testing** | Trigger: `Go tests, go test coverage, Bubbletea teatest, golden files` <br> Apply focused Go testing patterns. | project | `.gemini/antigravity-cli/skills/go-testing/SKILL.md` |
| **issue-creation** | Trigger: `creating GitHub issues, bug reports, or feature requests.` <br> Create Gentle AI issues with issue-first checks. | project | `.gemini/antigravity-cli/skills/issue-creation/SKILL.md` |
| **judgment-day** | Trigger: `judgment day, dual review, adversarial review, juzgar` <br> Run explicit blind dual review with at most two scoped fix/re-judgment rounds. | project | `.gemini/antigravity-cli/skills/judgment-day/SKILL.md` |
| **skill-creator** | Trigger: `new skills, agent instructions, documenting AI usage patterns` <br> Create LLM-first skills with valid frontmatter. | project | `.gemini/antigravity-cli/skills/skill-creator/SKILL.md` |
| **skill-improver** | Trigger: `improve skills, audit skills, refactor skills, skill quality` <br> Audit and upgrade existing LLM-first skills. | project | `.gemini/antigravity-cli/skills/skill-improver/SKILL.md` |
| **work-unit-commits** | Trigger: `implementation, commit splitting, chained PRs, or keeping tests and docs with code.` <br> Plan commits as reviewable work units. | project | `.gemini/antigravity-cli/skills/work-unit-commits/SKILL.md` |

## Project Convention Files

| File Name | Scope | Exact Path |
| --- | --- | --- |
| **GEMINI.md** | project | `.gemini/GEMINI.md` |
