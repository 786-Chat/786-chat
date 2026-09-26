'use client';
import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Form from '@/components/Form';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState(1);

  const load = () => {
    fetch('/api/reservations', { headers: { 'x-company-id': 'demo' } })
      .then(r => r.json())
      .then(setReservations);
  };

  useEffect(load, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-company-id': 'demo' },
      body: JSON.stringify({ customer_id: customerId, date, party_size: partySize }),
    }).then(load);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reservations</h1>
      <Form onSubmit={handleSubmit}>
        <Input placeholder="Customer ID" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="number" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} />
        <Button type="submit">Add Reservation</Button>
      </Form>
      <DataTable headers={['Customer', 'Date', 'Party Size', 'Status']}>
        {reservations.map((r: any) => (
          <tr key={r.id}>
            <td className="border px-4 py-2">{r.customer_id}</td>
            <td className="border px-4 py-2">{r.date}</td>
            <td className="border px-4 py-2">{r.party_size}</td>
            <td className="border px-4 py-2">{r.status}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
