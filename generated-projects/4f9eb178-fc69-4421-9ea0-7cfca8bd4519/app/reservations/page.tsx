'use client';

import { useEffect, useState } from 'react';

type Customer = { id: number; name: string; vip: boolean };
type Reservation = {
  id: number;
  customer_id: number;
  booking_date: string;
  booking_time: string;
  guests: number;
  special_request?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  customer_name?: string;
  customer_vip?: boolean;
};

const tenantHeaders = { 'x-company-id': 'saffron' };

function formatDate(value: string) {
  const raw = String(value || '').slice(0, 10);
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [guests, setGuests] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [status, setStatus] = useState<Reservation['status']>('pending');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadReservations = async () => {
    const res = await fetch('/api/reservations', { headers: tenantHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load reservations');
    setReservations(data.rows || []);
  };

  useEffect(() => {
    fetch('/api/customers', { headers: tenantHeaders })
      .then((res) => res.json())
      .then((data) => setCustomers(data.rows || []))
      .catch(() => setError('Failed to load customers'));
    loadReservations().catch((err) => setError(err.message));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === Number(customerId));

  const resetForm = () => {
    setEditingId(null);
    setCustomerId('');
    setBookingDate('');
    setBookingTime('');
    setGuests('');
    setSpecialRequest('');
    setStatus('pending');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const payload = {
        customer_id: Number(customerId),
        booking_date: bookingDate,
        booking_time: bookingTime,
        guests: Number(guests),
        special_request: specialRequest,
        status,
      };
      const isEditing = editingId !== null;
      const res = await fetch(isEditing ? `/api/reservations/${editingId}` : '/api/reservations', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEditing ? 'Failed to update reservation' : 'Failed to create reservation'));
      await loadReservations();
      resetForm();
      setMessage(isEditing ? 'Reservation updated successfully' : 'Reservation created successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (reservation: Reservation) => {
    setMessage('');
    setError('');
    setEditingId(reservation.id);
    setCustomerId(String(reservation.customer_id));
    setBookingDate(String(reservation.booking_date).slice(0, 10));
    setBookingTime(String(reservation.booking_time).slice(0, 5));
    setGuests(String(reservation.guests));
    setSpecialRequest(reservation.special_request || '');
    setStatus(reservation.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateStatus = async (reservation: Reservation, nextStatus: Reservation['status']) => {
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update reservation');
      await loadReservations();
      setMessage(nextStatus === 'cancelled' ? 'Reservation cancelled' : 'Reservation updated');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteReservation = async (reservation: Reservation) => {
    if (!window.confirm('Delete this reservation permanently?')) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
        headers: tenantHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete reservation');
      await loadReservations();
      if (editingId === reservation.id) resetForm();
      setMessage('Reservation deleted successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-w-0 space-y-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-deepgreen">Reservations</h1>
      <div className="card-gold min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Reservation' : 'Create Reservation'}</h2>
          {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-white/70">Cancel edit</button>}
        </div>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <div>
            <label className="label">Customer</label>
            <select className="input w-full min-w-0" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.vip ? ' — VIP' : ''}</option>)}
            </select>
            {selectedCustomer?.vip && <span className="mt-2 inline-flex rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-white">VIP Guest</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Date</label><input type="date" className="input w-full min-w-0" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required /></div>
            <div><label className="label">Time</label><input type="time" className="input w-full min-w-0" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className="label">Guests</label><input type="number" min="1" className="input w-full min-w-0" value={guests} onChange={(e) => setGuests(e.target.value)} required /></div>
            <div><label className="label">Status</label><select className="input w-full min-w-0" value={status} onChange={(e) => setStatus(e.target.value as Reservation['status'])}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div><label className="label">Special Request</label><textarea className="input min-h-24 w-full min-w-0" value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} /></div>
          {message && <p className="break-words text-green-600">{message}</p>}
          {error && <p className="break-words text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Create Reservation'}</button>
        </form>
      </div>
      <div className="card-gold min-w-0 overflow-hidden">
        <h2 className="mb-4 text-xl font-semibold">Reservation List</h2>
        <div className="space-y-3 sm:hidden">
          {reservations.map((r) => <article key={r.id} className="min-w-0 rounded-xl border border-gray-200 bg-white/85 p-4 shadow-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-2"><h3 className="min-w-0 break-words font-semibold text-gray-900">{r.customer_name || `Customer ${r.customer_id}`}</h3>{r.customer_vip && <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-white">VIP</span>}</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm"><div><dt className="text-gray-500">Date</dt><dd className="font-medium text-gray-900">{formatDate(r.booking_date)}</dd></div><div><dt className="text-gray-500">Time</dt><dd className="font-medium text-gray-900">{String(r.booking_time).slice(0, 5)}</dd></div><div><dt className="text-gray-500">Guests</dt><dd className="font-medium text-gray-900">{r.guests}</dd></div><div><dt className="text-gray-500">Status</dt><dd className="break-words font-medium capitalize text-gray-900">{r.status}</dd></div></dl>
            {r.special_request && <p className="mt-3 break-words text-sm text-gray-600">{r.special_request}</p>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(r)} className="rounded-lg border border-deepgreen px-3 py-2 text-sm font-medium text-deepgreen">Edit</button>{r.status !== 'cancelled' && <button type="button" onClick={() => updateStatus(r, 'cancelled')} className="rounded-lg border border-amber-500 px-3 py-2 text-sm font-medium text-amber-700">Cancel</button>}<button type="button" onClick={() => deleteReservation(r)} className="rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600">Delete</button></div>
          </article>)}
          {reservations.length === 0 && <p className="py-6 text-center text-gray-500">No reservations found</p>}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left"><thead><tr className="border-b"><th className="py-2">Customer</th><th className="py-2">Date</th><th className="py-2">Time</th><th className="py-2">Guests</th><th className="py-2">Status</th><th className="py-2">Actions</th></tr></thead><tbody>
          {reservations.map((r) => <tr key={r.id} className="border-b align-top"><td className="py-2">{r.customer_name || `Customer ${r.customer_id}`}{r.customer_vip && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-white">VIP</span>}</td><td className="py-2">{formatDate(r.booking_date)}</td><td className="py-2">{String(r.booking_time).slice(0, 5)}</td><td className="py-2">{r.guests}</td><td className="py-2 capitalize">{r.status}</td><td className="py-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(r)} className="text-sm font-medium text-deepgreen">Edit</button>{r.status !== 'cancelled' && <button type="button" onClick={() => updateStatus(r, 'cancelled')} className="text-sm font-medium text-amber-700">Cancel</button>}<button type="button" onClick={() => deleteReservation(r)} className="text-sm font-medium text-red-600">Delete</button></div></td></tr>)}
          {reservations.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">No reservations found</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
