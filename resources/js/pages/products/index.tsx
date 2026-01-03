/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, Info, Package, Package2, PackageSearch, Pencil, PlusCircle, Search, Store, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Master Produk',
    href: products.index().url,
  },
];

export default function Index({ products, stores, filters }: any) {
  const { flash } = usePage<any>().props as any;

  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState('');

  // Logika Filter Produk (Berdasarkan Search Query)
  const filteredProducts = useMemo(() => {
    // Pastikan products ada sebelum difilter untuk menghindari error undefined
    return (products || []).filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]); // Gunakan 'products' sesuai props Anda

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Master Produk" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <PackageSearch className="w-6 h-6 text-blue-600" />
              Katalog Master Produk
            </h2>
            <div className="flex items-start md:items-center gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 md:mt-0" />
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Daftar produk di sini terdata **otomatis** melalui riwayat <span className="font-semibold text-blue-600 dark:text-blue-400">Transaksi Pembelian / Restok</span> yang telah diselesaikan.
              </p>
            </div>
          </div>

          {/* Shortcut ke Halaman Pembelian */}
          <div className="flex shrink-0">
            <Link href={shopping.index().url}> {/* Sesuaikan route halaman pembelian Anda */}
              <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:hover:bg-blue-950">
                <PlusCircle className="w-4 h-4" />
                Tambah via Restok
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 focus-visible:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toko */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={!filters.store_id ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={ProductController.index().url}>Semua Toko</Link>
            </Button>
            {stores.map((s: any) => (
              <Button
                key={s.id}
                variant={filters.store_id == s.id ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={ProductController.index().url + `?store_id=${s.id}`}>
                  <Store className="w-3 h-3 mr-1" /> {s.name}
                </Link>
              </Button>
            ))}
          </div>
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
                  <TableHead>Harga Modal</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => {
                  const isCritical = product.stock <= (product.stock_warning || 0);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium capitalize">
                        <div className="flex flex-col">
                          {product.name}
                          {isCritical && product.stock > 0 && (
                            <span className="text-[10px] text-orange-500 font-bold animate-pulse">
                              STOK HAMPIR HABIS
                            </span>
                          )}
                          {product.stock <= 0 && (
                            <span className="text-[10px] text-red-500 font-bold">
                              STOK KOSONG
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded capitalize">
                          {product.store?.name}
                        </span>
                      </TableCell>
                      <TableCell>Rp {Number(product.last_price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-bold ${isCritical ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {product.stock}
                          <span className="text-[10px] font-normal text-slate-400">pcs</span>
                        </div>
                      </TableCell>
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
                  );
                })}
                {/* Tampilan jika hasil pencarian kosong */}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Package2 className="w-6 h-6 text-slate-400" />
                          </EmptyMedia>
                          <EmptyTitle className="text-slate-400">Tidak ada master produk</EmptyTitle>
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
