/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { SharedData, type BreadcrumbItem } from '@/types';
import { Form, Head, router, useForm, usePage } from '@inertiajs/react'; // Gunakan useForm untuk state management
import { AlertTriangle, Calendar, FolderSync, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Edit Belanja',
    href: shopping.edit(1).url,
  },
];

const formatRupiah = (value: any) => {
  if (value === null || value === undefined || value === '') return '';

  // 1. Ubah ke string dan buang angka di belakang koma (desimal)
  // Kita gunakan Math.floor agar 4000.00 menjadi 4000
  const plainNumber = Math.floor(Number(value));

  // 2. Format dengan titik ribuan
  return plainNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRupiah = (value: string): number => {
  if (typeof value === 'number') return value;
  // Hapus semua yang bukan angka (termasuk titik dan koma)
  const cleanNumber = value.replace(/\D/g, '');
  return cleanNumber ? parseInt(cleanNumber, 10) : 0;
};

export default function Edit() {
  const { list, store, stores, products }: any = usePage<SharedData>().props;

  // Inisialisasi useForm (Data items diambil dari list.items)
  const { data, setData } = useForm({
    items: list.items.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name_snapshot,
      quantity: item.quantity,
      price: item.price_per_unit,
      is_bought: item.is_bought, // Tambahkan ini
    })),
  });

  const addRow = () => {
    setData('items', [...data.items, { product_id: null, product_name: '', quantity: 1, price: 0 }]);
  };

  const removeRow = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    setData('items', newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items] as any;

    if (field === 'price') {
      newItems[index][field] = parseRupiah(value);
    } else if (field === 'quantity') {
      newItems[index][field] = parseInt(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    // FITUR AUTO-FILL HARGA
    if (field === 'product_name') {
      const foundProduct = products.find(
        (p: any) => p.name.toLowerCase() === value.toLowerCase()
      );

      if (foundProduct) {
        newItems[index]['price'] = foundProduct.last_price || 0;
        newItems[index]['product_id'] = foundProduct.id;

        // TRIK KHUSUS: Karena pakai defaultValue, kita harus update manual value input harganya
        // agar user melihat perubahan harga secara instan tanpa nunggu re-render
        const priceInput = document.getElementsByName(`items.${index}.price`)[0] as HTMLInputElement;
        if (priceInput) {
          priceInput.value = formatRupiah(foundProduct.last_price);
        }
      } else {
        newItems[index]['product_id'] = null;
      }
    }

    setData('items', newItems);
  };

  const totalEstimasi = data.items.reduce((acc: number, item: { quantity: number; price: number; }) => acc + (item.quantity * item.price), 0);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Daftar Belanja" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight dark:text-white">Edit Daftar Belanja</h1>
          <p className="text-slate-500 text-sm">Inputkan daftar belanja yang akan diperbarui.</p>
        </div>
        <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          {/* <CardHeader>
            <CardTitle>Edit Daftar Belanja</CardTitle>
          </CardHeader> */}
          <CardContent className="p-6">
            <Form {...ShoppingListController.update.form(list.id)}
              options={{
                preserveScroll: true,
              }} className="space-y-6">
              {({ processing, recentlySuccessful, errors }) => {

                // eslint-disable-next-line react-hooks/rules-of-hooks
                useEffect(() => {
                  if (recentlySuccessful) {
                    toast.promise<{ name: string }>(
                      () =>
                        new Promise((resolve) =>
                          setTimeout(() => resolve({ name: 'Daftar belanja berhasil diperbarui!' }), 700)
                        ),
                      {
                        loading: "Memperbarui...",
                        success: (data) => {
                          setTimeout(() => {
                            router.visit(shopping.active().url); // Ganti ke route tujuan Anda
                          }, 5000);
                          return `${data.name}`;
                        },
                        error: "Terjadi kesalahan",
                      }
                    )
                  }
                }, [recentlySuccessful]);

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label
                          htmlFor="store"
                          className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                          <Store className="w-4 h-4" />Pilih Toko
                        </Label>
                        <Select name='store_id' defaultValue={list.store_id.toString()} required>
                          <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200">
                            <SelectValue placeholder="Pilih Toko" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Daftar Toko Kamu</SelectLabel>
                              {/* 3. Looping data stores dari database */}
                              {stores.map((store: any) => (
                                <SelectItem key={store.id} value={store.id.toString()}>
                                  <span className="capitalize">{store.name}</span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <InputError message={errors.store_id} />
                      </div>
                      <div className="grid gap-2">
                        <Label
                          htmlFor="title"
                          className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                          <ShoppingCart className="w-4 h-4" />Judul Belanja
                        </Label>
                        <Input
                          id="title"
                          name='title'
                          defaultValue={list.title}
                          className="bg-white dark:bg-slate-800 border-slate-200 w-full"
                          placeholder='Contoh: Belanja Bulanan'
                          required
                        />
                        <InputError message={errors.title} />
                      </div>
                      <div className="grid gap-2">
                        <Label
                          htmlFor="tanggal"
                          className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />Tanggal
                        </Label>
                        <Input
                          id="tanggal"
                          type='datetime-local'
                          name='shopping_date'
                          // Perbaikan format di sini:
                          defaultValue={
                            list.shopping_date
                              ? new Date(new Date(list.shopping_date).getTime() - (new Date().getTimezoneOffset() * 60000))
                                .toISOString()
                                .slice(0, 16)
                              : ''
                          }
                          className="bg-white dark:bg-slate-800 border-slate-200 block w-full"
                          required
                        />
                        <InputError message={errors.shopping_date} />
                      </div>
                    </div>

                    {/* AREA DAFTAR BARANG */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-black text-lg text-slate-800 dark:text-slate-50 uppercase tracking-tight">Daftar Barang</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addRow}
                          className='cursor-pointer border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full font-bold'
                        >
                          <Plus className="w-4 h-4" />Tambah Barang
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {data.items.map((item: any, index: number) => (
                          <div key={index} className="group relative p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-orange-200">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                              {/* 1. Nama Produk */}
                              <div className="md:col-span-6">
                                <Label className="text-[10px] uppercase font-black text-slate-400 mb-1 block">Nama Barang</Label>
                                <Input
                                  list="product-suggestions"
                                  className={item.is_bought ? "bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-orange-500 font-medium line-through" : "bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-orange-500 font-medium"}
                                  name={`items.${index}.product_name`}
                                  defaultValue={item.product_name}
                                  onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                  placeholder="Ketik nama barang..."
                                  required
                                  autoComplete="off"
                                />
                              </div>

                              {/* 2. Wrapper Qty, Harga, dan Tombol Hapus */}
                              <div className="md:col-span-5 grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-4">
                                  <Label className="text-[10px] uppercase font-black text-slate-400 mb-1 block">Qty</Label>
                                  <Input
                                    type="number"
                                    className={item.is_bought ? "bg-slate-50 dark:bg-slate-800 border-none text-center font-bold line-through" : "bg-slate-50 dark:bg-slate-800 border-none text-center font-bold"}
                                    name={`items.${index}.quantity`}
                                    defaultValue={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    placeholder="Qty"
                                    required
                                  />
                                </div>
                                {/* Harga */}
                                <div className="col-span-8">
                                  <Label className="text-[10px] uppercase font-black text-slate-400 mb-1 block">Harga Satuan</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                    <Input
                                      type="text"
                                      className={item.is_bought ? "pl-8 bg-slate-50 dark:bg-slate-800 border-none font-black text-orange-600 dark:text-orange-400 line-through" : "pl-8 bg-slate-50 dark:bg-slate-800 border-none font-black text-orange-600 dark:text-orange-400"}
                                      name={`items.${index}.price`}
                                      value={formatRupiah(item.price)}
                                      onChange={(e) => updateItem(index, 'price', e.target.value)}
                                      placeholder="100.000"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Tombol Hapus */}
                              <div className="md:col-span-1 flex justify-end">
                                {data.items.length > 1 && (
                                  <>
                                    {item.is_bought ?
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer transition-colors rounded-full"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>

                                        <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[2rem] p-6 gap-6 sm:w-full">
                                          <AlertDialogHeader>
                                            <div className="flex flex-col items-center gap-4 text-center">
                                              {/* Icon Warning yang Cantik */}
                                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                                <AlertTriangle className="h-6 w-6 text-rose-600" />
                                              </div>

                                              <div className="space-y-2">
                                                <AlertDialogTitle className="text-xl font-bold tracking-tight">
                                                  Hapus Barang Belanjaan?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                                  Barang <span className="font-bold text-slate-900 dark:text-slate-200 capitalize">"{item.product_name}"</span> sudah diceklis/dibeli. Yakin ingin menghapusnya?
                                                </AlertDialogDescription>
                                              </div>
                                            </div>
                                          </AlertDialogHeader>

                                          <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                                            <AlertDialogCancel className="w-full sm:w-auto rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer">
                                              Batal
                                            </AlertDialogCancel>

                                            <AlertDialogAction
                                              asChild
                                              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200 dark:shadow-none border-none cursor-pointer"
                                            >
                                              <Button
                                                type="button"
                                                onClick={() => removeRow(index)}
                                              >
                                                Ya, Hapus
                                              </Button>
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog> :
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeRow(index)}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    }
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Error Messages */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="md:col-span-6">
                                <InputError message={errors[`items.${index}.product_name` as keyof typeof errors]} />
                              </div>
                              <div className="md:col-span-6">
                                <InputError message={errors[`items.${index}.price` as keyof typeof errors]} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <datalist id="product-suggestions">
                        {products.map((p: any) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                    </div>

                    {/* FOOTER TOTAL & UPDATE */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
                      <div className="flex flex-col items-center md:items-start">
                        <span className="text-orange-100 text-xs font-bold uppercase tracking-wider">Total Estimasi Belanja</span>
                        <span className="text-3xl font-black italic">
                          Rp {totalEstimasi ? formatRupiah(totalEstimasi) : '0'}
                        </span>
                      </div>

                      <Button
                        type="submit"
                        disabled={processing || recentlySuccessful}
                        className="bg-white text-orange-600 hover:bg-slate-100 cursor-pointer w-full md:w-auto px-10 py-6 rounded-xl font-black text-lg shadow-xl transition-transform hover:scale-105 active:scale-95"
                      >
                        <FolderSync className="w-5 h-5" />
                        PERBARUI
                      </Button>
                    </div>
                  </>
                )
              }}
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}