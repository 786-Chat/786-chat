import { Award, Users, HeartHandshake, Target } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: HeartHandshake,
      title: "Compassion",
      desc: "We treat every patient with kindness and respect, ensuring a comfortable experience.",
    },
    {
      icon: Award,
      title: "Excellence",
      desc: "We strive for the highest standards in dental care, using the latest techniques and technology.",
    },
    {
      icon: Users,
      title: "Integrity",
      desc: "We are honest and transparent in all our recommendations and treatments.",
    },
    {
      icon: Target,
      title: "Innovation",
      desc: "We continuously adopt new methods and tools to improve patient outcomes.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-emerald-950 mb-4">About PearlCare</h1>
          <p className="text-lg text-emerald-900/70 max-w-2xl mx-auto">
            We are a team of dedicated dental professionals committed to providing exceptional care in a warm and welcoming environment.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80"
              alt="Our dental team"
              className="rounded-3xl shadow-xl w-full h-[400px] object-cover"
            />
            <div className="absolute -bottom-6 -right-6 bg-emerald-700 text-white rounded-2xl p-6 shadow-xl">
              <p className="text-3xl font-bold">15+</p>
              <p className="text-sm">Years of Excellence</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-emerald-950 mb-6">Our Story</h2>
            <p className="text-emerald-900/70 mb-4">
              PearlCare Dental Clinic was founded in 2010 with a simple mission: to provide premium dental care with a gentle touch. What started as a small practice has grown into a trusted clinic serving thousands of patients.
            </p>
            <p className="text-emerald-900/70 mb-4">
              Our team of experienced dentists, hygienists, and support staff are dedicated to making every visit comfortable and stress-free. We believe in building lasting relationships with our patients based on trust and quality care.
            </p>
            <p className="text-emerald-900/70">
              We invest in the latest dental technology and continuous education to ensure you receive the best possible treatment.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-emerald-950 text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div key={value.title} className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 text-center">
              <div className="bg-emerald-700 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6">
                <value.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-950 mb-3">{value.title}</h3>
              <p className="text-emerald-900/70">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
