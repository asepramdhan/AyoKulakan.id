/* eslint-disable @typescript-eslint/no-explicit-any */
import SalesRecordController from '@/actions/App/Http/Controllers/SalesRecordController';
import InputError from '@/components/input-error';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import salesRecord from '@/routes/sales-record';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2Icon, DollarSign, Package2, Pencil, Percent, Plus, Save, Search, Store, TrendingUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Penghasilan',
    href: salesRecord.index().url,
  },
];

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

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

export default function Index({ products, stores, ...props }: any) {

  const { flash } = usePage().props as any;
  // State lokal untuk mengontrol visibilitas alert
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // State untuk filter toko (default 'all')
  const [filterStore, setFilterStore] = useState<string>('all');

  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>(() => {
    return (localStorage.getItem('preferred_sales_filter') as any) || 'all';
  });

  const { salesRecords } = props; // Ambil data dari props Laravel

  // Contoh data (Nanti data ini datang dari props Laravel)
  const filteredSales = useMemo(() => {
    if (!salesRecords) return [];

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return salesRecords
      .filter((item: any) => {
        const itemDate = new Date(item.created_at);

        // 1. Logika Filter Waktu
        let matchTime = true;
        if (filterRange === 'today') matchTime = itemDate >= startOfDay;
        else if (filterRange === 'week') matchTime = itemDate >= startOfWeek;
        else if (filterRange === 'month') matchTime = itemDate >= startOfMonth;
        else if (filterRange === 'year') matchTime = itemDate >= startOfYear;

        // 2. Logika Filter Toko
        let matchStore = true;
        if (filterStore !== 'all') {
          // Pastikan perbandingan menggunakan string agar aman
          matchStore = item.store_id?.toString() === filterStore;
        }

        // 3. LOGIKA PENCARIAN (Baru)
        const searchLower = searchQuery.toLowerCase();
        const matchSearch =
          item.product_name?.toLowerCase().includes(searchLower) ||
          item.store?.name?.toLowerCase().includes(searchLower) ||
          item.marketplace_name?.toLowerCase().includes(searchLower);

        return matchTime && matchStore && matchSearch; // Tambahkan matchSearch
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [salesRecords, filterRange, filterStore, searchQuery]); // Tambahkan searchQuery di sini

  const stats = useMemo(() => {
    if (!filteredSales || filteredSales.length === 0) {
      return { totalModal: 0, totalJual: 0, totalFee: 0, netProfit: 0, margin: 0 };
    }

    const totalModal = filteredSales.reduce((acc, curr) => {
      const buyPrice = parseFloat(curr.buy_price) || 0;
      const qty = parseFloat(curr.qty) || 0;
      return acc + (buyPrice * qty);
    }, 0);

    const totalJual = filteredSales.reduce((acc, curr) => {
      const sellPrice = parseFloat(curr.sell_price) || 0;
      const qty = parseFloat(curr.qty) || 0;
      return acc + (sellPrice * qty);
    }, 0);

    const totalAllFees = filteredSales.reduce((acc, curr) => {
      const qty = parseFloat(curr.qty) || 1;
      const sellPrice = parseFloat(curr.sell_price) || 0;
      const sellTotal = sellPrice * qty;

      const mktPercent = parseFloat(curr.marketplace_fee_percent) || 0;
      const promoPercent = parseFloat(curr.promo_extra_percent) || 0;
      const totalPercent = mktPercent + promoPercent;

      const feeAmount = (sellTotal * totalPercent) / 100;

      const flatFees = parseFloat(curr.flat_fees) || 0;
      const extra = parseFloat(curr.extra_costs) || 0;
      const shipping = parseFloat(curr.shipping_cost) || 0;

      return acc + feeAmount + flatFees + extra + shipping;
    }, 0);

    const netProfit = totalJual - totalModal - totalAllFees;
    const margin = totalJual > 0 ? (netProfit / totalJual) * 100 : 0;

    return { totalModal, totalJual, totalFee: totalAllFees, netProfit, margin };
  }, [filteredSales]);

  const [open, setOpen] = useState(false); // State untuk kontrol modal
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Fungsi untuk membuka modal Edit
  const handleEdit = (item: any) => {
    setIsEditing(true);
    setEditId(item.id);

    // Pastikan semua nilai adalah Number untuk menghindari NaN
    setData({
      date: item.date || new Date().toISOString().split('T')[0],
      store_id: item.store_id ? item.store_id.toString() : '',
      product_name: item.product_name || '',
      qty: Number(item.qty) || 1,
      buy_price: Number(item.buy_price) || 0,
      sell_price: Number(item.sell_price) || 0,
      marketplace_fee_percent: Number(item.marketplace_fee_percent) || 0,
      promo_extra_percent: Number(item.promo_extra_percent) || 0,
      marketplace_name: item.marketplace_name || 'Shopee',
      shipping_cost: Number(item.shipping_cost) || 0,
      // Perhatikan: pastikan mapping field dari DB (biasanya flat_fees) benar
      order_process_fee: Number(item.flat_fees) || 0,
      extra_costs: Number(item.extra_costs) || 0,
    });
    setOpen(true);
  };

  const [data, setData] = useState({
    date: new Date().toISOString().split('T')[0], // Default hari ini (YYYY-MM-DD)
    store_id: '',
    product_name: '',
    qty: 1,
    buy_price: 0,
    sell_price: 0,
    marketplace_fee_percent: 9.5, // Sesuai migrasi
    promo_extra_percent: 4.5,    // Promo Extra (%)
    marketplace_name: 'Shopee',  // Sesuai migrasi
    shipping_cost: 0,           // Sesuai migrasi
    order_process_fee: 1250,     // Biaya Proses (Flat) pengganti flat_fees
    extra_costs: 0,       // Untuk Iklan atau Affiliate
  });

  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Fungsi Handler khusus untuk Nama Produk
  const handleProductNameChange = (value: string) => {
    // 1. Update nama produk di state
    setData((prev) => ({ ...prev, product_name: value }));

    // 2. FITUR AUTO-FILL: Cari produk yang namanya cocok (case-insensitive)
    const foundProduct = products.find(
      (p: any) => p.name.toLowerCase() === value.toLowerCase()
    );

    if (foundProduct) {
      // Jika ketemu, isi harga beli otomatis dari last_price produk tersebut
      setData((prev) => ({
        ...prev,
        product_name: value,
        buy_price: foundProduct.last_price || 0,
        sell_price: foundProduct.last_sell_price || 0
      }));
    }

    if (foundProduct) {
      // ... set data
      // 3. Fokus ke Qty setelah delay tipis agar state terupdate dulu
      setTimeout(() => qtyInputRef.current?.focus(), 100);
    }
  };

  const [calc, setCalc] = useState({
    feeAmount: 0,
    netProfit: 0
  });

  // Efek kalkulasi otomatis (Reaktif)
  useEffect(() => {

    localStorage.setItem('preferred_sales_filter', filterRange);

    const quantity = Number(data.qty || 1);
    const totalSell = data.sell_price * quantity;

    // 1. Hitung total biaya berbasis persentase (Admin + Promo Extra)
    const totalPercent = Number(data.marketplace_fee_percent) + Number(data.promo_extra_percent);
    const percentageFeeAmount = (totalSell * totalPercent) / 100;

    // 2. Total Potongan = Biaya Persen + Biaya Proses Flat + Biaya Lainnya
    const totalPotongan = percentageFeeAmount + data.order_process_fee + data.extra_costs;

    // 3. Profit Bersih
    const totalProfit = (totalSell - (data.buy_price * quantity)) - totalPotongan;

    setCalc({
      feeAmount: totalPotongan,
      netProfit: totalProfit
    });
  }, [data, filterRange]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analisa Penghasilan" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>💰</span> Analisa Penghasilan
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Pantau margin keuntungan di setiap marketplace.
            </p>
          </div>

          {/* TOMBOL UNTUK MEMBUKA MODAL */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditId(null);
                  setData({
                    date: new Date().toISOString().split('T')[0],
                    store_id: '',
                    product_name: '',
                    qty: 1,
                    buy_price: 0,
                    sell_price: 0,
                    marketplace_fee_percent: 9.5,
                    marketplace_name: 'Shopee',
                    promo_extra_percent: 4.5,
                    shipping_cost: 0,
                    order_process_fee: 1250,
                    extra_costs: 0,
                  });
                }}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Penjualan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form
                {...(isEditing
                  ? SalesRecordController.update.form(editId)
                  : SalesRecordController.store.form()
                )}
                onSuccess={() => {
                  setOpen(false);
                  setIsEditing(false);
                  setEditId(null); // Reset ID edit
                  setData({ // Reset ke default
                    date: new Date().toISOString().split('T')[0],
                    store_id: '',
                    product_name: '',
                    qty: 1,
                    buy_price: 0,
                    sell_price: 0,
                    marketplace_fee_percent: 9.5,
                    marketplace_name: 'Shopee',
                    promo_extra_percent: 4.5,
                    shipping_cost: 0,
                    order_process_fee: 1250,
                    extra_costs: 0,
                  });
                }}
              >
                {({ processing, errors }) => (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Pencil className="w-5 h-5 text-blue-500" />
                            Edit Penjualan
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5 text-blue-500" />
                            Tambah Penjualan
                          </>
                        )}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px]">
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label>Tanggal Transaksi</Label>
                            <Input
                              type="datetime-local"
                              name="created_at"
                              defaultValue={(() => {
                                const sekarang = new Date();
                                const offset = sekarang.getTimezoneOffset() * 60000;
                                const waktuLokal = new Date(sekarang.getTime() - offset);
                                return waktuLokal.toISOString().slice(0, 16);
                              })()}
                              className='block w-full'
                              required
                            />
                            <InputError message={errors.created_at} />
                          </div>

                          <div className='grid grid-cols-4 md:col-span-2 gap-4'>
                            {/* NAMA PRODUK */}
                            <div className="grid col-span-3 gap-2">
                              <Label>Nama Produk</Label>
                              <Input
                                list="product-suggestions"
                                name='product_name'
                                value={data.product_name}
                                onChange={(e) => handleProductNameChange(e.target.value)}
                                autoComplete="off"
                                placeholder="Contoh: Pakan Kucing"
                                required
                              />
                              <InputError message={errors.product_name} />
                            </div>

                            <div className="grid gap-2">
                              <Label className="truncate">Qty</Label>
                              <Input
                                ref={qtyInputRef}
                                type="number"
                                min="1"
                                name='qty'
                                value={data.qty}
                                onChange={(e) => setData({ ...data, qty: Number(e.target.value) })}
                                required
                              />
                              <InputError message={errors.qty} />
                            </div>
                          </div>

                          <datalist id="product-suggestions">
                            {products.map((p: any) => (
                              <option key={p.id} value={p.name} />
                            ))}
                          </datalist>
                        </div>

                        {/* QTY, HARGA BELI, HARGA JUAL */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="truncate">Harga Beli (Modal)</Label>
                            <Input
                              type="text"
                              name='buy_price'
                              value={formatRupiah(data.buy_price)}
                              onChange={(e) => setData({ ...data, buy_price: parseRupiah(e.target.value) })}
                              required
                            />
                            <InputError message={errors.buy_price} />
                          </div>
                          <div className="grid gap-2">
                            <Label className="truncate">Harga Jual</Label>
                            <Input
                              type="text"
                              name='sell_price'
                              value={formatRupiah(data.sell_price)}
                              onChange={(e) => setData({ ...data, sell_price: parseRupiah(e.target.value) })}
                              required
                            />
                            <InputError message={errors.sell_price} />
                          </div>
                        </div>

                        {/* MARKETPLACE & FEE ADMIN */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Pilih Toko Anda</Label>
                            <Select
                              name='store_id'
                              value={data.store_id}
                              onValueChange={(val) => setData({ ...data, store_id: val })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Toko" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Daftar Toko Kamu</SelectLabel>
                                  {/* 3. Looping data stores dari database */}
                                  {stores && stores.length > 0 ? (
                                    stores.map((store: any) => (
                                      <SelectItem key={store.id} value={store.id.toString()}>
                                        <span className="capitalize">{store.name}</span>
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="none" disabled>Belum ada toko</SelectItem>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <InputError message={errors.store_id} />
                          </div>
                          <div className="grid gap-2">
                            <Label className="truncate">Marketplace</Label>
                            <Select
                              name='marketplace_name'
                              value={data.marketplace_name}
                              onValueChange={(val) => setData({ ...data, marketplace_name: val })}
                              required
                            >
                              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Shopee">Shopee</SelectItem>
                                <SelectItem value="Lazada">Lazada</SelectItem>
                                <SelectItem value="Tokopedia">Tokopedia</SelectItem>
                                <SelectItem value="TikTok Shop">TikTok Shop</SelectItem>
                              </SelectContent>
                            </Select>
                            <InputError message={errors.marketplace_name} />
                          </div>
                        </div>

                        {/* BIAYA PROSES, PROMO, EXTRA */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="truncate">Admin Fee (%)</Label>
                            <Input
                              type="number"
                              name='marketplace_fee_percent'
                              value={data.marketplace_fee_percent}
                              onChange={(e) => setData({ ...data, marketplace_fee_percent: Number(e.target.value) })}
                              required
                            />
                            <InputError message={errors.marketplace_fee_percent} />
                          </div>
                          <div className="grid gap-2">
                            <Label className="truncate">Biaya Proses</Label>
                            <Input
                              type="text"
                              name='flat_fees'
                              value={formatRupiah(data.order_process_fee)}
                              onChange={(e) => setData({ ...data, order_process_fee: parseRupiah(e.target.value) })}
                              required
                            />
                            <InputError message={errors.flat_fees} />
                          </div>
                          <div className="grid gap-2">
                            <Label className="truncate">Promo Extra (%)</Label>
                            <Input
                              type="number"
                              name='promo_extra_percent'
                              step="0.1"
                              value={data.promo_extra_percent}
                              onChange={(e) => setData({ ...data, promo_extra_percent: Number(e.target.value) })}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="truncate">Lainnya (iklan, dll)</Label>
                            <Input
                              type="text"
                              name='extra_costs'
                              placeholder="Rp 0"
                              value={formatRupiah(data.extra_costs)}
                              onChange={(e) => setData({ ...data, extra_costs: parseRupiah(e.target.value) })}
                              required
                            />
                            <InputError message={errors.extra_costs} />
                          </div>
                        </div>

                        {/* RINGKASAN KALKULASI */}
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Potongan Persen ({(Number(data.marketplace_fee_percent) + Number(data.promo_extra_percent)).toFixed(2)}%):</span>
                            <span className="text-red-500">
                              - Rp {formatRupiah((data.sell_price * data.qty * (Number(data.marketplace_fee_percent) + Number(data.promo_extra_percent))) / 100)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Biaya Proses & Lainnya:
                              <p className="text-xs text-slate-400 italic">(iklan, affiliate, dll)</p>
                            </span>
                            <span className="text-red-500">
                              - Rp {formatRupiah(Number(data.order_process_fee) + Number(data.extra_costs))}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm pt-2 border-t">
                            <span>Estimasi Profit Bersih:</span>
                            <span className={(calc.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                              Rp {formatRupiah(calc.netProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button
                        type='button'
                        variant="ghost"
                        onClick={() => {
                          setOpen(false);
                          setIsEditing(false);
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        type='submit'
                        disabled={processing || !data.store_id}
                        className={`${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} cursor-pointer text-white`}
                      >
                        {processing ? (
                          <><Spinner className="h-4 w-4 animate-spin" /> Menyimpan...</>
                        ) : (
                          <><Save className="w-4 h-4" /> {isEditing ? 'Perbarui' : 'Simpan'}</>
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          {/* Bagian Kiri: Filter Waktu */}
          <div className="flex flex-wrap gap-2 mb-4">
            {['today', 'week', 'month', 'year', 'all'].map((range) => (
              <Button
                key={range}
                variant={filterRange === range ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => setFilterRange(range as any)}
              >
                {range === 'today' ? 'Hari Ini' :
                  range === 'week' ? 'Minggu' :
                    range === 'month' ? 'Bulan' :
                      range === 'year' ? 'Tahun' : 'Semua'}
              </Button>
            ))}
          </div>
          {/* Bagian Kanan: Filter Toko */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <Label className="text-muted-foreground italic">Toko:</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-1 focus:ring-ring"
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="all">Semua Toko</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id.toString()}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dashboard Ringkasan */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Penjualan */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {/* Gunakan stats.totalJual agar konsisten dengan hitungan stats */}
              <div className="text-2xl font-bold">Rp {formatRupiah(stats.totalJual)}</div>
            </CardContent>
          </Card>

          {/* Profit Bersih */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profit Bersih</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rp {formatRupiah(stats.netProfit)}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                {/* Tambahkan pengecekan jika margin NaN (pembagi nol) */}
                {isFinite(stats.margin) ? stats.margin.toFixed(1) : 0}% Margin
              </p>
            </CardContent>
          </Card>

          {/* Potongan Admin */}
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Potongan Admin</CardTitle>
              <Percent className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {/* PERBAIKAN: Gunakan stats.totalFee, jangan reduce lagi di sini */}
              <div className="text-2xl font-bold text-orange-600">
                Rp {formatRupiah(stats.totalFee)}
              </div>
            </CardContent>
          </Card>
        </div>

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
              {flash.message || 'Tersimpan'}
            </AlertTitle>
          </Alert>
        </Transition>

        {/* Tabel Data Penjualan */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Detail Margin per Produk</CardTitle>
              <p className="text-xs text-muted-foreground">Menampilkan {filteredSales.length} transaksi</p>
            </div>

            {/* INPUT PENCARIAN DI DALAM CARD HEADER */}
            <div className="relative w-full md:w-72">
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9" // h-9 agar tingginya pas dengan desain Shadcn
              />
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                    <TableHead className="pb-3">Tanggal</TableHead>
                    <TableHead className="pb-3">Produk & Toko</TableHead>
                    <TableHead className="pb-3 text-right">Harga Beli</TableHead>
                    <TableHead className="pb-3 text-right">Harga Jual</TableHead>
                    <TableHead className="pb-3 text-right">Potongan</TableHead>
                    <TableHead className="pb-3 text-right text-green-600">Margin/Profit</TableHead>
                    <TableHead className="pb-3 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {filteredSales.map((item: any) => {
                    const qty = Number(item.qty || 1);
                    const sellPrice = Number(item.sell_price || 0);
                    const buyPrice = Number(item.buy_price || 0);

                    // 1. Kalkulasi total harga
                    const totalJualBaris = sellPrice * qty;
                    const totalModalBaris = buyPrice * qty;

                    // 2. Gabungkan SEMUA persentase potongan (Admin + Promo)
                    const totalPercent = Number(item.marketplace_fee_percent || 0) + Number(item.promo_extra_percent || 0);

                    // 3. Hitung nominal potongan dari persentase tersebut
                    const totalAdminFee = (totalJualBaris * totalPercent) / 100;

                    // 4. Hitung total biaya (Gunakan totalAdminFee, bukan adminFee yang lama)
                    const totalFees = totalAdminFee + Number(item.flat_fees || 0) + Number(item.extra_costs || 0);

                    // 5. Profit Bersih (Harga Jual - Modal - Total Biaya)
                    const profitPerItem = totalJualBaris - totalModalBaris - totalFees;

                    // 6. Hitung Margin
                    const marginPercent = totalJualBaris > 0 ? (profitPerItem / totalJualBaris) * 100 : 0;

                    return (
                      <TableRow key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <TableCell className="py-4 text-slate-500">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1">
                            {/* Nama Produk dengan line-clamp agar tidak merusak layout jika teks terlalu panjang */}
                            <div className="font-semibold text-sm capitalize text-slate-900 dark:text-slate-100 line-clamp-1">
                              {item.product_name || 'Tanpa Nama'}
                              {/* Info Qty dengan pemisah dot */}
                              <span className="text-slate-300 dark:text-slate-700 ms-1">•</span>
                              <span className="ms-1 text-[10px] font-medium text-slate-500 uppercase tracking-tight">
                                {qty} Pcs
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className='flex items-center gap-1'>
                                {/* Badge Marketplace yang lebih bergaya */}
                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${item.marketplace_name === 'Shopee' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900' :
                                  item.marketplace_name === 'Tokopedia' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/30 dark:border-green-900' :
                                    item.marketplace_name === 'TikTok Shop' ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200' :
                                      'bg-blue-50 text-blue-600 border-blue-100'
                                  }`}>
                                  <Store className="w-2.5 h-2.5 mr-1" />
                                  {item.marketplace_name || 'Umum'}
                                </div>
                                <span className="font-bold text-xs capitalize text-slate-900 dark:text-slate-300">{item.store.name || 'No Store'}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">Rp {formatRupiah(item.buy_price)}</TableCell>
                        <TableCell className="py-4 text-right font-medium">Rp {formatRupiah(item.sell_price)}</TableCell>
                        <TableCell className="py-4 text-right text-red-500">
                          - Rp {formatRupiah(totalFees)}
                          <div className="text-[9px] text-slate-400">({totalPercent}%)</div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="font-bold text-green-600">Rp {formatRupiah(profitPerItem)}</div>
                          {/* Indikator Margin per Produk */}
                          <div className="text-[9px] text-slate-400">
                            Margin: {marginPercent.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Form {...SalesRecordController.destroy.form(item.id)}>
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                                onClick={(e) => { if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) { e.preventDefault(); } }}
                              >
                                <Plus className="w-4 h-4 rotate-45" />
                              </Button>
                            </Form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Menggunakan colSpan=2 karena sekarang ada kolom Tanggal + Produk & Toko */}
                    <TableHead colSpan={2} className="font-bold uppercase text-[12px] py-4">
                      Total Keseluruhan
                    </TableHead>

                    {/* Harga Beli */}
                    <TableHead className="text-right font-bold">
                      Rp {formatRupiah(stats.totalModal)}
                    </TableHead>

                    {/* Harga Jual */}
                    <TableHead className="text-right font-bold">
                      Rp {formatRupiah(stats.totalJual)}
                    </TableHead>

                    {/* Potongan */}
                    <TableHead className="text-right font-bold text-red-500">
                      - Rp {formatRupiah(stats.totalFee)}
                    </TableHead>

                    {/* Margin/Profit */}
                    <TableHead className="text-right font-bold text-green-600 text-lg">
                      Rp {formatRupiah(stats.netProfit)}
                    </TableHead>

                    {/* Kolom Aksi (Kosong) */}
                    <TableHead></TableHead>
                  </TableRow>
                </TableFooter>

                {filteredSales.length === 0 && (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Package2 className="w-6 h-6 text-orange-500" />
                            </EmptyMedia>
                            <EmptyTitle className="text-slate-400">Belum ada data.</EmptyTitle>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}