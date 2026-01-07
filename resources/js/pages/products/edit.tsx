/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Package2 } from 'lucide-react';
import toast from 'react-hot-toast';

const formatRupiah = (value: any) => {
  if (value === null || value === undefined || value === '') return '';
  const plainNumber = Math.floor(Number(value));
  return plainNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRupiah = (value: string): number => {
  const cleanNumber = value.replace(/\D/g, '');
  return cleanNumber ? parseInt(cleanNumber, 10) : 0;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Edit Produk',
    href: '#',
  },
];

export default function Edit({ product }: any) {

  const updateData = () =>
    setTimeout(() => {
      toast.promise<{ name: string }>(
        new Promise((resolve) => {
          // Beri jeda sedikit agar user melihat status "loading" di toast
          setTimeout(() => {
            resolve({ name: "Berhasil diperbarui!" });
          }, 600);
        }),
        {
          loading: 'Memperbarui...',
          success: (data: any) => { return `${data.name}`; },
          error: 'Gagal memperbarui produk.',
        }
      );
    }, 400);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    e.target.value = formatRupiah(numericValue);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Produk: ${product.name}`} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* Tombol Kembali */}
        <div className="flex justify-start">
          <Link href={products.index().url}>
            <Button variant="ghost" className="group dark:text-zinc-400 dark:hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-sm dark:bg-zinc-900 dark:border dark:border-zinc-800">
          <CardHeader className="border-b dark:border-zinc-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <Package2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold dark:text-zinc-100">Edit Master Produk</CardTitle>
                <p className="text-sm mt-1 text-zinc-500">Perbarui informasi dasar dan harga modal produk Anda.</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            <Form
              {...ProductController.update.form(product.id)}
              options={{ preserveScroll: true }}
              className="space-y-8"
            >
              {({ processing, errors }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Nama Produk */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-bold dark:text-zinc-300 uppercase tracking-tight">Nama Produk</Label>
                      <Input
                        id="name"
                        type="text"
                        name="name"
                        defaultValue={product.name}
                        placeholder="Masukkan nama produk..."
                        required
                        className="h-11 capitalize dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:ring-orange-500 font-medium"
                      />
                      <InputError message={errors.name} />
                    </div>

                    {/* Harga Terakhir */}
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-bold dark:text-zinc-300 uppercase tracking-tight">Harga Modal</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold border-r pr-2 dark:border-zinc-700">
                          Rp
                        </span>
                        <Input
                          id="price"
                          name="last_price"
                          className="pl-12 h-11 font-black text-zinc-900 dark:text-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 focus:ring-orange-500"
                          defaultValue={formatRupiah(product.last_price)}
                          onChange={handlePriceChange}
                          placeholder="0"
                          required
                        />
                      </div>
                      <InputError message={errors.last_price || errors.price} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4 border-t dark:border-zinc-800">
                    <Link href={products.index().url}>
                      <Button type="button" variant="ghost" className="font-bold dark:text-zinc-400">Batal</Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={processing}
                      className="min-w-[160px] h-11 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20"
                      onClick={updateData}
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                </>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}