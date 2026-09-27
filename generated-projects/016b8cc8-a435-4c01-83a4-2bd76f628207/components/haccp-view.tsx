"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface DailyCheck {
  id: string;
  check_date: string;
  staff_member: string;
  production_today: string;
  heat_treatment_recorded: string | null;
  cooling_completed_below_8: string | null;
  cooling_completed_within_90: string | null;
  freezer_storage_check: string | null;
  cleaning_check_completed: string | null;
  any_problem: string;
  problem_action: string;
  completed: boolean;
}

interface ManagerReview {
  id: string;
  review_period: string;
  reviewed_by: string;
  repeated_problems: string;
  action_required: string;
  staff_training_required: string;
  review_completed: boolean;
}

interface HaccpOption {
  id: string;
  option_type: string;
  value: string;
}

export function HaccpView() {
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dailySaved, setDailySaved] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  const [dailyForm, setDailyForm] = useState({
    checkDate: new Date().toISOString().slice(0, 10),
    staffMember: "",
    productionToday: "Yes",
    heatTreatmentRecorded: "OK",
    coolingCompletedBelow8: "OK",
    coolingCompletedWithin90: "OK",
    freezerStorageCheck: "OK",
    cleaningCheckCompleted: "OK",
    anyProblem: "No",
    problemAction: "",
    completed: true
  });

  const [reviewForm, setReviewForm] = useState({
    reviewPeriod: "",
    reviewedBy: "",
    repeatedProblems: "",
    actionRequired: "",
    staffTrainingRequired: "No",
    reviewCompleted: true
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  async function fetchOptions() {
    try {
      const res = await fetch("/api/haccp-options");
      if (!res.ok) throw new Error("Failed to load options");
      const data: HaccpOption[] = await res.json();
      const staff = data.filter(o => o.option_type === "staff_name").map(o => o.value);
      setStaffNames(staff);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function handleDailyChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setDailyForm(prev => ({ ...prev, [name]: val }));
  }

  function handleReviewChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setReviewForm(prev => ({ ...prev, [name]: val }));
  }

  async function handleDailySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDailySaved(false);
    try {
      const res = await fetch("/api/haccp-daily-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dailyForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save daily check");
      }
      await syncDailyDocument();
      setDailySaved(true);
      setDailyForm(prev => ({ ...prev, checkDate: new Date().toISOString().slice(0, 10), staffMember: "", anyProblem: "No", problemAction: "" }));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function syncDailyDocument() {
    try {
      const payload = {
        documentType: "haccp_daily",
        title: "HACCP Daily Food Safety Check",
        checkDate: dailyForm.checkDate,
        dayName: new Date(`${dailyForm.checkDate}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" }),
        data: [
          { taskKey: "date", task: "Date", completed: true, value: dailyForm.checkDate },
          { taskKey: "staff", task: "Staff Member", completed: true, value: dailyForm.staffMember },
          { taskKey: "production", task: "Production Today", completed: true, value: dailyForm.productionToday },
          { taskKey: "heat", task: "Heat Treatment Recorded", completed: true, value: dailyForm.heatTreatmentRecorded },
          { taskKey: "cooling8", task: "Cooling Completed Below 8°C", completed: true, value: dailyForm.coolingCompletedBelow8 },
          { taskKey: "cooling90", task: "Cooling Completed Within 90 Minutes", completed: true, value: dailyForm.coolingCompletedWithin90 },
          { taskKey: "freezer", task: "Freezer / Storage Check", completed: true, value: dailyForm.freezerStorageCheck },
          { taskKey: "cleaning", task: "Cleaning Check Completed", completed: true, value: dailyForm.cleaningCheckCompleted },
          { taskKey: "problem", task: "Any Food Safety Problem Today", completed: true, value: dailyForm.anyProblem },
          { taskKey: "action", task: "Problem / Action Taken", completed: true, value: dailyForm.problemAction || "" },
          { taskKey: "complete", task: "Daily Check Complete", completed: true, value: dailyForm.completed ? "Yes" : "No" }
        ],
        status: dailyForm.completed ? "Completed" : "Incomplete"
      };
      await fetch("/api/my-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync My Documents", err);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReviewSaved(false);
    try {
      const res = await fetch("/api/haccp-manager-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save review");
      }
      await syncReviewDocument();
      setReviewSaved(true);
      setReviewForm({ reviewPeriod: "", reviewedBy: "", repeatedProblems: "", actionRequired: "", staffTrainingRequired: "No", reviewCompleted: true });
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function syncReviewDocument() {
    try {
      const payload = {
        documentType: "haccp_manager_review",
        title: "HACCP 4-Weekly Manager Review",
        checkDate: new Date().toISOString().slice(0, 10),
        dayName: new Date().toLocaleDateString("en-GB", { weekday: "long" }),
        data: [
          { taskKey: "period", task: "Review Period", completed: true, value: reviewForm.reviewPeriod },
          { taskKey: "reviewedBy", task: "Reviewed By", completed: true, value: reviewForm.reviewedBy },
          { taskKey: "repeatedProblems", task: "Any Repeated Problems", completed: true, value: reviewForm.repeatedProblems || "" },
          { taskKey: "actionRequired", task: "Action Required", completed: true, value: reviewForm.actionRequired || "" },
          { taskKey: "training", task: "Staff Training Required", completed: true, value: reviewForm.staffTrainingRequired },
          { taskKey: "complete", task: "Review Completed", completed: true, value: reviewForm.reviewCompleted ? "Yes" : "No" }
        ],
        status: reviewForm.reviewCompleted ? "Completed" : "Incomplete"
      };
      await fetch("/api/my-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to sync My Documents", err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">HACCP</h1>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

      {dailySaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Daily HACCP check saved</span>
        </div>
      )}

      {reviewSaved && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-semibold">Manager review saved</span>
        </div>
      )}

      {/* Daily Food Safety Check */}
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Daily Food Safety Check</h2>
          <form onSubmit={handleDailySubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Date</label>
              <input name="checkDate" type="date" value={dailyForm.checkDate} onChange={handleDailyChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Staff Member</label>
              <select name="staffMember" value={dailyForm.staffMember} onChange={handleDailyChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Production Today?</label>
              <select name="productionToday" value={dailyForm.productionToday} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {dailyForm.productionToday === "Yes" && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold">Heat Treatment Recorded</label>
                  <select name="heatTreatmentRecorded" value={dailyForm.heatTreatmentRecorded} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                    <option value="OK">OK</option>
                    <option value="Attention">Attention</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold">Cooling Completed Below 8°C</label>
                  <select name="coolingCompletedBelow8" value={dailyForm.coolingCompletedBelow8} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                    <option value="OK">OK</option>
                    <option value="Attention">Attention</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-semibold">Cooling Completed Within 90 Minutes</label>
                  <select name="coolingCompletedWithin90" value={dailyForm.coolingCompletedWithin90} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                    <option value="OK">OK</option>
                    <option value="Attention">Attention</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Freezer / Storage Check</label>
              <select name="freezerStorageCheck" value={dailyForm.freezerStorageCheck} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="OK">OK</option>
                <option value="Attention">Attention</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Cleaning Check Completed</label>
              <select name="cleaningCheckCompleted" value={dailyForm.cleaningCheckCompleted} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="OK">OK</option>
                <option value="Attention">Attention</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Any Food Safety Problem Today?</label>
              <select name="anyProblem" value={dailyForm.anyProblem} onChange={handleDailyChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {dailyForm.anyProblem === "Yes" && (
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 text-sm font-semibold">Problem / Action Taken</label>
                <textarea name="problemAction" value={dailyForm.problemAction} onChange={handleDailyChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
              </div>
            )}
            <div className="flex items-center gap-2 sm:col-span-2">
              <input name="completed" type="checkbox" checked={dailyForm.completed} onChange={handleDailyChange} className="h-5 w-5" />
              <label className="text-sm font-semibold">Daily Check Complete</label>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Daily Check</button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4-Weekly Manager Review */}
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">4-Weekly Manager Review</h2>
          <form onSubmit={handleReviewSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Review Period</label>
              <input name="reviewPeriod" value={reviewForm.reviewPeriod} onChange={handleReviewChange} required placeholder="e.g. 1-28 Feb 2025" className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Reviewed By</label>
              <select name="reviewedBy" value={reviewForm.reviewedBy} onChange={handleReviewChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Any Repeated Problems?</label>
              <textarea name="repeatedProblems" value={reviewForm.repeatedProblems} onChange={handleReviewChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Action Required</label>
              <textarea name="actionRequired" value={reviewForm.actionRequired} onChange={handleReviewChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Staff Training Required?</label>
              <select name="staffTrainingRequired" value={reviewForm.staffTrainingRequired} onChange={handleReviewChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input name="reviewCompleted" type="checkbox" checked={reviewForm.reviewCompleted} onChange={handleReviewChange} className="h-5 w-5" />
              <label className="text-sm font-semibold">Review Completed</label>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Review</button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
