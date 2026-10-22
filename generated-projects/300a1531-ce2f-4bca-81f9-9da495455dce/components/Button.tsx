import { ButtonHTMLAttributes } from 'react';

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700" />;
}
