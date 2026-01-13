/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Package2, Plus, Trash2 } from 'lucide-react';
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

export default function Edit({ product, supplies }: any) {
  // 1. Inisialisasi useForm secara manual
  const { data, setData } = useForm({
    // Kita kirim array of objects ke controller
    packagings: product.packagings?.length > 0
      ? product.packagings
      : [{ supply_id: "", min_qty: 1, max_qty: "" }],
  });

  const addRow = () => {
    setData('packagings', [...data.packagings, { supply_id: "", min_qty: 1, max_qty: "" }]);
  };

  const removeRow = (index: number) => {
    const newPackagings = [...data.packagings];
    newPackagings.splice(index, 1);
    setData('packagings', newPackagings);
  };

  const updateRow = (index: number, field: string, value: any) => {
    const newPackagings = [...data.packagings];
    newPackagings[index] = { ...newPackagings[index], [field]: value };
    setData('packagings', newPackagings);
  };

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
              onStart={() => toast.loading('Memperbarui produk...', { id: 'update' })}
              onSuccess={() => toast.success('Produk berhasil diperbarui!', { id: 'update' })}
              onError={() => toast.error('Gagal memperbarui produk!', { id: 'update' })}
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
                        onFocus={(e) => e.target.select()}
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
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          required
                        />
                      </div>
                      <InputError message={errors.last_price || errors.price} />
                    </div>
                  </div>

                  {/* BAGIAN DINAMIS: ATURAN PACKING */}
                  <div className="space-y-4 border-t dark:border-zinc-800 pt-6">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold uppercase text-orange-500">Aturan Penggunaan Plastik</Label>
                      <Button type="button" onClick={addRow} variant="outline" size="sm" className="h-8">
                        <Plus className="w-4 h-4 mr-1" /> Tambah Aturan
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {data.packagings.map((row: any, index: number) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-3 p-3 rounded-lg border dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <Label className="text-[10px] text-zinc-500">PILIH PLASTIK</Label>
                            <Select
                              name={`packagings.${index}.supply_id`}
                              value={row.supply_id?.toString()}
                              onValueChange={(val) => updateRow(index, 'supply_id', val)}
                            >
                              <SelectTrigger className="dark:bg-zinc-900"><SelectValue placeholder="Pilih Plastik..." /></SelectTrigger>
                              <SelectContent>
                                {supplies.map((s: any) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    <span className="capitalize">{s.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <InputError message={errors[`packagings.${index}.supply_id`]} />
                          </div>

                          <div className="w-24 space-y-1">
                            <Label className="text-[10px] text-zinc-500">MIN QTY</Label>
                            <Input
                              type="number"
                              name={`packagings.${index}.min_qty`}
                              value={row.min_qty}
                              onChange={e => updateRow(index, 'min_qty', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="dark:bg-zinc-900"
                            />
                            <InputError message={errors[`packagings.${index}.min_qty`]} />
                          </div>

                          <div className="w-24 space-y-1">
                            <Label className="text-[10px] text-zinc-500">MAX QTY</Label>
                            <Input
                              name={`packagings.${index}.max_qty`}
                              type="number"
                              placeholder="∞"
                              value={row.max_qty || ''}
                              onChange={e => updateRow(index, 'max_qty', e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="dark:bg-zinc-900"
                            />
                            <InputError message={errors[`packagings.${index}.max_qty`]} />
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeRow(index)}
                            disabled={data.packagings.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-500 italic">* Max Qty dikosongkan jika ingin "Qty ke atas" (contoh: Min 5, Max kosong berarti untuk semua pembelian 5 ke atas).</p>
                  </div>

                  <div className="flex items-center justify-end gap-4 pt-4 border-t dark:border-zinc-800">
                    <Link href={products.index().url}>
                      <Button type="button" variant="ghost" className="font-bold dark:text-zinc-400">Batal</Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={processing}
                      className="min-w-[160px] h-11 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20"
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