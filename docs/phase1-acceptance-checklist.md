# Phase 1 acceptance checklist

The core builder is ready for user testing only when all checks below pass on the production deployment.

## Project lifecycle

- Create a new project from a fresh chat.
- Save to Neon.
- Leave the editor and reopen the project.
- Switch between two projects without stale files, messages, preview HTML, theme state or visual-editor operations.
- Regenerate completely and confirm the previous generated file set is replaced rather than merged.
- Publish only the active project.

## Preview isolation

- Generated links remain inside the generated project.
- A generated project cannot load `/786-admin`, `/dashboard`, `/chat`, login or project-management routes inside its iframe.
- No nested editor or nested preview can appear.
- Refresh restores the current project preview and current in-project route.
- Forms and dropdowns do not replace the iframe document.

## Editor

- Source file editing saves and survives reopen.
- Visual text, colour, spacing, border and radius changes save and survive reopen.
- Move up/down, duplicate and delete are idempotent and do not replay repeatedly after refresh.
- Visual operations are isolated by project ID.

## Design generation

- Prompt colour and layout instructions take precedence over fallback defaults.
- New projects do not inherit files, CSS, content, theme metadata or preview state from another project.
- Industry-inappropriate generic modules are rejected during clean regeneration.
- Navigation, hero structure, typography, cards, spacing, animation and mobile composition vary between projects.

## Build

- Vercel production build succeeds.
- No TypeScript build error is introduced.
- The production deployment is tested only after its status is Ready.
