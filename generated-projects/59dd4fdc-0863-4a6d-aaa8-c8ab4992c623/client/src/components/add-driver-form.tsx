import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car } from "lucide-react";

interface AddDriverFormProps {
  onSubmit: (data: DriverFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  currencySymbol?: string;
}

export interface DriverFormData {
  name: string;
  phone: string;
  password: string;
  vehicleType: "car" | "motorcycle" | "bicycle";
  vehiclePlate?: string;
  paymentType: "mileage" | "salary" | "salary_plus_commission";
  mileageRate1: string;
  mileageRate2: string;
  mileageRate3: string;
  mileageRange1Max: string;
  mileageRange2Max: string;
  mileageRange3Max: string;
  salaryAmount?: string;
  salaryPeriod: "weekly" | "monthly";
  agreedDeliveryCharge?: string;
  licenseType: "uk_full" | "international";
  licenseCopyUrl?: string;
  address?: string;
  city?: string;
  county?: string;
  postcode?: string;
  yearsAtAddress?: string;
  residencyStatus: "student_work_permit" | "british_citizen" | "permanent_resident" | "other";
  residencyOther?: string;
}

export const AddDriverForm = memo(function AddDriverForm({ onSubmit, onCancel, isPending, currencySymbol = "£" }: AddDriverFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<"car" | "motorcycle" | "bicycle">("car");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [paymentType, setPaymentType] = useState<"mileage" | "salary" | "salary_plus_commission">("mileage");
  const [mileageRate1, setMileageRate1] = useState("0.50");
  const [mileageRate2, setMileageRate2] = useState("1.50");
  const [mileageRate3, setMileageRate3] = useState("2.00");
  const [mileageRange1Max, setMileageRange1Max] = useState("1");
  const [mileageRange2Max, setMileageRange2Max] = useState("3");
  const [mileageRange3Max, setMileageRange3Max] = useState("5");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<"weekly" | "monthly">("weekly");
  const [agreedDeliveryCharge, setAgreedDeliveryCharge] = useState("");
  const [licenseType, setLicenseType] = useState<"uk_full" | "international">("uk_full");
  const [licenseCopyUrl, setLicenseCopyUrl] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [postcode, setPostcode] = useState("");
  const [yearsAtAddress, setYearsAtAddress] = useState("");
  const [residencyStatus, setResidencyStatus] = useState<"student_work_permit" | "british_citizen" | "permanent_resident" | "other">("british_citizen");
  const [residencyOther, setResidencyOther] = useState("");

  const handleSubmit = () => {
    if (!name || !phone || !password) return;
    onSubmit({
      name,
      phone,
      password,
      vehicleType,
      vehiclePlate: vehiclePlate || undefined,
      paymentType,
      mileageRate1,
      mileageRate2,
      mileageRate3,
      mileageRange1Max,
      mileageRange2Max,
      mileageRange3Max,
      salaryAmount: salaryAmount || undefined,
      salaryPeriod,
      agreedDeliveryCharge: agreedDeliveryCharge || undefined,
      licenseType,
      licenseCopyUrl: licenseCopyUrl || undefined,
      address: address || undefined,
      city: city || undefined,
      county: county || undefined,
      postcode: postcode || undefined,
      yearsAtAddress: yearsAtAddress || undefined,
      residencyStatus,
      residencyOther: residencyOther || undefined,
    });
  };

  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()} autoComplete="off">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Add New Driver</Label>
        <Button 
          variant="ghost" 
          size="sm"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-cyan-400">Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Driver name"
            autoComplete="off"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-new-driver-name"
          />
        </div>
        <div>
          <Label className="text-xs text-cyan-400">Phone Number (for login) *</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            autoComplete="off"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-new-driver-phone"
          />
        </div>
        <div>
          <Label className="text-xs text-cyan-400">Password *</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Login password"
            autoComplete="new-password"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-new-driver-password"
          />
        </div>
        <div>
          <Label className="text-xs text-cyan-400">Vehicle Type</Label>
          <Select value={vehicleType} onValueChange={(v: "car" | "motorcycle" | "bicycle") => setVehicleType(v)}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-vehicle-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="bicycle">Bicycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-cyan-400">Vehicle Plate (optional)</Label>
          <Input
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
            placeholder="License plate"
            autoComplete="off"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-vehicle-plate"
          />
        </div>

        <div className="border-t border-slate-600 pt-3">
          <Label className="text-sm font-medium text-white flex items-center gap-2">
            <Car className="h-4 w-4 text-cyan-400" />
            Payment Configuration
          </Label>
        </div>
        
        <div>
          <Label className="text-xs text-cyan-400">Payment Type</Label>
          <Select value={paymentType} onValueChange={(v: "mileage" | "salary" | "salary_plus_commission") => setPaymentType(v)}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-payment-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mileage">Mileage Based</SelectItem>
              <SelectItem value="salary">Fixed Salary</SelectItem>
              <SelectItem value="salary_plus_commission">Salary + Per Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentType === "mileage" && (
          <div className="space-y-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <Label className="text-xs font-medium text-white">Mileage Rates ({currencySymbol} per mile)</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-cyan-400">0-{mileageRange1Max} miles</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mileageRate1}
                  onChange={(e) => setMileageRate1(e.target.value)}
                  placeholder={`${currencySymbol}0.50`}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-rate-1"
                />
              </div>
              <div>
                <Label className="text-xs text-cyan-400">{mileageRange1Max}-{mileageRange2Max} miles</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mileageRate2}
                  onChange={(e) => setMileageRate2(e.target.value)}
                  placeholder={`${currencySymbol}1.50`}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-rate-2"
                />
              </div>
              <div>
                <Label className="text-xs text-cyan-400">{mileageRange2Max}-{mileageRange3Max} miles</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mileageRate3}
                  onChange={(e) => setMileageRate3(e.target.value)}
                  placeholder={`${currencySymbol}2.00`}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-rate-3"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-amber-400">Range 1 Max (miles)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={mileageRange1Max}
                  onChange={(e) => setMileageRange1Max(e.target.value)}
                  placeholder="1"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-range-1"
                />
              </div>
              <div>
                <Label className="text-xs text-amber-400">Range 2 Max (miles)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={mileageRange2Max}
                  onChange={(e) => setMileageRange2Max(e.target.value)}
                  placeholder="3"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-range-2"
                />
              </div>
              <div>
                <Label className="text-xs text-amber-400">Range 3 Max (miles)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={mileageRange3Max}
                  onChange={(e) => setMileageRange3Max(e.target.value)}
                  placeholder="5"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-mileage-range-3"
                />
              </div>
            </div>
          </div>
        )}

        {(paymentType === "salary" || paymentType === "salary_plus_commission") && (
          <div className="space-y-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <Label className="text-xs font-medium text-white">Salary Details</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-emerald-400">Salary Amount ({currencySymbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-salary-amount"
                />
              </div>
              <div>
                <Label className="text-xs text-emerald-400">Payment Period</Label>
                <Select 
                  value={salaryPeriod} 
                  onValueChange={(v: "weekly" | "monthly") => setSalaryPeriod(v)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-salary-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paymentType === "salary_plus_commission" && (
              <div>
                <Label className="text-xs text-amber-400">Agreed Delivery Charge ({currencySymbol})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={agreedDeliveryCharge}
                  onChange={(e) => setAgreedDeliveryCharge(e.target.value)}
                  placeholder="Fixed per-delivery charge"
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                  data-testid="input-agreed-delivery-charge"
                />
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-600 pt-3">
          <Label className="text-sm font-medium text-white">License Information</Label>
        </div>
        
        <div>
          <Label className="text-xs text-purple-400">License Type</Label>
          <Select value={licenseType} onValueChange={(v: "uk_full" | "international") => setLicenseType(v)}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-license-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uk_full">UK Full License</SelectItem>
              <SelectItem value="international">International License</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs text-purple-400">License Copy URL (optional)</Label>
          <Input
            value={licenseCopyUrl}
            onChange={(e) => setLicenseCopyUrl(e.target.value)}
            placeholder="Link to license document"
            autoComplete="off"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-license-copy-url"
          />
        </div>

        <div className="border-t border-slate-600 pt-3">
          <Label className="text-sm font-medium text-white">Address & Residency</Label>
        </div>

        <div>
          <Label className="text-xs text-pink-400">Address (optional)</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            autoComplete="off"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
            data-testid="input-driver-address"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-pink-400">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              autoComplete="off"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              data-testid="input-driver-city"
            />
          </div>
          <div>
            <Label className="text-xs text-pink-400">County</Label>
            <Input
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="County"
              autoComplete="off"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              data-testid="input-driver-county"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-pink-400">Postcode</Label>
            <Input
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="Postcode"
              autoComplete="off"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              data-testid="input-driver-postcode"
            />
          </div>
          <div>
            <Label className="text-xs text-pink-400">Years at Address</Label>
            <Input
              type="number"
              value={yearsAtAddress}
              onChange={(e) => setYearsAtAddress(e.target.value)}
              placeholder="Years"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              data-testid="input-years-at-address"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-pink-400">Residency Status</Label>
          <Select value={residencyStatus} onValueChange={(v: "student_work_permit" | "british_citizen" | "permanent_resident" | "other") => setResidencyStatus(v)}>
            <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-residency-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="british_citizen">British Citizen</SelectItem>
              <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
              <SelectItem value="student_work_permit">Student/Work Permit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {residencyStatus === "other" && (
          <div>
            <Label className="text-xs text-pink-400">Please Specify</Label>
            <Input
              value={residencyOther}
              onChange={(e) => setResidencyOther(e.target.value)}
              placeholder="Specify residency status"
              autoComplete="off"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              data-testid="input-residency-other"
            />
          </div>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!name || !phone || !password || isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          data-testid="button-create-driver"
        >
          {isPending ? "Creating..." : "Create Driver"}
        </Button>
      </div>
    </form>
  );
});
