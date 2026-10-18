"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProcessFlowView() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/process-flows")
      .then((res) => res.json())
      .then((data) => {
        setFlows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Process Flows</h1>
        <button 
          onClick={() => console.log("Add flow")}
          className="px-4 py-2 bg-process-blue text-white rounded-md hover:bg-blue-600"
        >
          Add Flow
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Flows</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : flows.length === 0 ? (
            <p className="text-slate-400">No process flows found.</p>
          ) : (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div key={flow.id} className="p-4 border border-slate-800 rounded-lg">
                  <h3 className="font-medium">{flow.name}</h3>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
