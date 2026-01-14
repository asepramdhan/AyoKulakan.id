/* eslint-disable @typescript-eslint/no-explicit-any */
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import products from '@/routes/products';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Info, Package2, PackageSearch, Pencil, PlusCircle, Search, Store, Trash2, X, AlertTriangle, PackagePlus, ShoppingCart, Box } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Master Produk', href: products.index().url }];

export default function Index({ products, stores, filters }: any) {
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('product_search_query') || '';
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isOpnameOpen, setIsOpnameOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('product_search_query', searchQuery);

    // Jika ada store_id di URL, simpan ke storage
    if (filters.store_id) {
      localStorage.setItem('preferred_store_filter', filters.store_id);
    } else if (filters.store_id === null) {
      // Jika klik "Semua", hapus storage agar tidak redirect balik lagi
      localStorage.removeItem('preferred_store_filter');
    }
  }, [searchQuery, filters.store_id]);

  useEffect(() => {
    const savedStoreId = localStorage.getItem('preferred_store_filter');

    // Jika user masuk ke /products tanpa query, tapi punya pilihan toko sebelumnya
    if (!filters.store_id && savedStoreId) {
      router.get(ProductController.index().url, { store_id: savedStoreId }, {
        preserveScroll: true,
        replace: true // Supaya kalau user klik "Back", tidak terjebak loop
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    return (products || []).filter((product: any) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const opnameForm = useForm({ actual_stock: 0, reason: '' });

  const handleOpname = (product: any) => {
    setSelectedProduct(product);
    opnameForm.setData({ actual_stock: product.stock, reason: 'Stock Opname Rutin' });
    setIsOpnameOpen(true);
  };

  const updateOpname = () => {
    opnameForm.post(ProductController.adjustStock(selectedProduct?.id || 0).url,
      {
        preserveScroll: true,
        onStart: () => toast.loading('Memperbarui stok...', { id: 'opname' }),
        onSuccess: () => toast.success('Stok berhasil diperbarui!', { id: 'opname' }),
        onError: () => toast.error('Gagal memperbarui stok!', { id: 'opname' }),
      }
    );
    setIsOpnameOpen(false);
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Master Produk" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50 uppercase">
              Katalog <span className="text-orange-600">Produk</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
              <span className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </span>
              Kelola stok otomatis dari riwayat transaksi.
            </p>
          </div>
          <Link href={shopping.index().url}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 border-none font-bold rounded-xl h-11 w-full md:w-auto px-6 active:scale-95 transition-all">
              <PlusCircle className="w-4 h-4" />
              Tambah / Restok
            </Button>
          </Link>
        </div>

        {/* --- SEARCH & FILTER SECTION --- */}
        <div className="sticky top-15 z-30 -mx-4 px-4 py-4 backdrop-blur-md border-b border-transparent transition-all">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row gap-2 items-center bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari nama produk di katalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 border-none bg-transparent focus-visible:ring-0 text-base h-11 text-slate-700 dark:text-slate-200"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="hidden md:block px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total: {filteredProducts.length}</span>
              </div>
            </div>

            {/* Toko Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              <Button
                variant={!filters.store_id ? "default" : "secondary"}
                size="sm"
                className={`rounded-full px-5 font-bold text-xs uppercase tracking-wider ${!filters.store_id ? 'bg-slate-900 dark:bg-slate-50 dark:text-slate-900 text-white' : 'bg-white dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                asChild
              >
                <Link
                  href={ProductController.index().url}
                  onClick={() => localStorage.removeItem('preferred_store_filter')}
                >
                  Semua
                </Link>
              </Button>
              {stores.map((s: any) => (
                <Button
                  key={s.id}
                  variant={filters.store_id == s.id ? "default" : "secondary"}
                  size="sm"
                  className={`rounded-full px-5 font-bold text-xs uppercase tracking-wider transition-all ${filters.store_id == s.id ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                  asChild
                >
                  <Link href={ProductController.index().url + `?store_id=${s.id}`}>
                    <Store className="w-3 h-3 opacity-70" />
                    {s.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* --- MAIN TABLE CARD --- */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <TableRow className="hover:bg-transparent uppercase font-black text-[10px] tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    <TableHead className="py-5 px-6">Informasi Produk</TableHead>
                    <TableHead>Lokasi Toko</TableHead>
                    <TableHead>Harga Modal</TableHead>
                    <TableHead>Stok Fisik</TableHead>
                    <TableHead className="text-right px-6">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => {

                    const isCritical = product.stock <= (product.stock_warning || 0);
                    const isEmpty = product.stock <= 0;

                    return (
                      <TableRow key={product.id} className="group border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <TableCell className="py-5 px-6">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] capitalize tracking-tight group-hover:text-orange-600 transition-colors">
                                {product.name}
                              </span>
                            </div>
                            {/* --- INFO PACKING (DINAMIS) --- */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 my-1">
                              {product.packagings && product.packagings.length > 0 ? (
                                product.packagings.map((pkg: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700"
                                  >
                                    <Box className="w-3 h-3 text-blue-500" />
                                    <span>
                                      {/* Logika Label Qty */}
                                      {pkg.max_qty
                                        ? `${pkg.min_qty}-${pkg.max_qty} Pcs: `
                                        : `>= ${pkg.min_qty} Pcs: `
                                      }
                                      <b className="dark:text-white capitalize">{pkg.supply?.name || 'Plastik'}</b>
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-400 italic px-2">Belum ada aturan packing</span>
                              )}
                            </div>
                            {/* --- END INFO PACKING --- */}
                            <div className="flex items-center gap-2">
                              {isEmpty ? (
                                <span className="flex items-center text-[9px] font-black text-red-600 dark:text-red-400 uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" /> Stok Habis
                                </span>
                              ) : isCritical && (
                                <span className="flex items-center text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-bounce" /> Menipis
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-[10px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg px-2 py-0.5 capitalize">
                            {product.store?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] font-normal text-slate-400 mr-1">Rp</span>
                          {Number(product.last_price).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-3">
                              {/* Angka Stok Utama */}
                              <div className={`text-base font-black flex items-baseline gap-1 ${isEmpty ? 'text-red-600' : isCritical ? 'text-orange-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                {product.stock} <span className="text-[9px] font-bold text-slate-400 uppercase">pcs</span>
                              </div>

                              {/* INDIKATOR AKAN DATANG (Taruh di samping angka stok) */}
                              {product.active_shopping_items_count > 0 && (
                                <Badge className="bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800 text-[8px] font-bold px-1.5 py-0 rounded-full animate-pulse flex items-center gap-1">
                                  <div className="w-1 h-1 rounded-full bg-sky-500" />
                                  +{product.active_shopping_items_sum_quantity} pcs
                                </Badge>
                              )}
                            </div>

                            {/* Progress Bar Stok */}
                            <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-none">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${isEmpty ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%` }}
                              />
                            </div>

                            {/* Label Status Restok di bawah progress bar agar tidak merusak layout */}
                            {product.active_count > 0 && (
                              <div className="flex items-center gap-1 text-[8px] font-black text-sky-500 uppercase tracking-tighter">
                                <ShoppingCart className="w-2 h-2" />
                                Proses Restok
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Tombol Restok - Dibuat sedikit lebih menonjol dengan teks */}
                            <Button asChild
                              variant="ghost"
                              size="sm"
                              title="Buat Daftar Belanja/Restok"
                              className="h-9 w-auto border border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20 gap-2 px-3 rounded-xl transition-all"
                            >
                              <Link
                                href={shopping.index().url + `?product_id=${product.id}`}
                                onStart={() => toast.loading('Membuat restok/daftar belanja...', { id: 'restock' })}
                                onSuccess={() => toast.success('Restok/daftar belanja berhasil dibuat!', { id: 'restock' })}
                                onError={() => toast.error('Restok/daftar belanja gagal dibuat!', { id: 'restock' })}
                              >
                                <PackagePlus className="w-4 h-4" />
                                <span className="hidden md:inline font-bold">Restok</span>
                              </Link>
                            </Button>

                            {/* Tombol Opname */}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Stok Opname"
                              className="h-9 w-9 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-xl transition-all"
                              onClick={() => handleOpname(product)}
                            >
                              <PackageSearch className="w-4 h-4" />
                            </Button>

                            {/* Tombol Edit */}
                            <Link href={ProductController.edit(product.id)}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Produk"
                                className="h-9 w-9 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>

                            {/* Tombol hapus */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Hapus Produk"
                                  className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
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
                                        Hapus Produk
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                        Apakah kamu yakin ingin menghapus produk <span className="font-bold text-slate-900 dark:text-slate-200">"{product.name}"</span>?
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
                                      href={ProductController.destroy(product.id)}
                                      onStart={() => toast.loading("Menghapus...", { id: "delete" })}
                                      onSuccess={() => toast.success("Berhasil dihapus!", { id: "delete" })}
                                      onError={() => toast.error("Gagal dihapus!", { id: "delete" })}
                                      method="delete"
                                      as="button"
                                      preserveScroll={true}
                                    >
                                      Ya, Hapus
                                    </Link>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-4">
                  <Package2 className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold tracking-tight">Data Produk Tidak Ditemukan</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Coba kata kunci lain atau pilih semua toko.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- DIALOG OPNAME --- */}
      <Dialog open={isOpnameOpen} onOpenChange={setIsOpnameOpen}>
        <DialogContent className="sm:max-w-[425px] border-none rounded-[2rem] shadow-2xl bg-white dark:bg-slate-900 p-0 overflow-hidden">
          <div className="bg-slate-900 dark:bg-orange-600 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <PackageSearch className="w-24 h-24" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Stock Opname</DialogTitle>
              <DialogDescription className="text-slate-400 dark:text-orange-100 font-medium">
                Sesuaikan stok sistem dengan fisik di toko.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Produk Terpilih</Label>
              <p className="text-lg font-bold text-slate-900 dark:text-white capitalize truncate">{selectedProduct?.name}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <Label htmlFor="actual_stock" className="font-black text-xs uppercase tracking-wider text-slate-500">Stok Fisik Nyata</Label>
                <span className="text-[10px] font-bold text-slate-400">Sistem: {selectedProduct?.stock} pcs</span>
              </div>
              <div className="relative group">
                <Input
                  id="actual_stock"
                  type="number"
                  className="h-16 text-3xl font-black pl-6 pr-16 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus-visible:border-orange-500 focus-visible:ring-0 transition-all text-slate-900 dark:text-white"
                  value={opnameForm.data.actual_stock}
                  onChange={(e) => opnameForm.setData('actual_stock', parseInt(e.target.value))}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 dark:text-slate-600 text-sm">PCS</span>
              </div>

              <div className={`p-3 rounded-xl flex items-center gap-2 font-bold text-sm ${opnameForm.data.actual_stock - (selectedProduct?.stock || 0) < 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'}`}>
                <AlertTriangle className="w-4 h-4" />
                Selisih: {opnameForm.data.actual_stock - (selectedProduct?.stock || 0)} pcs
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="font-black text-xs uppercase tracking-wider text-slate-500">Alasan Perubahan</Label>
              <Input
                id="reason"
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-2 focus-visible:ring-orange-500/20 text-slate-700 dark:text-slate-200"
                placeholder="Contoh: Barang rusak / hilang..."
                value={opnameForm.data.reason}
                onChange={(e) => opnameForm.setData('reason', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsOpnameOpen(false)}
              className="font-bold rounded-xl text-slate-500 dark:text-slate-400"
            >
              Batal
            </Button>
            <Button
              className='flex-1 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl h-14 shadow-lg shadow-orange-600/20 transition-all active:scale-95'
              disabled={!opnameForm.isDirty}
              onClick={updateOpname}
            >
              Update Stok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}