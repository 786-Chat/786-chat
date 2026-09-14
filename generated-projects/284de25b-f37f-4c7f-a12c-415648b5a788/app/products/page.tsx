import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ArrowLeft, Package, Plus, Save, Trash2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/server/auth';
import { getSql } from '@/lib/server/db';
import { ensureProductSchema } from '@/lib/server/products';

export const metadata = { title: 'Products | NorthStar Logistics' };
export const dynamic = 'force-dynamic';

async function createProduct(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const name = String(formData.get('name') || '').trim();
  const sku = String(formData.get('sku') || '').trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock'));
  if (!name || !sku || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return;
  await ensureProductSchema();
  const sql = getSql();
  await sql`INSERT INTO products (user_id, name, sku, price, stock) VALUES (${user.id}, ${name}, ${sku}, ${price}, ${stock})`;
  revalidatePath('/products');
  revalidatePath('/dashboard');
}

async function updateProduct(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  const name = String(formData.get('name') || '').trim();
  const sku = String(formData.get('sku') || '').trim();
  const price = Number(formData.get('price'));
  const stock = Number(formData.get('stock'));
  if (!id || !name || !sku || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return;
  await ensureProductSchema();
  const sql = getSql();
  await sql`UPDATE products SET name=${name}, sku=${sku}, price=${price}, stock=${stock}, updated_at=now() WHERE id=${id} AND user_id=${user.id}`;
  revalidatePath('/products');
  revalidatePath('/dashboard');
}

async function deleteProduct(formData: FormData) {
  'use server';
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  if (!id) return;
  await ensureProductSchema();
  const sql = getSql();
  await sql`DELETE FROM products WHERE id=${id} AND user_id=${user.id}`;
  revalidatePath('/products');
  revalidatePath('/dashboard');
}

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  await ensureProductSchema();
  const sql = getSql();
  const products = (await sql`SELECT id, name, sku, price, stock FROM products WHERE user_id=${user.id} ORDER BY created_at DESC`) as unknown as Array<Record<string, any>>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> Back to Dashboard</Link>
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <form action={createProduct} className="grid gap-3 rounded-lg bg-white p-5 shadow sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
          <div><label className="block text-sm font-medium text-slate-700">Product Name</label><input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700">SKU</label><input name="sku" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700">Price (£)</label><input name="price" type="number" min="0" step="0.01" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-medium text-slate-700">Stock</label><input name="stock" type="number" min="0" step="1" defaultValue="0" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
          <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"><Plus size={16} /> Add Product</button>
        </form>

        {products.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center shadow-sm"><Package className="mx-auto h-10 w-10 text-slate-400" /><p className="mt-3 text-slate-500">No products yet. Add your first product above.</p></div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><h2 className="font-semibold text-slate-900">{product.name}</h2><p className="text-sm text-slate-500">SKU: {product.sku}</p></div>
                  <div className="text-right"><p className="font-semibold">£{Number(product.price).toFixed(2)}</p><p className="text-sm text-slate-500">Stock: {product.stock}</p></div>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600">Edit product</summary>
                  <form action={updateProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={product.id} />
                    <div><label className="block text-xs font-medium text-slate-500">Name</label><input name="name" defaultValue={product.name} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
                    <div><label className="block text-xs font-medium text-slate-500">SKU</label><input name="sku" defaultValue={product.sku} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
                    <div><label className="block text-xs font-medium text-slate-500">Price (£)</label><input name="price" type="number" min="0" step="0.01" defaultValue={product.price} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
                    <div><label className="block text-xs font-medium text-slate-500">Stock</label><input name="stock" type="number" min="0" step="1" defaultValue={product.stock} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></div>
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:col-span-2"><Save size={16} /> Save Changes</button>
                  </form>
                </details>
                <form action={deleteProduct} className="mt-4 border-t border-slate-100 pt-3 text-right"><input type="hidden" name="id" value={product.id} /><button type="submit" className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-900"><Trash2 size={16} /> Delete</button></form>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
