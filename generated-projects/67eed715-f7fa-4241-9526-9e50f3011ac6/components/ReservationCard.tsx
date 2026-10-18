import Link from "next/link";

interface Reservation {
  id: string;
  customer: string;
  date: string;
  time: string;
  partySize: number;
}

export default function ReservationCard({ reservation }: { reservation: Reservation }) {
  return (
    <Link href={`/reservations/${reservation.id}`} className="card hover:shadow-lg transition block">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">{reservation.customer}</p>
          <p className="text-sm text-gray-500">{reservation.date} at {reservation.time}</p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Party of {reservation.partySize}</span>
      </div>
    </Link>
  );
}