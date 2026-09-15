'use client';

import Link from 'next/link';
import { Pencil, Trash2, Bell, BellOff, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type AdminClientProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customers: any[];
  orders: any[];
  unreadOrderIds: string[];
};

const STORAGE_KEY = 'admin-known-order-ids';
const SOUND_PREF_KEY = 'admin-sound-enabled';

export default function AdminClient({ user, customers, orders, unreadOrderIds }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders'>('orders');
  const [soundPref, setSoundPref] = useState(false);
  const [soundArmed, setSoundArmed] = useState(false);
  const [unread, setUnread] = useState<string[]>(unreadOrderIds);
  const [displayOrders, setDisplayOrders] = useState(orders);
  const [displayCustomers, setDisplayCustomers] = useState(customers);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'customer' | 'order'; id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmPlayedRef = useRef<Set<string>>(new Set());
  const baselineDoneRef = useRef(false);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    if (stored === 'true') {
      setSoundPref(true);
      setSoundArmed(true);
    }
  }, []);

  // Initialize known order IDs from localStorage or baseline on first setup
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          knownOrderIdsRef.current = new Set(parsed);
        }
      } catch {}
    }
    // If no stored IDs, treat all current orders as baseline
    if (knownOrderIdsRef.current.size === 0) {
      knownOrderIdsRef.current = new Set(orders.map((o: any) => o.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownOrderIdsRef.current)));
    }
    // Determine new orders that arrived while away
    const newIds = orders.filter((o: any) => !knownOrderIdsRef.current.has(o.id)).map((o: any) => o.id);
    if (newIds.length > 0) {
      setUnread((prev) => Array.from(new Set([...prev, ...newIds])));
      if (soundArmed) playChime();
    }
    // Update known IDs with all current orders
    orders.forEach((o: any) => knownOrderIdsRef.current.add(o.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownOrderIdsRef.current)));
    baselineDoneRef.current = true;
  }, []);

  function playChime() {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 880;
      osc2.type = 'sine';
      osc2.frequency.value = 1174.66;
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1).connect(ctx.destination);
      osc2.connect(gain2).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.error('Audio play failed', e);
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setDisplayOrders(data);
          const newOrders = data.filter((o: any) => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            newOrders.forEach((o: any) => knownOrderIdsRef.current.add(o.id));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(knownOrderIdsRef.current)));
            const newIds = newOrders.map((o: any) => o.id);
            setUnread((prev) => Array.from(new Set([...prev, ...newIds])));
            if (soundArmed) {
              newIds.forEach((id: string) => {
                if (!alarmPlayedRef.current.has(id)) {
                  alarmPlayedRef.current.add(id);
                  playChime();
                }
              });
            }
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [soundArmed]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(deleteTarget.type === 'customer' ? `/api/customers/${deleteTarget.id}` : `/api/orders/${deleteTarget.id}`, { method: 'DELETE' });
      if (response.ok) {
        if (deleteTarget.type === 'customer') {
          setDisplayCustomers((prev) => prev.filter((c: any) => c.id !== deleteTarget.id));
        } else {
          setDisplayOrders((prev) => prev.filter((o: any) => o.id !== deleteTarget.id));
          setUnread((prev) => prev.filter((id) => id !== deleteTarget.id));
        }
        setDeleteTarget(null);
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleOpenOrder(orderId: string) {
    if (unread.includes(orderId)) {
      setUnread((prev) => prev.filter((id) => id !== orderId));
      await fetch(`/api/orders/${orderId}/read`, { method: 'POST' });
    }
  }

  function handleSoundToggle() {
    const next = !soundPref;
    setSoundPref(next);
    setSoundArmed(next);
    localStorage.setItem(SOUND_PREF_KEY, next ? 'true' : 'false');
    if (next) {
      playChime();
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSoundToggle}
            className={`btn ${soundPref ? 'btn-primary' : 'btn-secondary'}`}
            title={soundPref ? 'Disable sound alerts' : 'Enable sound alerts'}
          >
            {soundPref ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {soundPref ? 'Sound On' : 'Sound Off'}
          </button>
          {soundPref && soundArmed && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Bell className="h-4 w-4" /> Armed
            </span>
          )}
          <Link href="/dashboard" className="btn border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            ← Back to Dashboard
          </Link>
          <Link href="/admin/new" className="btn btn-primary">
            New Record
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-2 text-sm font-medium ${activeTab === 'customers' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Customers ({displayCustomers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2 text-sm font-medium ${activeTab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Orders ({displayOrders.length})
          {unread.length > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unread.length} NEW</span>
          )}
        </button>
      </div>

      {activeTab === 'customers' ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Phone</th>
                <th className="table-header">Address</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="table-cell">{customer.name}</td>
                  <td className="table-cell">{customer.email}</td>
                  <td className="table-cell">{customer.phone || '-'}</td>
                  <td className="table-cell">{customer.address || '-'}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link href={`/admin/${customer.id}`} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setDeleteTarget({ type: 'customer', id: customer.id })} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header">Order ID</th>
                <th className="table-header">Customer ID</th>
                <th className="table-header">Status</th>
                <th className="table-header">Total</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayOrders.map((order) => (
                <tr key={order.id} className={unread.includes(order.id) ? 'bg-yellow-50' : ''}>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {order.id.slice(0, 8)}
                      {unread.includes(order.id) && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">NEW</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">{order.customer_id.slice(0, 8)}</td>
                  <td className="table-cell">
                    <span className={`badge badge-${order.status}`}>{order.status.replace('_', ' ')}</span>
                  </td>
                  <td className="table-cell">£{Number(order.total).toFixed(2)}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <Link href={`/orders/${order.id}/edit`} onClick={() => handleOpenOrder(order.id)} className="text-blue-600 hover:text-blue-800">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => setDeleteTarget({ type: 'order', id: order.id })} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Confirm Delete</h2>
              <button onClick={() => setDeleteTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete this {deleteTarget.type}? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
