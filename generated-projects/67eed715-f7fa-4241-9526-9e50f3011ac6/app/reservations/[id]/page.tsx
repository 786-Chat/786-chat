import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ReservationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-serif mb-6">Reservation #{params.id}</h1>
        <div className="card">
          <p className="text-gray-600">Reservation details for reservation {params.id}.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}