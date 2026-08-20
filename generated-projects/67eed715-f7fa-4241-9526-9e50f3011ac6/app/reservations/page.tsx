import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReservationCard from "@/components/ReservationCard";

const reservations = [
  { id: "1", customer: "Alice Brown", date: "2024-12-01", time: "19:00", partySize: 4 },
  { id: "2", customer: "Charlie Wilson", date: "2024-12-02", time: "20:30", partySize: 2 },
  { id: "3", customer: "Diana Prince", date: "2024-12-03", time: "18:00", partySize: 6 },
];

export default function ReservationsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Reservations</h1>
        <div className="grid gap-4">
          {reservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}