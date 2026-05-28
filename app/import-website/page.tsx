"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Upload, 
  Globe, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  Image as ImageIcon,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SpaceBackground } from "@/components/ui/space-background"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const IMPORT_TYPES = [
  {
    id: "url",
    name: "Import from URL",
    description: "Provide your existing website URL and we'll extract the content",
    icon: Globe,
    providers: ["WordPress", "Wix", "Squarespace", "GoDaddy", "Weebly", "Other"]
  },
  {
    id: "files",
    name: "Upload Files",
    description: "Upload your website files, images, and content directly",
    icon: Upload,
    formats: ["HTML", "CSS", "Images", "PDF menus", "Word documents"]
  },
  {
    id: "manual",
    name: "Manual Entry",
    description: "Provide your business details and we'll build your website",
    icon: FileText,
    includes: ["Business info", "Menu/services", "Images", "Contact details"]
  }
]

const STEPS = [
  { id: 1, name: "Import Type", icon: Upload },
  { id: 2, name: "Source Details", icon: Globe },
  { id: 3, name: "Content", icon: FileText },
  { id: 4, name: "Review", icon: Check },
]

export default function ImportWebsitePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [importType, setImportType] = useState<string>("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [sourceProvider, setSourceProvider] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    businessType: "",
    description: "",
    phone: "",
    email: "",
    address: "",
  })
  const [notes, setNotes] = useState("")

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return importType !== ""
      case 2:
        if (importType === "url") return sourceUrl !== "" && sourceProvider !== ""
        if (importType === "files") return uploadedFiles.length > 0
        if (importType === "manual") return businessInfo.businessName !== ""
        return false
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in to import a website")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("importType", importType)
      formData.append("sourceUrl", sourceUrl)
      formData.append("sourceProvider", sourceProvider)
      formData.append("businessInfo", JSON.stringify(businessInfo))
      formData.append("notes", notes)
      
      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })

      const response = await fetch("/api/customer/import-website", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to submit import request")

      const data = await response.json()
      toast.success("Import request submitted successfully!")
      router.push(`/dashboard/imports/${data.importId}`)
    } catch (error) {
      toast.error("Failed to submit import request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Website Import
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Import Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Existing Website</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Already have a website? We&apos;ll help you migrate to our platform with a beautiful new design.
              </p>
            </motion.div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-12">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    currentStep === step.id 
                      ? "bg-primary text-primary-foreground" 
                      : currentStep > step.id 
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {/* Step 1: Import Type */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">How would you like to import?</h2>
                        <p className="text-muted-foreground">Choose the method that works best for you</p>
                      </div>
                      
                      <div className="grid gap-4">
                        {IMPORT_TYPES.map((type) => (
                          <Card 
                            key={type.id}
                            className={`cursor-pointer transition-all hover:border-primary/50 ${
                              importType === type.id ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => setImportType(type.id)}
                          >
                            <CardContent className="p-6 flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${
                                importType === type.id ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}>
                                <type.icon className="w-6 h-6" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{type.name}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                                <div className="flex flex-wrap gap-2">
                                  {(type.providers || type.formats || type.includes)?.map((item) => (
                                    <Badge key={item} variant="secondary" className="text-xs">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {importType === type.id && (
                                <Check className="w-5 h-5 text-primary" />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Source Details */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {importType === "url" && (
                        <>
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Enter Your Website URL</h2>
                            <p className="text-muted-foreground">We&apos;ll analyze your existing website</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="url">Website URL</Label>
                              <Input
                                id="url"
                                type="url"
                                placeholder="https://www.yourwebsite.com"
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>Current Provider</Label>
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                {["WordPress", "Wix", "Squarespace", "GoDaddy", "Weebly", "Other"].map((provider) => (
                                  <Button
                                    key={provider}
                                    variant={sourceProvider === provider ? "default" : "outline"}
                                    onClick={() => setSourceProvider(provider)}
                                    className="w-full"
                                  >
                                    {provider}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {importType === "files" && (
                        <>
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Upload Your Files</h2>
                            <p className="text-muted-foreground">Upload website files, images, menus, and documents</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                              <p className="text-muted-foreground mb-4">
                                Drag and drop files here, or click to browse
                              </p>
                              <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                accept=".html,.css,.js,.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                              />
                              <Button asChild variant="outline">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                  Select Files
                                </label>
                              </Button>
                            </div>
                            
                            {uploadedFiles.length > 0 && (
                              <div className="space-y-2">
                                <Label>Uploaded Files ({uploadedFiles.length})</Label>
                                {uploadedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ({(file.size / 1024).toFixed(1)} KB)
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(index)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {importType === "manual" && (
                        <>
                          <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Tell Us About Your Business</h2>
                            <p className="text-muted-foreground">We&apos;ll create a website based on your details</p>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="businessName">Business Name *</Label>
                              <Input
                                id="businessName"
                                value={businessInfo.businessName}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessName: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="businessType">Business Type</Label>
                              <Input
                                id="businessType"
                                placeholder="e.g., Restaurant, Cafe, Pizza Shop"
                                value={businessInfo.businessType}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessType: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="description">Business Description</Label>
                              <Textarea
                                id="description"
                                placeholder="Tell us about your business..."
                                value={businessInfo.description}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="phone">Phone Number</Label>
                              <Input
                                id="phone"
                                value={businessInfo.phone}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, phone: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={businessInfo.email}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="address">Address</Label>
                              <Input
                                id="address"
                                value={businessInfo.address}
                                onChange={(e) => setBusinessInfo(prev => ({ ...prev, address: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Additional Content */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Additional Information</h2>
                        <p className="text-muted-foreground">Any other details that would help us</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="notes">Special Instructions or Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Any specific requirements, preferred colors, features you want, pages to include..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1"
                            rows={6}
                          />
                        </div>
                        
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium mb-1">What happens next?</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>1. Our team will review your import request</li>
                                <li>2. We&apos;ll extract content and images from your source</li>
                                <li>3. You&apos;ll receive a preview to approve</li>
                                <li>4. Once approved, your new website goes live!</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Review */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Review Your Import Request</h2>
                        <p className="text-muted-foreground">Make sure everything looks correct</p>
                      </div>
                      
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Import Method</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="secondary">
                              {IMPORT_TYPES.find(t => t.id === importType)?.name}
                            </Badge>
                          </CardContent>
                        </Card>
                        
                        {importType === "url" && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Source Website</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                  {sourceUrl}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p className="text-sm text-muted-foreground">Provider: {sourceProvider}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {importType === "files" && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Uploaded Files</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-muted-foreground">{uploadedFiles.length} files uploaded</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {importType === "manual" && businessInfo.businessName && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Business Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm">
                              <p><strong>Name:</strong> {businessInfo.businessName}</p>
                              {businessInfo.businessType && <p><strong>Type:</strong> {businessInfo.businessType}</p>}
                              {businessInfo.phone && <p><strong>Phone:</strong> {businessInfo.phone}</p>}
                              {businessInfo.email && <p><strong>Email:</strong> {businessInfo.email}</p>}
                            </CardContent>
                          </Card>
                        )}
                        
                        {notes && (
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">{notes}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      disabled={!canProceed()}
                      className="gap-2"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !user}
                      className="gap-2 bg-gradient-to-r from-primary to-accent"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Import Request
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <Footer />
      </div>
    </main>
  )
}
