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
import stores from '@/routes/stores';
import { type BreadcrumbItem } from '@/types';
import { Form, Head } from '@inertiajs/react';
import { Plus, StoreIcon, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Kelola Toko',
    href: stores.index().url,
  },
];

export default function index({ stores }: { stores: any[] }) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Kelola Toko" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <StoreIcon className="w-6 h-6 text-orange-500" /> Manajemen Toko
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Form Tambah Toko */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Tambah Toko Baru</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...StoreController.store()} className="space-y-4">
                {({ processing, errors }) => (
                  <>
                    <div className="space-y-2">
                      <Input
                        name='name'
                        placeholder="Nama Toko (ex: PetShop ABC)"
                        required
                      />
                      <InputError message={errors.name} />
                    </div>
                    <Button disabled={processing} className="w-full bg-orange-500 hover:bg-orange-600 cursor-pointer">
                      {processing ? (
                        <>
                          <Spinner className="h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Simpan
                        </>
                      )}
                    </Button>
                  </>
                )}
              </Form>
            </CardContent>
          </Card>

          {/* Tabel Daftar Toko */}
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Toko</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store: any) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium capitalize">{store.name}</TableCell>
                      <TableCell className="text-right">
                        <Form {...StoreController.destroy.form(store.id)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 cursor-pointer"
                            onClick={(e) => { if (!confirm('Anda yakin ingin menghapus toko ini?')) { e.preventDefault(); } }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {stores.length === 0 && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <StoreIcon className="w-6 h-6 text-orange-500" />
                            </EmptyMedia>
                            <EmptyTitle className="text-slate-400">Belum ada toko, silahkan tambahkan.</EmptyTitle>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
