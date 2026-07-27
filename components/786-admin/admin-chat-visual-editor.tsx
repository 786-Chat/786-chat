"use client"

/**
 * The visual editor runtime previously injected a floating "Edit page" toolbar
 * into every customer preview iframe. That made an admin-only control appear as
 * part of generated customer projects and allowed stale iframe runtimes to keep
 * the button visible after deployments.
 *
 * Visual editing is intentionally disabled here. Customer previews now render
 * only the generated project. Code editing remains available through the admin
 * code editor without adding controls to the customer website.
 */
export function AdminChatVisualEditor() {
  return null
}
