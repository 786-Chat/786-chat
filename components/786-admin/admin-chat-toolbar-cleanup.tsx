"use client"

import { AdminChatPublishController } from "@/components/786-admin/admin-chat-publish-controller"
import { AdminChatPublishingOverviewLink } from "@/components/786-admin/admin-chat-publishing-overview-link"

/**
 * This component used to patch /786-admin/chat with document.querySelector,
 * MutationObserver, injected <style> tags, and dynamically-created buttons.
 *
 * The admin chat header must now be owned by the real React page/component layer,
 * not by global DOM patching. Keep the publishing controllers mounted here because
 * they are existing app-level behaviour, but do not alter the chat header DOM.
 */
export function AdminChatToolbarCleanup() {
  return (
    <>
      <AdminChatPublishController />
      <AdminChatPublishingOverviewLink />
    </>
  )
}
