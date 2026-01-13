/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router, useForm, } from '@inertiajs/react'; // Gunakan useForm untuk state management
import { ArrowLeft, Calendar, Plus, RefreshCw, Save, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Buat Daftar Belanja',
    href: shopping.index().url,
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

export default function Index({ stores, products }: { stores: any[], products: any[] }) {

  // Inisialisasi useForm agar sinkron dengan Controller store()
  const { data, setData } = useForm({
    store_id: stores?.[0]?.id || '', // Default ke toko pertama
    title: '',
    shopping_date: new Date().toISOString().split('T')[0],
    items: [{ product_id: null, product_name: '', quantity: 1, price: 0 }],
  });

  // --- TAMBAHKAN LOGIC INI ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    if (productId && products.length > 0) {
      const foundProduct = products.find((p: any) => p.id.toString() === productId.toString());

      if (foundProduct) {
        setData((prev) => ({
          ...prev,
          title: `Restok ${foundProduct.name}`,
          // Pastikan dikonversi ke string agar cocok dengan value SelectItem
          store_id: foundProduct.store_id ? foundProduct.store_id.toString() : prev.store_id,
          items: [{
            product_id: foundProduct.id,
            product_name: foundProduct.name,
            quantity: 1,
            price: foundProduct.last_price || 0
          }]
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);
  // ---------------------------

  // Handler Tambah Baris
  const addRow = () => {
    setData('items', [...data.items, { product_id: null, product_name: '', quantity: 1, price: 0 }]);
  };

  // Handler Hapus Baris
  const removeRow = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    setData('items', newItems);
  };

  // Update field di dalam array items
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...data.items] as any;

    if (field === 'price') {
      newItems[index][field] = parseRupiah(value);
    } else if (field === 'quantity') {
      newItems[index][field] = parseInt(value) || '';
    } else {
      newItems[index][field] = value;
    }

    // FITUR AUTO-FILL
    if (field === 'product_name') {
      const foundProduct = products.find(
        (p: any) => p.name.toLowerCase() === value.toLowerCase()
      );

      if (foundProduct) {
        newItems[index]['price'] = foundProduct.last_price || 0;
        newItems[index]['product_id'] = foundProduct.id;

        // PERBAIKAN: Set store_id pada level form (data.store_id)
        if (foundProduct.store_id) {
          setData((prevData) => ({
            ...prevData,
            items: newItems,
            store_id: foundProduct.store_id.toString() // Auto-select toko
          }));
          return; // Return agar tidak menjalankan setData di bawah lagi
        }
      } else {
        newItems[index]['product_id'] = null;
      }
    }

    setData('items', newItems);
  };

  const totalEstimasi = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Buat Daftar Belanja" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight dark:text-white">Buat Daftar Belanja</h1>
          <p className="text-slate-500 text-sm">Input rencana belanja kamu untuk memantau pengeluaran.</p>
        </div>
        <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <CardContent className="p-6">
            <Form {...ShoppingListController.store()}
              onStart={() => toast.loading('Memproses...', { id: 'create-shopping-list' })}
              onSuccess={() => toast.success('Disimpan..., Cek daftar belanja aktif.', { id: 'create-shopping-list' })}
              onError={() => toast.error('Gagal membuat daftar belanja.', { id: 'create-shopping-list' })}
              options={{ preserveScroll: true, }}
              className="space-y-6"
            >
              {({ processing, errors }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="grid gap-2">
                      <Label
                        htmlFor="store"
                        className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                        <Store className="w-4 h-4" />Pilih Toko
                      </Label>

                      {/* PERBAIKAN: Tambahkan value dan onValueChange */}
                      <Select
                        key={data.store_id}
                        name='store_id'
                        required
                        value={data.store_id.toString()}
                        onValueChange={(val) => setData('store_id', val)}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-slate-200">
                          <SelectValue placeholder="Pilih Toko" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {/* Jika tidak ada daftar toko, tampilkan pesan */}
                            <SelectLabel>Daftar Toko Kamu</SelectLabel>
                            {!stores.length &&
                              <SelectLabel className="py-4 text-center text-slate-400">
                                Tidak ada daftar toko
                                <p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-sky-500 hover:text-sky-600"
                                    onClick={() => router.visit(StoreController.index().url)}
                                  >
                                    Tambah Toko
                                  </Button>
                                </p>
                              </SelectLabel>
                            }
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
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        onFocus={(e) => e.target.select()}
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
                        defaultValue={(() => {
                          const sekarang = new Date();
                          const offset = sekarang.getTimezoneOffset() * 60000;
                          const waktuLokal = new Date(sekarang.getTime() - offset);
                          return waktuLokal.toISOString().slice(0, 16);
                        })()}
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
                      {data.items.map((item, index) => (
                        <div key={index} className="group relative p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-orange-200">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

                            {/* 1. Nama Produk (6 Kolom Desktop) */}
                            <div className="md:col-span-6">
                              <Label className="text-[10px] uppercase font-black text-slate-400 mb-1 block">Nama Barang</Label>
                              <Input
                                list="product-suggestions"
                                className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-orange-500 font-medium"
                                name={`items.${index}.product_name`}
                                value={item.product_name}
                                onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                onFocus={(e) => e.target.select()}
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
                                  className="bg-slate-50 dark:bg-slate-800 border-none text-center font-bold"
                                  name={`items.${index}.quantity`}
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                  onFocus={(e) => e.target.select()}
                                  placeholder="Qty"
                                  required
                                />
                              </div>

                              <div className="col-span-8">
                                <Label className="text-[10px] uppercase font-black text-slate-400 mb-1 block">Harga Satuan</Label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                                  <Input
                                    type="text"
                                    className="pl-8 bg-slate-50 dark:bg-slate-800 border-none font-black text-orange-600 dark:text-orange-400"
                                    name={`items.${index}.price`}
                                    value={formatRupiah(item.price)}
                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="100.000"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            {/* Tombol Hapus */}
                            <div className="md:col-span-1 flex justify-end">
                              {data.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRow(index)}
                                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Error Handling */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-1">
                            <div className="md:col-span-6">
                              <InputError message={errors[`items.${index}.product_name` as keyof typeof errors]} />
                            </div>
                            <div className="md:col-span-6 text-right">
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

                  {/* FOOTER TOTAL & SAVE */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-200 dark:shadow-none">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-orange-100 text-xs font-bold uppercase tracking-wider">Total Estimasi Belanja</span>
                      <span className="text-3xl font-black italic">
                        Rp {totalEstimasi ? formatRupiah(totalEstimasi) : '0'}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      disabled={
                        processing ||
                        !data.store_id || !data.title.trim() || data.items.length === 0 ||
                        data.items.some((item: any) => !item.product_name.trim() || item.quantity <= 0 || !item.price || item.price <= 0
                        )
                      }
                      className="bg-white text-orange-600 hover:bg-slate-100 cursor-pointer w-full md:w-auto px-10 py-6 rounded-xl font-black text-lg shadow-xl transition-transform hover:scale-105 active:scale-95"
                    // onClick={notify}
                    >
                      <Save className="w-5 h-5" />
                      SIMPAN DAFTAR
                    </Button>
                  </div>
                </>
              )
              }
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}