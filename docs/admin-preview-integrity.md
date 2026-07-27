# Admin preview integrity

The `/786-admin/chat` preview must render customer project files only.

- Full regeneration requests discard prior generated-file context.
- Unrelated, generic or admin-contaminated output is rejected before it can be saved.
- A preview iframe may perform its initial `srcDoc` load and in-page hash scrolling, but any later full document navigation is restored to the original isolated project.
- Customer projects must not load `/786-admin/*`, the chat editor or project-management UI.
