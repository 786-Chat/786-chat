"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HaccpCheck {
  id: string;
  check_date: string;
  check_time: string;
  process_area: string;
  hazard_type: string;
  control_point: string;
  critical_limit: string;
  actual_result: string;
  status: string;
  checked_by: string;
  notes: string;
  completed: boolean;
}

interface HaccpOption {
  id: string;
  option_type: string;
  value: string;
}

interface FlowConfirmation {
  id: string;
  confirmed_by: string;
  confirmation_date: string;
  review_date: string | null;
  notes: string;
}

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

const flowSteps = [
  { name: "Ingredients", detail: "" },
  { name: "Mixing", detail: "" },
  { name: "Heat Treatment", detail: "Actual measured temperature and time are recorded from the existing Production record." },
  { name: "Cooling", detail: "Cool to below 8°C before freezer transfer. Use the existing Production cooling records." },
  { name: "Freezing / Hardening", detail: "" },
  { name: "Packaging & Labelling", detail: "" },
  { name: "Frozen Storage", detail: "Freezer/equipment storage target: -18°C." },
  { name: "Distribution", detail: "" },
];

export function HaccpView() {
  const [checks, setChecks] = useState<HaccpCheck[]>([]);
  const [dailyChecks, setDailyChecks] = useState<DailyCheck[]>([]);
  const [managerReviews, setManagerReviews] = useState<ManagerReview[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [flowConfirmation, setFlowConfirmation] = useState<FlowConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Daily check form state
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

  // Manager review form state
  const [reviewForm, setReviewForm] = useState({
    reviewPeriod: "",
    reviewedBy: "",
    repeatedProblems: "",
    actionRequired: "",
    staffTrainingRequired: "No",
    reviewCompleted: true
  });

  // Flow confirmation form state
  const [flowForm, setFlowForm] = useState({ confirmedBy: "", confirmationDate: "", reviewDate: "", notes: "" });
  const [flowSaved, setFlowSaved] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [checksRes, dailyRes, reviewsRes, optionsRes, flowRes] = await Promise.all([
        fetch("/api/haccp-checks"),
        fetch("/api/haccp-daily-checks"),
        fetch("/api/haccp-manager-reviews"),
        fetch("/api/haccp-options"),
        fetch("/api/haccp-flow-confirmations")
      ]);
      if (!checksRes.ok || !dailyRes.ok || !reviewsRes.ok || !optionsRes.ok || !flowRes.ok) {
        throw new Error("Failed to load HACCP data");
      }
      const [checksData, dailyData, reviewsData, optionsData, flowData] = await Promise.all([
        checksRes.json(),
        dailyRes.json(),
        reviewsRes.json(),
        optionsRes.json(),
        flowRes.json()
      ]);
      setChecks(checksData);
      setDailyChecks(dailyData);
      setManagerReviews(reviewsData);
      const staff = optionsData.filter((o: HaccpOption) => o.option_type === "staff_name").map((o: HaccpOption) => o.value);
      setStaffNames(staff);
      if (flowData) {
        setFlowConfirmation(flowData);
        setFlowForm({
          confirmedBy: flowData.confirmed_by || "",
          confirmationDate: flowData.confirmation_date || "",
          reviewDate: flowData.review_date || "",
          notes: flowData.notes || ""
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  function handleFlowChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFlowForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleDailySubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setDailyForm(prev => ({ ...prev, checkDate: new Date().toISOString().slice(0, 10), staffMember: "", anyProblem: "No", problemAction: "" }));
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      setReviewForm({ reviewPeriod: "", reviewedBy: "", repeatedProblems: "", actionRequired: "", staffTrainingRequired: "No", reviewCompleted: true });
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleFlowSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/haccp-flow-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flowForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to save confirmation");
      }
      setFlowSaved(true);
      setTimeout(() => setFlowSaved(false), 2000);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">HACCP</h1>

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

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

      {/* Process Flow Diagram */}
      <Card className="border-2 border-slate-600 bg-white text-slate-900">
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">Kulfi Process Flow Diagram</h2>
          <div className="space-y-0">
            {flowSteps.map((step, index) => (
              <div key={step.name} className="flex flex-col items-center">
                <div className="w-full max-w-md rounded border-2 border-slate-400 bg-slate-50 p-3 text-center">
                  <div className="text-base font-bold">{step.name}</div>
                  {step.detail && <div className="mt-1 text-sm text-slate-600">{step.detail}</div>}
                </div>
                {index < flowSteps.length - 1 && (
                  <div className="flex h-8 items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleFlowSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Flow Diagram Confirmed By</label>
              <select name="confirmedBy" value={flowForm.confirmedBy} onChange={handleFlowChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none">
                <option value="">Select staff</option>
                {staffNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Confirmation Date</label>
              <input name="confirmationDate" type="date" value={flowForm.confirmationDate} onChange={handleFlowChange} required className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold">Review Date</label>
              <input name="reviewDate" type="date" value={flowForm.reviewDate} onChange={handleFlowChange} className="h-11 rounded border-2 border-slate-400 px-3 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="mb-1 text-sm font-semibold">Notes</label>
              <textarea name="notes" value={flowForm.notes} onChange={handleFlowChange} rows={2} className="rounded border-2 border-slate-400 px-3 py-2 focus:border-sky-500 focus:outline-none" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button type="submit" className="h-11 cursor-pointer rounded bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-500">Save Confirmation</button>
              {flowSaved && <span className="text-sm font-semibold text-emerald-600">Saved</span>}
            </div>
          </form>

          {flowConfirmation && (
            <div className="mt-4 rounded border border-slate-300 bg-slate-50 p-3 text-sm">
              <p><strong>Confirmed By:</strong> {flowConfirmation.confirmed_by}</p>
              <p><strong>Confirmation Date:</strong> {flowConfirmation.confirmation_date}</p>
              {flowConfirmation.review_date && <p><strong>Review Date:</strong> {flowConfirmation.review_date}</p>}
              {flowConfirmation.notes && <p><strong>Notes:</strong> {flowConfirmation.notes}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HACCP History / Advanced Records */}
      <Card>
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="text-lg font-bold">HACCP History / Advanced Records</span>
            <span className="text-sm text-slate-400">{showHistory ? "Hide" : "Show"}</span>
          </button>
          {showHistory && (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="mb-2 text-base font-bold">Daily Checks</h3>
                {dailyChecks.length === 0 ? (
                  <p className="text-sm text-slate-400">No daily checks recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Staff</th>
                          <th className="px-4 py-3 font-medium">Production</th>
                          <th className="px-4 py-3 font-medium">Problem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {dailyChecks.map(check => (
                          <tr key={check.id} className="text-slate-300">
                            <td className="px-4 py-3">{check.check_date}</td>
                            <td className="px-4 py-3">{check.staff_member}</td>
                            <td className="px-4 py-3">{check.production_today}</td>
                            <td className="px-4 py-3">{check.any_problem}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-base font-bold">Manager Reviews</h3>
                {managerReviews.length === 0 ? (
                  <p className="text-sm text-slate-400">No reviews recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Period</th>
                          <th className="px-4 py-3 font-medium">Reviewed By</th>
                          <th className="px-4 py-3 font-medium">Training Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {managerReviews.map(review => (
                          <tr key={review.id} className="text-slate-300">
                            <td className="px-4 py-3">{review.review_period}</td>
                            <td className="px-4 py-3">{review.reviewed_by}</td>
                            <td className="px-4 py-3">{review.staff_training_required}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-base font-bold">Detailed HACCP Checks</h3>
                {checks.length === 0 ? (
                  <p className="text-sm text-slate-400">No detailed checks recorded yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-800 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 font-medium">Date</th>
                          <th className="px-4 py-3 font-medium">Time</th>
                          <th className="px-4 py-3 font-medium">Process/Area</th>
                          <th className="px-4 py-3 font-medium">Hazard Type</th>
                          <th className="px-4 py-3 font-medium">Control Point</th>
                          <th className="px-4 py-3 font-medium">Critical Limit</th>
                          <th className="px-4 py-3 font-medium">Actual Result</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Checked By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {checks.map(check => {
                          const statusTone = check.status === "Pass" ? "green" : check.status === "Warning" ? "amber" : "red";
                          return (
                            <tr key={check.id} className="text-slate-300">
                              <td className="px-4 py-3">{check.check_date}</td>
                              <td className="px-4 py-3">{check.check_time}</td>
                              <td className="px-4 py-3 font-medium text-slate-100">{check.process_area}</td>
                              <td className="px-4 py-3">{check.hazard_type}</td>
                              <td className="px-4 py-3">{check.control_point}</td>
                              <td className="px-4 py-3">{check.critical_limit}</td>
                              <td className="px-4 py-3">{check.actual_result}</td>
                              <td className="px-4 py-3"><Badge tone={statusTone as any}>{check.status}</Badge></td>
                              <td className="px-4 py-3">{check.checked_by}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
