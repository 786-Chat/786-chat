'use client';
import { useState, useEffect } from 'react';

type Reservation = {
  id: number;
  customer_id: number;
  date: string;
  party_size: number;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState('');

  useEffect(() => {
    fetch('/api/reservations')
      .then((res) => res.json())
      .then((data) => setReservations(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: Number(customerId), date, party_size: Number(partySize) }),
    });
    if (res.ok) {
      const newRes = await res.json();
      setReservations([...reservations, newRes]);
      setCustomerId(''); setDate(''); setPartySize('');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reservations</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <input
          type="number"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="number"
          placeholder="Party Size"
          value={partySize}
          onChange={(e) => setPartySize(e.target.value)}
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Customer ID</th>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Party Size</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3">{r.customer_id}</td>
              <td className="p-3">{r.date}</td>
              <td className="p-3">{r.party_size}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
