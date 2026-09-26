import { ReactNode } from 'react';

export default function Form({ onSubmit, children }: { onSubmit: (e: React.FormEvent) => void; children: ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
    </form>
  );
}
