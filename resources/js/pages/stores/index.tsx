/* eslint-disable @typescript-eslint/no-explicit-any */
import StoreController from '@/actions/App/Http/Controllers/StoreController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import storesRoute from '@/routes/stores';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { Plus, Trash2, Globe, ShoppingBag, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Kelola Seller Online',
    href: storesRoute.index().url,
  },
];

export default function Index({ stores }: { stores: any[] }) {
  const { flash } = usePage().props as any;

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
                {({ processing, recentlySuccessful, errors, reset }) => {

                  // Pola Toast Promise yang benar sesuai contoh Anda
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  useEffect(() => {
                    if (recentlySuccessful) {
                      toast.promise<{ message: string }>(
                        () =>
                          new Promise((resolve) =>
                            // Simulasi delay sedikit agar user bisa melihat status "Menyimpan..."
                            setTimeout(() => resolve({ message: flash.message || 'Seller berhasil disimpan!' }), 700)
                          ),
                        {
                          loading: "Menyimpan seller...",
                          success: (data) => {
                            reset('name'); // Reset input nama setelah berhasil
                            return `${data.message}`;
                          },
                          error: "Terjadi kesalahan sistem saat menyimpan data.",
                        }
                      );
                    }
                    // eslint-disable-next-line react-hooks/exhaustive-deps
                  }, [recentlySuccessful]);

                  return (
                    <>
                      <div className="space-y-2">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
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
                      >
                        {processing ? (
                          <Spinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Simpan Seller
                          </>
                        )}
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
                        <Form {...StoreController.destroy.form(store.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            onClick={(e) => {
                              if (!confirm('Hapus seller ini?')) { e.preventDefault(); }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Form>
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