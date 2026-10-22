'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Form from '@/components/Form';

export default function EditOrderPage() {
  const { id } = useParams();
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${id}`, { headers: { 'x-company-id': 'demo' } })
      .then(r => r.json())
      .then((o) => { setTotal(o.total); setStatus(o.status); });
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-company-id': 'demo' },
      body: JSON.stringify({ total, status }),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Order</h1>
      <Form onSubmit={handleSubmit}>
        <Input type="number" value={total} onChange={(e) => setTotal(Number(e.target.value))} />
        <Input value={status} onChange={(e) => setStatus(e.target.value)} />
        <Button type="submit">Save</Button>
      </Form>
    </div>
  );
}
