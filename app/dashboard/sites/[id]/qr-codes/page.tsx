"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  QrCode, 
  Plus, 
  Download,
  Eye,
  Trash2,
  Copy,
  Loader2,
  ExternalLink,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface QRCode {
  id: string
  name: string
  table_number: string | null
  qr_type: string
  target_url: string
  scan_count: number
  is_active: boolean
  created_at: string
}

export default function QRCodesPage() {
  const params = useParams()
  const siteId = params.id as string
  const [qrCodes, setQRCodes] = useState<QRCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [newQR, setNewQR] = useState({
    name: "",
    table_number: "",
    qr_type: "menu"
  })

  useEffect(() => {
    fetchQRCodes()
  }, [siteId])

  const fetchQRCodes = async () => {
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/qr-codes`)
      if (res.ok) {
        const data = await res.json()
        setQRCodes(data.qrCodes || [])
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newQR.name.trim()) {
      toast.error("Please enter a name for the QR code")
      return
    }
    setIsCreating(true)
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/qr-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQR)
      })
      if (res.ok) {
        toast.success("QR code created successfully")
        setShowDialog(false)
        setNewQR({ name: "", table_number: "", qr_type: "menu" })
        fetchQRCodes()
      }
    } catch (error) {
      toast.error("Failed to create QR code")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QR code?")) return
    try {
      const res = await fetch(`/api/customer/sites/${siteId}/qr-codes/${id}`, {
        method: "DELETE"
      })
      if (res.ok) {
        toast.success("QR code deleted")
        fetchQRCodes()
      }
    } catch (error) {
      toast.error("Failed to delete QR code")
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard")
  }

  const downloadQR = (qr: QRCode) => {
    // Generate QR code image URL using a free QR code API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr.target_url)}`
    
    // Create a link element and trigger download
    const link = document.createElement("a")
    link.href = qrImageUrl
    link.download = `qr-${qr.name.toLowerCase().replace(/\s+/g, "-")}.png`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code download started")
  }

  const totalScans = qrCodes.reduce((acc, qr) => acc + qr.scan_count, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QR Codes</h1>
          <p className="text-muted-foreground">Create QR codes for menus and table ordering</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create QR Code</DialogTitle>
              <DialogDescription>
                Generate a new QR code for your menu or table ordering
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Main Menu, Table 5"
                  value={newQR.name}
                  onChange={(e) => setNewQR({ ...newQR, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Table Number (optional)</Label>
                <Input
                  placeholder="e.g., 1, 2, A1"
                  value={newQR.table_number}
                  onChange={(e) => setNewQR({ ...newQR, table_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>QR Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newQR.qr_type === "menu" ? "default" : "outline"}
                    onClick={() => setNewQR({ ...newQR, qr_type: "menu" })}
                    className="flex-1"
                  >
                    Menu View
                  </Button>
                  <Button
                    type="button"
                    variant={newQR.qr_type === "order" ? "default" : "outline"}
                    onClick={() => setNewQR({ ...newQR, qr_type: "order" })}
                    className="flex-1"
                  >
                    Direct Order
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <QrCode className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total QR Codes</p>
                <p className="text-2xl font-bold">{qrCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Eye className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold">{totalScans.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Codes</p>
                <p className="text-2xl font-bold">{qrCodes.filter(q => q.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Codes Grid */}
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No QR codes yet</h3>
              <p className="text-muted-foreground mb-4">Create QR codes for your tables or menu</p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qr) => (
            <Card key={qr.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  {/* QR Code Preview */}
                  <div className="w-40 h-40 bg-white rounded-lg p-2 mb-4 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr.target_url)}`}
                      alt={qr.name}
                      className="w-full h-full"
                    />
                  </div>

                  <h3 className="font-semibold text-lg">{qr.name}</h3>
                  {qr.table_number && (
                    <Badge variant="secondary" className="mt-1">
                      Table {qr.table_number}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {qr.scan_count} scans
                  </p>

                  <div className="flex gap-2 mt-4 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => downloadQR(qr)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(qr.target_url)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(qr.target_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(qr.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
