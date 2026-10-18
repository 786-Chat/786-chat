import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, Shield, CreditCard, AlertTriangle, FileText, Car } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button 
          type="button"
          variant="ghost" 
          className="mb-6 text-white hover:bg-white/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.history.back();
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
          <p className="text-gray-400">Link24 Branch - Restaurant Management Platform</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                The developer (Mujeeb Sardar, Self-Employed) is <strong>NOT responsible</strong> for any issues, errors, or problems that may arise during the operation of this application.
              </p>
              <p className="text-gray-300">
                All control of this application lies with the shop keeper/restaurant owner. For any order issues, payment issues, or delivery issues, please contact the shop directly.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Shield className="h-5 w-5" />
                Shop Responsibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Each branch/shop is fully responsible for their own operations</li>
                <li>Setting up and managing your own Stripe payment account is your responsibility</li>
                <li>Do not provide any personal information to the developer - only API keys and payment method details are required</li>
                <li>Payments from customers go directly to your Stripe account</li>
                <li>All customer communication through this app is the shop's responsibility</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <Car className="h-5 w-5" />
                Driver Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                <strong>Important:</strong> All drivers are added and managed directly by the restaurant/shop keeper.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Drivers are responsible for their own actions during deliveries</li>
                <li>All payment arrangements between drivers and shop keepers are made directly between them</li>
                <li>The developer is NOT involved in any driver payment deals or disputes</li>
                <li>Shop keepers are fully responsible for checking and verifying driver legal documents (driving license, insurance, right to work, etc.)</li>
                <li>Shop keepers must ensure drivers have valid licenses before adding them to the system</li>
                <li>Any issues with drivers should be resolved directly with the shop keeper</li>
              </ul>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-300 font-medium">
                  🚗 The restaurant/shop is fully responsible for vetting, managing, and paying their drivers. The developer has no involvement in driver operations.
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-3">
                <p className="text-red-300 font-medium">
                  ⚠️ Mujeeb Sardar (Developer) is NOT responsible for any payment issues, disputes, or disagreements between drivers and shop keepers. All driver payments are handled directly between the shop and driver.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <CreditCard className="h-5 w-5" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                <strong>Developer Commission/Subscription:</strong> Monthly or weekly payments are required to maintain your Link24-Branch subscription.
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300 font-medium">
                  ⚠️ If 2 or more payments are due/overdue, the developer has the authority to close your Link24-Branch without permission.
                </p>
                <p className="text-red-300/70 text-sm mt-2">
                  In case any data is lost due to non-payment, the developer is NOT responsible.
                </p>
              </div>
              <p className="text-gray-300">
                For payment-related queries, please contact Stripe or your payment method provider directly.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <FileText className="h-5 w-5" />
                Contract Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                You may cancel your contract at any time by sending an email notification.
              </p>
              <p className="text-gray-300">
                <strong>Mujeeb Sardar</strong> operates as self-employed and is not responsible for anything during business operations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Phone className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Free Toll Number</p>
                    <a href="tel:08004714726" className="text-lg font-bold text-white hover:text-green-400 transition-colors">
                      0800 4714 726
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <a href="mailto:mujeeb@job4u.com" className="text-lg font-bold text-white hover:text-blue-400 transition-colors">
                      mujeeb@job4u.com
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-gray-500 text-sm py-4">
            <p>© {new Date().getFullYear()} Link24-Branch. All rights reserved.</p>
            <p className="mt-1">Developed by Mujeeb Sardar (Self-Employed)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
