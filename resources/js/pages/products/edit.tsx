/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

// Fungsi helper untuk format mata uang (sama dengan di halaman list)
const formatRupiah = (value: any) => {
  if (value === null || value === undefined || value === '') return '';
  const plainNumber = Math.floor(Number(value));
  return plainNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Fungsi helper untuk menghapus format titik sebelum kirim ke server
const parseRupiah = (value: string): number => {
  const cleanNumber = value.replace(/\D/g, '');
  return cleanNumber ? parseInt(cleanNumber, 10) : 0;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Edit Produk',
    href: '#', // Otomatis mengikuti konteks
  },
];

export default function Edit({ product }: any) {

  // Fungsi untuk handle perubahan harga agar input otomatis ter-format titik
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    e.target.value = formatRupiah(numericValue);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Produk: ${product.name}`} />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex justify-between">
          <Link href={products.index().url}>
            <Button variant="ghost" className="cursor-pointer group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali
            </Button>
          </Link>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Edit Master Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...ProductController.update.form(product.id)}
              className="space-y-6"
            >
              {({ processing, errors }) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Nama Produk */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nama Produk</Label>
                    <Input
                      id="name"
                      type="text"
                      name="name"
                      defaultValue={product.name}
                      placeholder="Masukkan nama produk..."
                      required
                      className="capitalize"
                    />
                    <InputError message={errors.name} />
                  </div>

                  {/* Harga Terakhir */}
                  <div className="grid gap-2">
                    <Label htmlFor="price">Harga Terakhir</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        Rp
                      </span>
                      <Input
                        id="price"
                        name="last_price" // Sesuaikan dengan nama field di DB/Controller
                        className="pl-8 font-semibold"
                        defaultValue={formatRupiah(product.last_price)}
                        onChange={handlePriceChange}
                        placeholder="0"
                        required
                      />
                    </div>
                    <InputError message={errors.last_price || errors.price} />
                  </div>

                  {/* Tombol Aksi */}
                  <div className="md:col-span-2 flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={processing}
                      className="min-w-[120px] cursor-pointer bg-green-600 hover:bg-green-700"
                    >
                      {processing ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}