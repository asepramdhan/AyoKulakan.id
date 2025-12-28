/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import InputError from '@/components/input-error';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react'; // Gunakan useForm untuk state management
import { CheckCircle2, CheckCircle2Icon, DownloadCloud, Pencil, Plus, Save, ShoppingBag, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Daftar Belanja',
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

const formatSingkat = (dateString: string) => {
  const d = new Date(dateString);
  const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tgl = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '-');
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }).replace('.', ':');

  return `${hari}, ${tgl} ${jam}`;
};

export default function Index({ stores, shoppingLists, products }: { stores: any[], shoppingLists: any[], products: any[] }) {
  const { flash } = usePage().props as any;

  // Inisialisasi useForm agar sinkron dengan Controller store()
  const { data, setData } = useForm({
    store_id: stores?.[0]?.id || '', // Default ke toko pertama
    title: '',
    shopping_date: new Date().toISOString().split('T')[0],
    items: [{ product_id: null, product_name: '', quantity: null, price: null }],
  });

  // Handler Tambah Baris
  const addRow = () => {
    setData('items', [...data.items, { product_id: null, product_name: '', quantity: 1, price: null }]);
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
      // Pastikan ini menjadi angka: misal input "12.500" -> 12500
      newItems[index][field] = parseRupiah(value);
    } else if (field === 'quantity') {
      newItems[index][field] = parseInt(value) || 0;
    } else {
      newItems[index][field] = value;
    }

    // FITUR AUTO-FILL HARGA
    if (field === 'product_name') {
      // Cari produk yang namanya cocok (case-insensitive)
      const foundProduct = products.find(
        (p: any) => p.name.toLowerCase() === value.toLowerCase()
      );

      if (foundProduct) {
        // Jika ketemu, isi harga otomatis dan simpan ID produknya
        newItems[index]['price'] = foundProduct.last_price || 0;
        newItems[index]['product_id'] = foundProduct.id;
      } else {
        // Jika tidak ketemu (produk baru), kosongkan product_id
        newItems[index]['product_id'] = null;
      }
    }

    setData('items', newItems);
  };

  const totalEstimasi = data.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);

  function route(arg0: string, id: any): string | URL | undefined {
    throw new Error('Function not implemented.');
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Daftar Belanja" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Buat Daftar Belanja Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...ShoppingListController.store()} options={{
              preserveScroll: true,
            }} className="space-y-6">
              {({ processing, recentlySuccessful, errors }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="store">Pilih Toko</Label>
                      <Select name='store_id' required>
                        <SelectTrigger className="w-full">
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
                      <Label htmlFor="title">Judul Belanja</Label>
                      <Input
                        id="title"
                        name='title'
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
                        type='datetime-local'
                        name='shopping_date'
                        defaultValue={new Date().toISOString().split('T')[0] + 'T00:00'}
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

                    <div className="space-y-6 md:space-y-2"> {/* Rapatkan jarak antar baris di desktop */}
                      {data.items.map((item, index) => (
                        <div key={index} className="relative p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 md:bg-transparent md:border-0 md:border-b md:rounded-none md:p-0 md:pb-4 transition-all">

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center"> {/* md:items-center supaya sejajar vertikal */}

                            {/* 1. Nama Produk (6 Kolom Desktop) */}
                            <div className="md:col-span-6">
                              <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Nama Barang</Label>
                              <Input
                                list="product-suggestions"
                                className="mt-1 bg-white md:mt-0 dark:bg-slate-800"
                                name={`items.${index}.product_name`}
                                value={item.product_name}
                                onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                                placeholder="Nama barang..."
                                required
                                autoComplete="off"
                              />
                            </div>

                            {/* 2. Wrapper Qty, Harga, dan Tombol Hapus */}
                            <div className="md:col-span-6 grid grid-cols-12 gap-3 items-center">

                              {/* Quantity (4 kolom dari 12 bagian wrapper) */}
                              <div className="col-span-4 md:col-span-3">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Qty</Label>
                                <Input
                                  type="number"
                                  className="mt-1 bg-white md:mt-0 dark:bg-slate-800 text-center"
                                  name={`items.${index}.quantity`}
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                  placeholder="Qty"
                                  required
                                />
                              </div>

                              {/* Harga (8 kolom dari 12 bagian wrapper di mobile, 7 di desktop) */}
                              <div className="col-span-8 md:col-span-7">
                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 md:hidden">Harga</Label>
                                <div className="relative mt-1 md:mt-0">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs dark:text-slate-300">Rp</span>
                                  <Input
                                    type="text"
                                    className="pl-8 bg-white font-medium dark:bg-slate-800"
                                    name={`items.${index}.price`}
                                    value={formatRupiah(item.price)}
                                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                                    placeholder="100.000"
                                    required
                                  />
                                </div>
                              </div>

                              {/* 3. Tombol Hapus (Desktop: Sejajar | Mobile: Tetap Melayang atau di samping harga) */}
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

                          {/* Error message di bawah baris */}
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

                      <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 cursor-pointer">
                        {processing ? (
                          <>
                            <Spinner className="h-4 w-4 animate-spin" />
                            Menyimpan...
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

        {/* BAGIAN TABEL RIWAYAT BELANJA */}
        <Transition
          show={flash.delete}
          enter="transition ease-in-out"
          enterFrom="opacity-0"
          leave="transition ease-in-out"
          leaveTo="opacity-0"
        >
          <Alert className="mb-2 text-green-600 bg-green-50 dark:bg-green-800 dark:text-green-200">
            <CheckCircle2Icon />
            <AlertTitle>
              {flash.delete || 'Terhapus'}
            </AlertTitle>
          </Alert>
        </Transition>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Belanja Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Total Estimasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shoppingLists.length > 0 ? (
                  shoppingLists.map((list: any) => (
                    <TableRow key={list.id}>
                      <TableCell>{formatSingkat(list.shopping_date)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 text-xs font-medium capitalize">
                          {list.store.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium capitalize">{list.title}</TableCell>
                      <TableCell>Rp {Number(list.total_estimated_price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${list.status === 'completed'
                          ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-700 dark:text-green-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-100'
                          }`}>
                          {list.status === 'completed' ? 'Selesai' : 'Ongoing'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 cursor-pointer"
                        >
                          <Link href={shopping.check(list.id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-sky-500 hover:bg-sky-600 cursor-pointer"
                        >
                          <Link href={shopping.edit(list.id)}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Link href={shopping.export(list.id)}>
                            <DownloadCloud className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <Link href={shopping.destroy(list.id)} className="cursor-pointer" onClick={(e) => { if (!confirm('Anda yakin ingin menghapus riwayat belanja ini?')) { e.preventDefault(); } }}>
                            <Trash2 className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <ShoppingBag className="w-8 h-8 text-slate-400" />
                          </EmptyMedia>
                          <EmptyTitle className="text-slate-400">Belum ada data belanja.</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}