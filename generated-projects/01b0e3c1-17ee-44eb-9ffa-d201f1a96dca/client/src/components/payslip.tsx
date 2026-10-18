import { forwardRef } from "react";
import type { StaffMember, StaffWagePayment } from "@shared/schema";

interface PayslipProps {
  staff: StaffMember;
  payment: StaffWagePayment;
  companyName: string;
  yearToDate: {
    taxableGrossPay: number;
    incomeTax: number;
    employeeNic: number;
    employerNic: number;
  };
}

export const Payslip = forwardRef<HTMLDivElement, PayslipProps>(
  ({ staff, payment, companyName, yearToDate }, ref) => {
    const formatDate = (date: Date | string | null) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatPeriod = (date: Date | string | null) => {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    };

    const formatMoney = (amount: string | number | null) => {
      const num = typeof amount === "string" ? parseFloat(amount) : amount || 0;
      return num.toFixed(2);
    };

    const hoursWorked = parseFloat(payment.hoursWorked || "0");
    const hourlyRate = parseFloat(payment.hourlyRate || staff.payRate || "0");
    const grossAmount = parseFloat(payment.grossAmount || "0");
    const taxDeduction = parseFloat(payment.taxDeduction || "0");
    const niDeduction = parseFloat(payment.niDeduction || "0");
    const totalDeductions = taxDeduction + niDeduction;
    const netAmount = parseFloat(payment.netAmount || "0");

    const paymentMethodLabel = {
      cash: "Cash",
      bank_transfer: "Bank Transfer",
      cheque: "Cheque",
    }[staff.paymentMethod || "cash"] || "Cash";

    const payTypeLabel = {
      hourly: "Hourly",
      weekly: "Weekly",
      monthly: "Monthly",
    }[staff.payType || "monthly"] || "Monthly";

    return (
      <div
        ref={ref}
        className="payslip-container"
        style={{
          width: "297mm",
          minHeight: "210mm",
          backgroundColor: "#d4f5d4",
          padding: "10mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "11px",
          color: "#000",
          boxSizing: "border-box",
          display: "flex",
          gap: "5mm",
        }}
      >
        {/* Left Page - Employee Details & YTD */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4mm",
          }}
        >
          {/* Company Name Header */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "8px 15px",
              borderRadius: "4px",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
              {companyName}
            </h1>
          </div>

          {/* Empty spacer box */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              minHeight: "30px",
            }}
          />

          {/* Employee Address Box */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              minHeight: "80px",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>
              {staff.name?.toUpperCase()}
            </p>
            {staff.address && (
              <p style={{ margin: "5px 0 0 0" }}>{staff.address}</p>
            )}
            {staff.postcode && (
              <p style={{ margin: "2px 0 0 0" }}>{staff.postcode}</p>
            )}
          </div>

          {/* Year to Date Section */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Year to Date
            </h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Taxable Gross Pay</span>
              <span style={{ fontWeight: "bold" }}>{formatMoney(yearToDate.taxableGrossPay)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Income Tax</span>
              <span style={{ fontWeight: "bold" }}>{formatMoney(yearToDate.incomeTax)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span>Employee NIC</span>
              <span style={{ fontWeight: "bold" }}>{formatMoney(yearToDate.employeeNic)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Employer NIC</span>
              <span style={{ fontWeight: "bold" }}>{formatMoney(yearToDate.employerNic)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <p style={{ fontSize: "10px", color: "#666", margin: "5px 0 0 0" }}>
            1.25% uplift in NICs funds NHS, health & social care
          </p>

          {/* Empty spacer box at bottom */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              minHeight: "30px",
              marginTop: "auto",
            }}
          />
        </div>

        {/* Right Page - Pay Details & Calculations */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4mm",
          }}
        >
          {/* Pay Period Details */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
              <span>Pay Period</span>
              <span style={{ fontWeight: "bold" }}>{formatPeriod(payment.periodEnd)}</span>
              <span>Pay Date</span>
              <span style={{ fontWeight: "bold" }}>{formatDate(payment.periodEnd)}</span>
              <span>Pay Type</span>
              <span style={{ fontWeight: "bold" }}>{payTypeLabel}</span>
              <span>Payment Method</span>
              <span style={{ fontWeight: "bold" }}>{paymentMethodLabel}</span>
            </div>
            <div style={{ marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
              <span>Tax Code</span>
              <span style={{ fontWeight: "bold" }}>{staff.taxCode || "1257L"}</span>
              <span>NI Number</span>
              <span style={{ fontWeight: "bold" }}>{staff.niNumber || "N/A"}</span>
              <span>NI Table Letter</span>
              <span style={{ fontWeight: "bold" }}>{staff.niTableLetter || "A"}</span>
            </div>
          </div>

          {/* Payments Section */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              flex: 1,
            }}
          >
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Payments
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "5px",
                marginBottom: "10px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>Description</span>
              <span style={{ fontWeight: "bold", textAlign: "right" }}>Hours</span>
              <span style={{ fontWeight: "bold", textAlign: "right" }}>Rate</span>
              <span style={{ fontWeight: "bold", textAlign: "right" }}>Amount</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              <span>Rate 1</span>
              <span style={{ textAlign: "right" }}>{formatMoney(hoursWorked)}</span>
              <span style={{ textAlign: "right" }}>{formatMoney(hourlyRate)}</span>
              <span style={{ textAlign: "right" }}>{formatMoney(grossAmount)}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              <span>Total Hourly Pay</span>
              <span style={{ textAlign: "right", fontWeight: "bold" }}>{formatMoney(grossAmount)}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "5px",
                marginBottom: "15px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>Total Payments</span>
              <span style={{ textAlign: "right", fontWeight: "bold" }}>{formatMoney(grossAmount)}</span>
            </div>

            {/* Deductions Section */}
            <h3
              style={{
                margin: "15px 0 10px 0",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Deductions
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              <span>Income Tax</span>
              <span style={{ textAlign: "right" }}>{formatMoney(taxDeduction)}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "5px",
                marginBottom: "5px",
              }}
            >
              <span>National Insurance</span>
              <span style={{ textAlign: "right" }}>{formatMoney(niDeduction)}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "3fr 1fr",
                gap: "5px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>Total Deductions</span>
              <span style={{ textAlign: "right", fontWeight: "bold" }}>{formatMoney(totalDeductions)}</span>
            </div>
          </div>

          {/* Net Pay Box */}
          <div
            style={{
              border: "2px solid #22c55e",
              backgroundColor: "#fff",
              padding: "15px",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>Net Pay</span>
            <span style={{ fontSize: "18px", fontWeight: "bold" }}>{formatMoney(netAmount)}</span>
          </div>
        </div>
      </div>
    );
  }
);

Payslip.displayName = "Payslip";
