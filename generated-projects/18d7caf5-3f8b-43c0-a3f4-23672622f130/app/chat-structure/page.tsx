"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatStructurePage() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Chat Structure</h1>
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="p-3 bg-slate-800 rounded-lg">{msg}</div>
            ))}
            <button 
              onClick={() => setMessages([...messages, "New message"])}
              className="px-4 py-2 bg-process-blue text-white rounded-md hover:bg-blue-600"
            >
              Add Message
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
