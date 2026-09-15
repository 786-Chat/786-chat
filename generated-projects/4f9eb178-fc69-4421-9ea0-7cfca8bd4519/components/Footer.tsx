export default function Footer() {
  return (
    <footer className="bg-deepgreen text-white py-4 mt-8 shadow-inner">
      <div className="container mx-auto px-4 text-center">
        &copy; {new Date().getFullYear()} Saffron Manager. All rights reserved.
      </div>
    </footer>
  );
}
