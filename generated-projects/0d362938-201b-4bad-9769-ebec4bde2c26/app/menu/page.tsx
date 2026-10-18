import PageHero from '@/components/PageHero';

const menuSections = [
  {
    title: 'Starters',
    items: [
      { name: 'Paneer Tikka', description: 'Char-grilled cottage cheese with spices', price: 12 },
      { name: 'Samosa Chaat', description: 'Crispy samosas with yogurt and chutneys', price: 9 },
      { name: 'Tandoori Wings', description: 'Chicken wings marinated in yogurt and spices', price: 14 },
    ],
  },
  {
    title: 'Mains',
    items: [
      { name: 'Butter Chicken', description: 'Creamy tomato curry with grilled chicken', price: 22 },
      { name: 'Lamb Rogan Josh', description: 'Slow-cooked lamb in rich gravy', price: 26 },
      { name: 'Palak Paneer', description: 'Spinach curry with cottage cheese', price: 18 },
    ],
  },
  {
    title: 'Desserts',
    items: [
      { name: 'Gulab Jamun', description: 'Warm milk dumplings in rose syrup', price: 8 },
      { name: 'Mango Lassi', description: 'Sweet yogurt drink with mango', price: 6 },
    ],
  },
];

export default function MenuPage() {
  return (
    <>
      <PageHero title="Our Menu" subtitle="Crafted with love and tradition" />
      <section className="py-16">
        <div className="container-custom space-y-12">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-bold text-brand-green border-b-2 border-brand-gold pb-2">{section.title}</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {section.items.map((item) => (
                  <div key={item.name} className="flex justify-between rounded-lg bg-white p-4 shadow-sm">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-brand-green/70">{item.description}</p>
                    </div>
                    <span className="text-lg font-bold text-brand-gold">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}