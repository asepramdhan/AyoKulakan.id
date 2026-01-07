/* eslint-disable @typescript-eslint/no-explicit-any */
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import storesRoute from '@/routes/stores';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link } from '@inertiajs/react';
import { Plus, Trash2, Globe, ShoppingBag, ExternalLink, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Kelola Seller Online',
    href: storesRoute.index().url,
  },
];

export default function Index({ stores }: { stores: any[] }) {

  const saveSeller = () =>
    setTimeout(() => {
      toast.promise<{ name: string }>(
        new Promise((resolve) => {
          // Beri jeda sedikit agar user melihat status "loading" di toast
          setTimeout(() => {
            resolve({ name: "Berhasil disimpan!" });
          }, 600);
        }),
        {
          loading: 'Menyimpan...',
          success: (data: any) => {
            // reset inputan
            (document.getElementById("seller_name") as HTMLInputElement).value = "";
            // autofocus inputan
            (document.getElementById("seller_name") as HTMLInputElement).focus();
            return `${data.name}`;
          },
          error: 'Gagal menyimpan.',
        }
      );
    }, 400);

  const deleteSeller = () =>
    setTimeout(() => {
      toast.promise<{ name: string }>(
        new Promise((resolve) => {
          // Beri jeda sedikit agar user melihat status "loading" di toast
          setTimeout(() => {
            resolve({ name: "Berhasil dihapus!" });
          }, 600);
        }),
        {
          loading: 'Menghapus...',
          success: (data: any) => { return `${data.name}`; },
          error: 'Gagal menghapus.',
        }
      );
    }, 400);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Kelola Seller Online" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black tracking-tight dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-500" /> Daftar Seller Online
          </h1>
          <p className="text-slate-500 text-sm">Kelola daftar toko marketplace (Shopee, Lazada, dll) tempat kamu restok barang.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-12 items-start">

          {/* Form Tambah Seller (Kiri) */}
          <Card className="md:col-span-4 border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Input Seller Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...StoreController.store()} className="space-y-4">
                {({ processing, errors }) => {
                  return (
                    <>
                      <div className="space-y-2">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id='seller_name'
                            name='name'
                            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 focus-visible:ring-indigo-500"
                            placeholder="Contoh: Official Store Shopee"
                            required
                            autoFocus
                          />
                        </div>
                        <InputError message={errors.name} />
                      </div>

                      <Button
                        disabled={processing}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer font-bold rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                        onClick={saveSeller}
                      >
                        <Plus className="w-4 h-4" />
                        Simpan Seller
                      </Button>
                    </>
                  );
                }}
              </Form>
            </CardContent>
          </Card>

          {/* Tabel Daftar Seller (Kanan) */}
          <Card className="md:col-span-8 border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                    <TableHead className="w-[50px] pl-6"></TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Nama Seller / Toko</TableHead>
                    <TableHead className="text-right pr-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store: any) => (
                    <TableRow key={store.id} className="group border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <TableCell className="pl-6">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold capitalize text-slate-700 dark:text-slate-200 leading-none">
                            {store.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium mt-1">Online Marketplace</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {/* Tombol hapus */}
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

                          <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[2rem] p-6 gap-6 sm:w-full">
                            <AlertDialogHeader>
                              <div className="flex flex-col items-center gap-4 text-center">
                                {/* Icon Warning yang Cantik */}
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                                </div>

                                <div className="space-y-2">
                                  <AlertDialogTitle className="text-xl font-bold tracking-tight">
                                    Hapus Toko
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                    Apakah kamu yakin ingin menghapus toko <span className="font-bold text-slate-900 dark:text-slate-200">"{store.name}"</span> ?
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
                                <Link
                                  href={StoreController.destroy(store.id)}
                                  method="delete"
                                  as="button"
                                  preserveScroll={true}
                                  onClick={deleteSeller}
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
                      <TableCell colSpan={3} className="h-64 text-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <ShoppingBag className="w-10 h-10 text-slate-200" />
                            </EmptyMedia>
                            <EmptyTitle className="text-slate-400 font-medium">Belum ada seller yang terdaftar</EmptyTitle>
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
      </div>
    </AppLayout>
  );
}