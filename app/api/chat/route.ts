FILE: app/api/chat/route.ts

SAFE FIX ONLY — DO NOT replace whole file with this.
Use these edits inside your existing full 826-line file.

1) Find this block:

const isPreviewNavigationRequest =
  userText.includes("SYSTEM_PREVIEW_ACTION:") ||
  /show me .*preview/i.test(userText) ||
  /open .*preview/i.test(userText) ||
  /preview .*page/i.test(userText)

2) Add this directly below it:

const shouldUsePreviewOnlyMode =
  !isAdmin && isPreviewNavigationRequest

3) In streamText(), replace:

system: isPreviewNavigationRequest

with:

system: shouldUsePreviewOnlyMode

4) Replace:

maxOutputTokens: isPreviewNavigationRequest ? 50 : isAdmin ? 8192 : aiSettings.maxTokens,

with:

maxOutputTokens: shouldUsePreviewOnlyMode ? 50 : isAdmin ? 8192 : aiSettings.maxTokens,

5) Replace:

tools:
  isAdmin && github.isGitHubConfigured() && !isPreviewNavigationRequest
    ? adminTools
    : undefined,

with:

tools:
  isAdmin && github.isGitHubConfigured()
    ? adminTools
    : undefined,

6) Replace:

stopWhen: isAdmin && !isPreviewNavigationRequest ? stepCountIs(10) : undefined,

with:

stopWhen: isAdmin ? stepCountIs(10) : undefined,

WHY:
This keeps preview-only mode for customers, but owner/admin mujeeb@job4u.com keeps full tools even when the message includes preview words.
