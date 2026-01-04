/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2Icon, Info, Package, Package2, PackageSearch, Pencil, PlusCircle, Search, Store, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Master Produk',
    href: products.index().url,
  },
];

export default function Index({ products, stores, filters }: any) {
  const { flash } = usePage<any>().props as any;
  // State lokal untuk mengontrol visibilitas alert
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (flash.message) {
      setShowSuccess(true);

      // Hilangkan alert setelah 3 detik
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      return () => clearTimeout(timer); // Cleanup timer jika komponen unmount
    }
  }, [flash.message]);
  // State untuk pencarian
  const [searchQuery, setSearchQuery] = useState('');
  // State untuk Modal Opname
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);

  // Logika Filter Produk (Berdasarkan Search Query)
  const filteredProducts = useMemo(() => {
    // Pastikan products ada sebelum difilter untuk menghindari error undefined
    return (products || []).filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]); // Gunakan 'products' sesuai props Anda

  // Gunakan useForm dari Inertia untuk handle submit
  const opnameForm = useForm({
    actual_stock: 0,
    reason: '',
  });

  const handleOpname = (product: any) => {
    setSelectedProduct(product);
    opnameForm.setData({
      actual_stock: product.stock, // Defaultnya samakan dengan stok sistem
      reason: 'Stock Opname Rutin',
    });
    setIsOpnameOpen(true);
  };

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
        {/* Container Filter & Pencarian */}
        <div className="space-y-4 mb-6">
          {/* Baris 1: Pencarian & Info */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama produk di katalog ini..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 focus-visible:ring-blue-500 h-11 bg-white dark:bg-slate-950 shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Info Jumlah (Opsional tapi membantu) */}
            <div className="hidden md:block shrink-0 text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
              Total: <b>{filteredProducts.length}</b> Produk
            </div>
          </div>

          {/* Baris 2: Filter Toko (Scrollable jika terlalu banyak) */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Store className="w-3 h-3" /> Filter Berdasarkan Toko
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              <Button
                variant={!filters.store_id ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4"
                asChild
              >
                <Link href={ProductController.index().url}>Semua Toko</Link>
              </Button>

              {stores.map((s: any) => (
                <Button
                  key={s.id}
                  variant={filters.store_id == s.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full px-4 transition-all"
                  asChild
                >
                  <Link href={ProductController.index().url + `?store_id=${s.id}`}>
                    <Store className="w-3 h-3" />
                    {s.name}
                  </Link>
                </Button>
              ))}
            </div>
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
              show={showSuccess}
              // Animasi masuk: slide down + fade in
              enter="transition-all duration-500 ease-out"
              enterFrom="opacity-0 -translate-y-2 max-h-0"
              enterTo="opacity-100 translate-y-0 max-h-20"
              // Animasi keluar: slide up + fade out
              leave="transition-all duration-300 ease-in"
              leaveFrom="opacity-100 max-h-20"
              leaveTo="opacity-0 -translate-y-2 max-h-0"
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
                          {/* TOMBOL OPNAME (Baru) */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-500 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-800"
                            onClick={() => handleOpname(product)}
                            title="Stock Opname"
                          >
                            <PackageSearch className="w-4 h-4" />
                          </Button>
                          <Link href={ProductController.edit(product.id)}>
                            {/* ... tombol edit ... */}
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
      <Dialog open={isOpnameOpen} onOpenChange={setIsOpnameOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Stock Opname</DialogTitle>
            <DialogDescription>
              Sesuaikan jumlah stok sistem dengan stok fisik di toko.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">Produk</p>
              <p className="font-bold text-slate-900 dark:text-slate-50 capitalize">{selectedProduct?.name}</p>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Stok Sistem: <b>{selectedProduct?.stock} pcs</b></span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="actual_stock">Jumlah Stok Fisik (Nyata)</Label>
              <Input
                id="actual_stock"
                type="number"
                min="0" // agar user tidak bisa menginput angka negatif
                value={opnameForm.data.actual_stock}
                onChange={(e) => opnameForm.setData('actual_stock', parseInt(e.target.value))}
              />
              {/* Kalkulasi Selisih secara visual */}
              <p className={`text-[11px] font-medium ${opnameForm.data.actual_stock - (selectedProduct?.stock || 0) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                Selisih: {opnameForm.data.actual_stock - (selectedProduct?.stock || 0)} pcs
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Alasan Penyesuaian</Label>
              <Input
                id="reason"
                placeholder="Misal: Barang rusak, salah hitung, dll"
                value={opnameForm.data.reason}
                onChange={(e) => opnameForm.setData('reason', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpnameOpen(false)}>Batal</Button>
            <Button
              className='bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700'
              disabled={opnameForm.processing}
              onClick={() => {
                // Menggunakan opnameForm.post agar state 'processing' dan 'onSuccess' sinkron
                opnameForm.post(ProductController.adjustStock(selectedProduct?.id || 0).url, {
                  preserveScroll: true,
                  onSuccess: () => {
                    setIsOpnameOpen(false); // Tutup modal setelah berhasil
                    opnameForm.reset();     // Kembalikan form ke awal
                  },
                });
              }}
            >
              {opnameForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout >
  );
}
