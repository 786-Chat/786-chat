'use client';

import { useEffect, useState } from 'react';

type Customer = { id: number; name: string; vip: boolean };
type Reservation = {
  id: number;
  customer_id: number;
  booking_date: string;
  booking_time: string;
  guests: number;
  status: string;
  customer_name?: string;
  customer_vip?: boolean;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [guests, setGuests] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers', { headers: { 'x-company-id': 'saffron' } })
      .then((res) => res.json())
      .then((data) => setCustomers(data.rows || []));
    fetch('/api/reservations', { headers: { 'x-company-id': 'saffron' } })
      .then((res) => res.json())
      .then((data) => setReservations(data.rows || []))
      .catch(() => setError('Failed to load reservations'));
  }, []);

  const selectedCustomer = customers.find((c) => c.id === Number(customerId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-company-id': 'saffron' },
        body: JSON.stringify({
          customer_id: Number(customerId),
          booking_date: bookingDate,
          booking_time: bookingTime,
          guests: Number(guests),
          special_request: specialRequest,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create reservation');
      setReservations([...reservations, data.reservation]);
      setCustomerId('');
      setBookingDate('');
      setBookingTime('');
      setGuests('');
      setSpecialRequest('');
      setStatus('pending');
      setMessage('Reservation created successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-deepgreen">Reservations</h1>
      <div className="card-gold">
        <h2 className="text-xl font-semibold mb-4">Create Reservation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCustomer?.vip && (
              <span className="ml-2 bg-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">VIP Guest</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Guests</label>
              <input type="number" min="1" className="input" value={guests} onChange={(e) => setGuests(e.target.value)} required />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Special Request</label>
            <textarea className="input" value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} />
          </div>
          {message && <p className="text-green-600">{message}</p>}
          {error && <p className="text-red-600">{error}</p>}
          <button type="submit" className="btn-primary">Create Reservation</button>
        </form>
      </div>
      <div className="card-gold">
        <h2 className="text-xl font-semibold mb-4">Reservation List</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-2">Customer</th>
                <th className="py-2">Date</th>
                <th className="py-2">Time</th>
                <th className="py-2">Guests</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2">
                    {r.customer_name || r.customer_id}
                    {r.customer_vip && <span className="ml-2 bg-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">VIP</span>}
                  </td>
                  <td className="py-2">{r.booking_date}</td>
                  <td className="py-2">{r.booking_time}</td>
                  <td className="py-2">{r.guests}</td>
                  <td className="py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}