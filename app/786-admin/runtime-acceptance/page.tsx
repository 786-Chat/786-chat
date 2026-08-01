import { redirect } from "next/navigation"

/**
 * Phase 3 acceptance is an internal, owner-only API workflow. It is deliberately
 * not presented as a product screen because customers create every application
 * type through the canonical AI workspace.
 */
export default function RuntimeAcceptancePage() {
  redirect("/786.chat")
}
