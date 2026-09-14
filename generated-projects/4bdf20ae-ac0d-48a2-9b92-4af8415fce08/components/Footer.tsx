export default function Footer() {
  return (
    <footer className="bg-brown text-cream py-6">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} Bean House. All rights reserved.</p>
      </div>
    </footer>
  );
}
