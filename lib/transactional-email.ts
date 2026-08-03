import "server-only"

type AccountEmailType = "verify" | "reset"

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character)
}

function applicationUrl() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "https://786.chat"
  return configured.startsWith("http")
    ? configured.replace(/\/$/, "")
    : `https://${configured.replace(/\/$/, "")}`
}

export async function sendAccountEmail(input: {
  type: AccountEmailType
  email: string
  name: string
  token: string
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { sent: false, reason: "EMAIL_NOT_CONFIGURED" as const }

  const baseUrl = applicationUrl()
  const path = input.type === "verify" ? "/verify-email" : "/reset-password"
  const url = `${baseUrl}${path}?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.email)}`
  const safeName = escapeHtml(input.name || "there")
  const verify = input.type === "verify"
  const subject = verify ? "Verify your 786.Chat email" : "Reset your 786.Chat password"
  const heading = verify ? "Verify your email" : "Reset your password"
  const copy = verify
    ? "Confirm this email address to activate your secure 786.Chat workspace."
    : "Use the secure link below to choose a new password. This link expires in 30 minutes."
  const button = verify ? "Verify email" : "Reset password"

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${input.type}-${input.email}-${input.token.slice(0, 12)}`,
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM || "786.Chat <onboarding@resend.dev>",
      to: [input.email],
      subject,
      html: `<!doctype html><html><body style="margin:0;background:#050814;color:#e5eefc;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:48px 24px"><div style="font-size:24px;font-weight:800;color:#67e8f9">786.Chat</div><div style="margin-top:28px;border:1px solid #25324a;border-radius:20px;background:#0b1222;padding:32px"><h1 style="margin:0;font-size:28px;color:#fff">${heading}</h1><p style="line-height:1.7;color:#b7c4d8">Hello ${safeName},</p><p style="line-height:1.7;color:#b7c4d8">${copy}</p><p style="margin:30px 0"><a href="${url}" style="display:inline-block;border-radius:12px;background:#22d3ee;color:#04121a;font-weight:800;text-decoration:none;padding:14px 22px">${button}</a></p><p style="font-size:12px;line-height:1.6;color:#718096">If you did not request this, you can safely ignore this email.</p></div></div></body></html>`,
    }),
  })

  if (!response.ok) {
    console.error("[786.Chat] Transactional email delivery failed", response.status)
    return { sent: false, reason: "EMAIL_DELIVERY_FAILED" as const }
  }
  return { sent: true as const }
}
