import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { isAdmin } from "@/lib/admin-check"
import { 
  createReferralCode, 
  getAllReferralCodes, 
  getReferralUsages, 
  markReferralPaid,
  deleteReferralCode,
  getReferrerCommission
} from "@/lib/referral"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "codes"

    if (type === "usages") {
      const usages = await getReferralUsages()
      return NextResponse.json({ usages })
    }

    const codes = await getAllReferralCodes()
    
    // Get commission stats for each code
    const codesWithStats = await Promise.all(
      codes.map(async (code) => {
        const commission = await getReferrerCommission(code.id)
        return { ...code, commission }
      })
    )

    return NextResponse.json({ codes: codesWithStats })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.email || !isAdmin(session.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "create") {
      const { referrerName, referrerEmail, referrerMobile, discountAmount, commissionPerCustomer } = body
      const code = await createReferralCode(
        referrerName,
        referrerEmail,
        referrerMobile,
        discountAmount || 2.00,
        commissionPerCustomer || 1.00
      )
      return NextResponse.json({ code })
    }

    if (action === "markPaid") {
      await markReferralPaid(body.usageId)
      return NextResponse.json({ success: true })
    }

    if (action === "delete") {
      await deleteReferralCode(body.codeId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing referral action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}
