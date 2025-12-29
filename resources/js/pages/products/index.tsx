/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, Package, Package2, Pencil, Store, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Master Produk',
    href: products.index().url,
  },
];

export default function Index({ products, stores, filters }: any) {
  const { flash } = usePage().props;
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Master Produk" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!filters.store_id ? "default" : "outline"}
            size="sm"
            className="cursor-pointer"
          >
            <Link href={ProductController.index().url}>Semua Toko</Link>
          </Button>
          {stores.map((s: any) => (
            <Button
              key={s.id}
              variant={filters.store_id == s.id ? "default" : "outline"}
              size="sm"
              className="cursor-pointer"
            >
              <Link href={ProductController.index().url + `?store_id=${s.id}`} className="flex items-center">
                <Store className="w-3 h-3 mr-1" /> {s.name}
              </Link>
            </Button>
          ))}
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5" /> Master Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Transition
              show={flash.message}
              enter="transition ease-in-out"
              enterFrom="opacity-0"
              leave="transition ease-in-out"
              leaveTo="opacity-0"
            >
              <Alert className="mb-2 text-green-600 bg-green-50 dark:bg-green-800 dark:text-green-200">
                <CheckCircle2Icon />
                <AlertTitle>
                  {flash.message || 'Terhapus'}
                </AlertTitle>
              </Alert>
            </Transition>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Toko</TableHead>
                  <TableHead>Harga Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium capitalize">{product.name}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded capitalize">
                        {product.store?.name}
                      </span>
                    </TableCell>
                    <TableCell>Rp {Number(product.last_price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={ProductController.edit(product.id)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Form {...ProductController.destroy.form(product.id)}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 cursor-pointer"
                            onClick={(e) => { if (!confirm('Apakah anda yakin ingin menghapus data ini?')) { e.preventDefault(); } }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length == 0 &&
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Package2 className="w-6 h-6 text-slate-400" />
                          </EmptyMedia>
                          <EmptyTitle className="text-slate-400">Tidak ada master produk</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
