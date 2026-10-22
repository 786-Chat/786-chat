import { InputHTMLAttributes } from 'react';

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full border rounded px-3 py-2" />;
}
