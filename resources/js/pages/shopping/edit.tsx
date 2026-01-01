/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { SharedData, type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react'; // Gunakan useForm untuk state management
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

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
  const { flash } = usePage().props as any;

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
    const item = data.items[index];

    // Jika barang sudah dibeli, minta konfirmasi
    if (item.is_bought) {
      const confirmDelete = window.confirm(
        `Barang "${item.product_name}" sudah diceklis/dibeli. Yakin ingin menghapusnya?`
      );

      if (!confirmDelete) {
        return; // Batalkan penghapusan
      }
    }

    // Jika belum dibeli (atau user klik OK pada konfirmasi), langsung hapus
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

  const totalEstimasi = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Daftar Belanja" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between">
          <Button
            variant="ghost"
            className="cursor-pointer flex items-center mb-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit Daftar Belanja</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...ShoppingListController.update.form(list.id)} options={{
              preserveScroll: true,
            }} className="space-y-6">
              {({ processing, recentlySuccessful, errors }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="store">Pilih Toko</Label>
                      <Select name='store_id' defaultValue={list.store_id.toString()} required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Toko" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Daftar Toko Kamu</SelectLabel>
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
                      <Label htmlFor="title">Judul Belanja</Label>
                      <Input
                        id="title"
                        name='title'
                        defaultValue={list.title}
                        className="mt-1 block w-full"
                        placeholder='Contoh: Belanja Bulanan MeowMeal.id'
                        required
                      />
                      <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tanggal">Tanggal</Label>
                      <Input
                        id="tanggal"
                        type="datetime-local"
                        name="shopping_date"
                        // Perbaikan format di sini:
                        defaultValue={
                          list.shopping_date
                            ? new Date(new Date(list.shopping_date).getTime() - (new Date().getTimezoneOffset() * 60000))
                              .toISOString()
                              .slice(0, 16)
                            : ''
                        }
                        className="mt-1 block w-full"
                        required
                      />
                      <InputError message={errors.shopping_date} />
                    </div>
                  </div>

                  <hr />

                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">Daftar Barang</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addRow} className='cursor-pointer border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-800'>
                        <Plus className="w-4 h-4" />Tambah
                      </Button>
                    </div>

                    <div className="space-y-6 md:space-y-2">
                      {data.items.map((item: any, index: number) => (
                        <div key={index} className="relative transition-all border-b md:border-b-0 pb-4 md:pb-0">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center">

                            {/* 1. Nama Produk */}
                            <div className="md:col-span-6">
                              <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Nama Barang</Label>
                              <Input
                                list="product-suggestions"
                                className={item.is_bought ? "text-slate-400 dark:text-slate-600 bg-white md:mt-0 dark:bg-slate-800 line-through" : "bg-white md:mt-0 dark:bg-slate-800"}
                                name={`items.${index}.product_name`}
                                defaultValue={item.product_name}
                                onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                placeholder="Nama barang..."
                                required
                                autoComplete="off"
                              />
                            </div>

                            {/* 2. Wrapper Qty dan Harga */}
                            <div className="md:col-span-6 grid grid-cols-12 gap-3 items-center">

                              {/* Quantity */}
                              <div className="col-span-4 md:col-span-3">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Qty</Label>
                                <Input
                                  type="number"
                                  className={item.is_bought ? "text-slate-400 dark:text-slate-600 bg-white md:mt-0 dark:bg-slate-800 line-through text-center" : "bg-white md:mt-0 dark:bg-slate-800 text-center"}
                                  name={`items.${index}.quantity`}
                                  defaultValue={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                  placeholder="Qty"
                                  required
                                />
                              </div>

                              {/* Harga */}
                              <div className="col-span-8 md:col-span-7">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Harga</Label>
                                <div className="relative mt-1 md:mt-0">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs dark:text-slate-300">Rp</span>
                                  <Input
                                    className={item.is_bought ? "pl-8 font-medium text-slate-400 dark:text-slate-600 bg-white md:mt-0 dark:bg-slate-800 line-through" : "pl-8 font-medium bg-white md:mt-0 dark:bg-slate-800"}
                                    name={`items.${index}.price`}
                                    value={formatRupiah(item.price)}
                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    placeholder="100.000"
                                    required
                                  />
                                </div>
                              </div>

                              {/* 3. Tombol Hapus */}
                              <div className="absolute -top-3 -right-3 md:relative md:top-0 md:right-0 md:col-span-2 flex justify-end">
                                {data.items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRow(index)}
                                    className="h-8 w-8 rounded-full bg-red-100 text-red-600 md:bg-transparent md:text-slate-400 md:hover:text-red-600 md:hover:bg-red-50 cursor-pointer transition-colors dark:hover:bg-red-800 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

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

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xl font-bold tracking-tight text-green-600">
                      Total: Rp {totalEstimasi ? formatRupiah(totalEstimasi) : '-'}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                      >
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {flash.message || 'Tersimpan'}
                          {/* Terakhir disimpan {moment(recentlyCreated).fromNow()} */}
                        </p>
                      </Transition>
                      {/* tombol kembali */}
                      <Button
                        type="button"
                        variant="ghost"
                        className="bg-red-400 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-700 cursor-pointer"
                        onClick={() => window.history.back()}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 cursor-pointer">
                        {processing ? (
                          <>
                            <Spinner className="h-4 w-4 animate-spin" />
                            Perbaharui...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Simpan
                          </>
                        )}
                      </Button>
                    </div>
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