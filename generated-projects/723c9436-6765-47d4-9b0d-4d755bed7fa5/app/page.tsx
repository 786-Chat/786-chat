'use client';

import { useState } from 'react';
import { AlertTriangle, Map, Activity, Battery, Wifi, Signal, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';

// Mock data for demonstration
type Device = {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'alarm';
  battery: number;
  signal: number;
  location: { lat: number; lng: number };
  lastSeen: string;
};

const devices: Device[] = [
  { id: 'D-001', name: 'Trap A1', status: 'online', battery: 85, signal: 4, location: { lat: 41.387, lng: 2.170 }, lastSeen: '2 min ago' },
  { id: 'D-002', name: 'Trap B2', status: 'warning', battery: 20, signal: 2, location: { lat: 41.390, lng: 2.175 }, lastSeen: '15 min ago' },
  { id: 'D-003', name: 'Trap C3', status: 'alarm', battery: 60, signal: 3, location: { lat: 41.385, lng: 2.165 }, lastSeen: '1 min ago' },
  { id: 'D-004', name: 'Trap D4', status: 'offline', battery: 0, signal: 0, location: { lat: 41.392, lng: 2.180 }, lastSeen: '2 hours ago' },
];

const alerts = [
  { id: 1, device: 'Trap C3', message: 'Pest detected', severity: 'critical', time: '1 min ago' },
  { id: 2, device: 'Trap B2', message: 'Low battery', severity: 'warning', time: '15 min ago' },
  { id: 3, device: 'Trap D4', message: 'Device offline', severity: 'critical', time: '2 hours ago' },
];

export default function Home() {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'fleet' | 'analytics'>('map');

  return (
    <div className="min-h-screen bg-grid flex flex-col">
      {/* Header */}
      <header className="bg-[#0a192f] border-b border-cyan-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="text-cyan-400" size={24} />
          <h1 className="text-xl font-bold text-white">Pest Control IoT</h1>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {(['map', 'alerts', 'fleet', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:bg-cyan-900'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* Critical alerts section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            Critical Alerts
          </h2>
          <div className="grid gap-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={clsx(
                  'p-3 rounded-md bg-[#112240] flex items-center justify-between',
                  alert.severity === 'critical' ? 'status-edge alarm' : 'status-edge warning'
                )}
              >
                <div>
                  <span className="font-mono text-sm text-cyan-300">{alert.device}</span>
                  <span className="ml-2 text-gray-200">{alert.message}</span>
                </div>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Live map and fleet health */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 bg-[#112240] rounded-lg p-4 min-h-[300px] relative">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Map size={18} className="text-cyan-400" /> Live Fleet Map
            </h3>
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Map size={48} className="mx-auto mb-2 opacity-50" />
                <p>Interactive map would render here</p>
                <p className="text-xs">(Map integration placeholder)</p>
              </div>
            </div>
            {/* Device markers */}
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => setSelectedDevice(device)}
                className={clsx(
                  'absolute w-4 h-4 rounded-full border-2 border-white',
                  device.status === 'online' && 'bg-green-500',
                  device.status === 'warning' && 'bg-amber-500',
                  device.status === 'alarm' && 'bg-red-500 pulse',
                  device.status === 'offline' && 'bg-gray-500'
                )}
                style={{
                  left: `${((device.location.lng - 2.16) / 0.03) * 100}%`,
                  top: `${((device.location.lat - 41.38) / 0.02) * 100}%`,
                }}
                aria-label={`Device ${device.name}`}
              />
            ))}
          </div>

          {/* Fleet health summary */}
          <div className="bg-[#112240] rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Fleet Health</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Online</span>
                <span className="text-green-400 font-mono">{devices.filter(d => d.status === 'online').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Warning</span>
                <span className="text-amber-400 font-mono">{devices.filter(d => d.status === 'warning').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Alarm</span>
                <span className="text-red-400 font-mono">{devices.filter(d => d.status === 'alarm').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Offline</span>
                <span className="text-gray-400 font-mono">{devices.filter(d => d.status === 'offline').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry and Jobs */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#112240] rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Telemetry</h3>
            <div className="space-y-2">
              {devices.slice(0, 3).map((device) => (
                <div key={device.id} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-cyan-300">{device.id}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Battery size={14} /> {device.battery}%</span>
                    <span className="flex items-center gap-1"><Signal size={14} /> {device.signal}/4</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#112240] rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Recent Jobs</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>Inspection - Site A</span><span className="text-green-400">Completed</span></li>
              <li className="flex justify-between"><span>Treatment - Site B</span><span className="text-amber-400">In Progress</span></li>
              <li className="flex justify-between"><span>Maintenance - Trap C3</span><span className="text-gray-400">Scheduled</span></li>
            </ul>
          </div>
        </div>

        {/* Reports */}
        <div className="bg-[#112240] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">Reports</h3>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-sm">Download Weekly Summary</button>
            <button className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-sm">Export Device List</button>
          </div>
        </div>
      </main>

      {/* Device detail panel */}
      {selectedDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#112240] rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setSelectedDevice(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">{selectedDevice.name}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">ID:</span> <span className="font-mono text-cyan-300">{selectedDevice.id}</span></p>
              <p><span className="text-gray-400">Status:</span> <span className={clsx(
                selectedDevice.status === 'online' && 'text-green-400',
                selectedDevice.status === 'warning' && 'text-amber-400',
                selectedDevice.status === 'alarm' && 'text-red-400',
                selectedDevice.status === 'offline' && 'text-gray-400'
              )}>{selectedDevice.status}</span></p>
              <p><span className="text-gray-400">Battery:</span> {selectedDevice.battery}%</p>
              <p><span className="text-gray-400">Signal:</span> {selectedDevice.signal}/4</p>
              <p><span className="text-gray-400">Last seen:</span> {selectedDevice.lastSeen}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded">Acknowledge</button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded">Diagnose</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0a192f] border-t border-cyan-800 p-4 text-center text-xs text-gray-400">
        <div className="flex flex-wrap justify-center gap-4">
          <span>Gateway: Connected</span>
          <span>MQTT: Active</span>
          <span>Sync: 2 min ago</span>
          <span>Fleet: 4 devices</span>
        </div>
      </footer>
    </div>
  );
}
