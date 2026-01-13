/* eslint-disable @typescript-eslint/no-explicit-any */
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import storesRoute from '@/routes/stores';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash2, Globe, ShoppingBag, AlertTriangle, X, Pencil } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Kelola Seller Online',
    href: storesRoute.index().url,
  },
];

export default function Index({ stores }: { stores: any[] }) {
  // State untuk form
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  // 1. Inisialisasi Form dengan useForm agar state bisa diketik
  const { data, setData, reset } = useForm({
    name: '',
    default_admin_fee: 0,
    default_promo_fee: 0,
    default_process_fee: 0,
  });

  const formatRupiah = (value: any) => {
    // Paksa ke float dan berikan default 0 jika gagal parse
    const num = parseFloat(value) || 0;

    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.floor(num));
  };

  const parseRupiah = (value: string): number => {
    if (typeof value === 'number') return value;
    // Hapus semua yang bukan angka (termasuk titik dan koma)
    const cleanNumber = value.replace(/\D/g, '');
    return cleanNumber ? parseInt(cleanNumber, 10) : 0;
  };
  // Fungsi untuk memicu mode Edit
  const handleEdit = (store: any) => {
    setIsEditing(true);
    setEditId(store.id);
    setData({
      name: store.name,
      // Menggunakan Number() untuk membuang .00 di belakang angka
      default_admin_fee: Number(store.default_admin_fee),
      default_promo_fee: Number(store.default_promo_fee),
      default_process_fee: Number(store.default_process_fee),
    });
  };
  // Fungsi reset form kembali ke mode Tambah
  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    reset();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Kelola Seller Online" />
      {/* Container utama: hilangkan h-full jika ingin scroll natural di HP */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">

        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-black tracking-tight dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" /> Daftar Seller Online
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">Kelola daftar toko marketplace tempat kamu restok barang.</p>
        </div>

        {/* Grid Responsive: 1 kolom di HP, 12 kolom di Desktop */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-12 items-start">

          {/* Form Tambah Seller (Kiri/Atas) - Mengambil 4 kolom di desktop */}
          <Card className="md:col-span-4 border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle
                className="text-xs font-black uppercase tracking-widest text-slate-400"
              >
                {isEditing ? 'Update Seller' : 'Input Seller & Biaya Default'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form
                {...isEditing ? StoreController.update.form(editId) : StoreController.store.form()}
                onStart={() => toast.loading(`${isEditing ? 'Memperbarui' : 'Menyimpan'} seller...`, { id: 'store' })}
                onSuccess={() => {
                  toast.success(`Seller berhasil ${isEditing ? 'diperbarui' : 'disimpan'}!`, { id: 'store' });
                  cancelEdit();
                  setData({
                    name: '',
                    default_admin_fee: 0,
                    default_promo_fee: 0,
                    default_process_fee: 0,
                  });
                }}
                onError={() => toast.error(`Gagal ${isEditing ? 'memperbarui' : 'menyimpan'} seller!`, { id: 'store' })}
                options={{ preserveScroll: true }}
                className="space-y-4"
              >
                {({ processing, errors }: any) => {
                  return (
                    <>
                      {/* Nama Toko */}
                      <div className="space-y-2">
                        <Label>Nama Seller / Toko</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            name='name'
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="pl-9 bg-white dark:bg-slate-800"
                            placeholder="Contoh: Shopee Official"
                            required
                          />
                        </div>
                        <InputError message={errors.name} />
                      </div>

                      {/* Biaya Admin & Promo (%) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[11px]">Admin Fee (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="default_admin_fee"
                            value={data.default_admin_fee}
                            onChange={e => setData('default_admin_fee', e.target.value as any)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px]">Promo Extra (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            name="default_promo_fee"
                            value={data.default_promo_fee}
                            onChange={e => setData('default_promo_fee', e.target.value as any)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Biaya Proses (Flat) */}
                      <div className="space-y-2">
                        <Label>Biaya Proses Flat (Rp)</Label>
                        <Input
                          name='default_process_fee'
                          type="text"
                          value={formatRupiah(data.default_process_fee)}
                          onChange={e => setData('default_process_fee', parseRupiah(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          placeholder="Contoh: 1.250"
                        />
                      </div>

                      <Button disabled={processing} className="w-full bg-indigo-600 cursor-pointer">
                        {isEditing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {isEditing ? 'Update Seller' : 'Simpan Seller'}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          className="w-full mt-1"
                          onClick={cancelEdit}
                        >
                          <X className="w-4 h-4" /> Batal
                        </Button>
                      )}
                    </>
                  );
                }}
              </Form>
            </CardContent>
          </Card>

          {/* Tabel Daftar Seller (Kanan/Bawah) - Mengambil 8 kolom di desktop */}
          <Card className="md:col-span-8 border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur overflow-hidden">
            <CardContent className="p-0">
              {/* Penting: overflow-x-auto agar tabel bisa di-swipe di HP */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap">
                      <TableHead className="w-[50px] pl-6"></TableHead>
                      <TableHead>Nama Seller</TableHead>
                      <TableHead>Admin / Promo</TableHead>
                      <TableHead>Biaya Proses</TableHead>
                      <TableHead className="text-right pr-6">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((store: any) => (
                      <TableRow key={store.id} className="whitespace-nowrap">
                        <TableCell className="pl-6">
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                        </TableCell>
                        <TableCell>
                          <div className="font-bold capitalize">{store.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {/* Menggunakan Number() agar tampilan 9.50 menjadi 9.5 */}
                            <span className="text-orange-600 font-bold">{Number(store.default_admin_fee) || 0}%</span> +
                            <span className="text-blue-600 font-bold"> {Number(store.default_promo_fee) || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">Rp {formatRupiah(store.default_process_fee)}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6 flex justify-end gap-2">
                          {/* Tombol Edit Baru */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(store)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {/* Tombol Hapus */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-8 w-8 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="w-[95vw] max-w-[400px] rounded-[1.5rem] md:rounded-[2rem] p-6 gap-6 sm:w-full">
                              <AlertDialogHeader>
                                <div className="flex flex-col items-center gap-4 text-center">
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                    <AlertTriangle className="h-6 w-6 text-rose-600" />
                                  </div>
                                  <div className="space-y-2">
                                    <AlertDialogTitle className="text-xl font-bold tracking-tight">
                                      Hapus Toko
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-slate-500">
                                      Apakah kamu yakin ingin menghapus toko <span className="font-bold text-slate-900">"{store.name}"</span>?
                                    </AlertDialogDescription>
                                  </div>
                                </div>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="w-full sm:w-auto rounded-xl cursor-pointer">
                                  Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  asChild
                                  className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
                                >
                                  <Link
                                    href={StoreController.destroy(store.id)}
                                    method="delete"
                                    as="button"
                                    preserveScroll={true}
                                    onStart={() => toast.loading('Menghapus...', { id: 'delete-store' })}
                                    onSuccess={() => toast.success('Berhasil dihapus!', { id: 'delete-store' })}
                                    onError={() => toast.error('Gagal menghapus!', { id: 'delete-store' })}
                                  >
                                    Ya, Hapus
                                  </Link>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}

                    {stores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-64 text-center">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <ShoppingBag className="w-10 h-10 text-slate-200" />
                              </EmptyMedia>
                              <EmptyTitle className="text-slate-400 font-medium">Belum ada seller</EmptyTitle>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}