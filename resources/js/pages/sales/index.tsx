/* eslint-disable @typescript-eslint/no-explicit-any */
import SalesRecordController from '@/actions/App/Http/Controllers/SalesRecordController';
import InputError from '@/components/input-error';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import salesRecord from '@/routes/sales-record';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import { ArrowUpRight, CheckCircle2Icon, DollarSign, Percent, Plus, Save, Store, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Penghasilan',
    href: salesRecord.index().url,
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

export default function Index({ products, ...props }: any) {

  const { flash } = usePage().props as any;

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

  // Contoh data (Nanti data ini datang dari props Laravel)
  const [sales] = useState([
    { id: 1, product: 'Pakan Kucing 1kg', buy: 18000, sell: 25000, marketplace: 'Shopee', fee: 1250 },
    { id: 2, product: 'Botol Minum', buy: 15000, sell: 20000, marketplace: 'Lazada', fee: 1000 },
  ]);

  // Kalkulasi Total Dashboard
  const stats = useMemo(() => {
    const totalModal = sales.reduce((acc, curr) => acc + curr.buy, 0);
    const totalJual = sales.reduce((acc, curr) => acc + curr.sell, 0);
    const totalFee = sales.reduce((acc, curr) => acc + curr.fee, 0);
    const netProfit = totalJual - totalModal - totalFee;
    const margin = (netProfit / totalJual) * 100;

    return { totalModal, totalJual, netProfit, margin };
  }, [sales]);

  const [open, setOpen] = useState(false); // State untuk kontrol modal

  const [data, setData] = useState({
    product_name: '',
    buy_price: 0,
    sell_price: 0,
    marketplace_fee_percent: 5, // Sesuai migrasi
    marketplace_name: 'Shopee',  // Sesuai migrasi
    shipping_cost: 0,           // Sesuai migrasi
  });

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
        buy_price: foundProduct.last_price || 0
      }));
    }
  };

  const [calc, setCalc] = useState({
    feeAmount: 0,
    netProfit: 0
  });

  // Efek kalkulasi otomatis (Reaktif)
  useEffect(() => {
    const fee = (data.sell_price * data.marketplace_fee_percent) / 100;
    const profit = data.sell_price - data.buy_price - fee;
    setCalc({ feeAmount: fee, netProfit: profit });
  }, [data]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analisa Penghasilan" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">💰 Analisa Penghasilan</h2>
            <p className="text-muted-foreground">Pantau margin keuntungan di setiap marketplace.</p>
          </div>

          {/* TOMBOL UNTUK MEMBUKA MODAL */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Penjualan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form {...SalesRecordController.store()}
                onSuccess={() => {
                  setOpen(false); // Tutup modal otomatis
                  setData({       // Reset form manual karena kita pakai state lokal
                    product_name: '',
                    buy_price: 0,
                    sell_price: 0,
                    marketplace_fee_percent: 5,
                    marketplace_name: 'Shopee',
                    shipping_cost: 0,
                  });
                }}>
                {({ processing, errors }) => (
                  <>
                    <DialogHeader>
                      <DialogTitle>Tambah Penjualan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Nama Produk</Label>
                        <Input
                          list="product-suggestions" // Hubungkan ke datalist
                          name='product_name'
                          value={data.product_name}
                          onChange={(e) => handleProductNameChange(e.target.value)}
                          autoComplete="off"
                          placeholder="Contoh: Pakan Kucing"
                        />
                        <InputError message={errors.product_name} />
                      </div>

                      <datalist id="product-suggestions">
                        {products.map((p: any) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Harga Beli (Modal)</Label>
                          <Input
                            type="text"
                            name='buy_price'
                            value={formatRupiah(data.buy_price)}
                            onChange={(e) => setData({ ...data, buy_price: parseRupiah(e.target.value) })}
                          />
                          <InputError message={errors.buy_price} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Harga Jual</Label>
                          <Input
                            type="text"
                            name='sell_price'
                            value={formatRupiah(data.sell_price)}
                            onChange={(e) => setData({ ...data, sell_price: parseRupiah(e.target.value) })}
                          />
                          <InputError message={errors.sell_price} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Marketplace</Label>
                          <Select name='marketplace_name'>
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
                        <div className="grid gap-2">
                          <Label>Fee Admin (%)</Label>
                          <Input
                            type="number"
                            name='marketplace_fee_percent'
                            value={data.marketplace_fee_percent}
                            onChange={(e) => setData({ ...data, marketplace_fee_percent: Number(e.target.value) })}
                          />
                          <InputError message={errors.marketplace_fee_percent} />
                        </div>
                      </div>

                      {/* Ringkasan Kalkulasi Otomatis */}
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Potongan Admin:</span>
                          <span className="text-red-500">- Rp {calc.feeAmount.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm">
                          <span>Estimasi Profit Bersih:</span>
                          <span className="text-green-600">Rp {calc.netProfit.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type='button' variant="secondary">Batal</Button>
                      </DialogClose>
                      <Button type='submit' disabled={processing} className="bg-orange-600 hover:bg-orange-700 cursor-pointer">
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
                    </DialogFooter>
                  </>
                )}
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard Ringkasan */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.totalJual.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profit Bersih</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rp {stats.netProfit.toLocaleString('id-ID')}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.margin.toFixed(1)}% Margin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Potongan Admin</CardTitle>
              <Percent className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {sales.reduce((acc, curr) => acc + curr.fee, 0).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        <Transition
          show={showSuccess}
          enter="transition ease-in-out"
          enterFrom="opacity-0"
          leave="transition ease-in-out"
          leaveTo="opacity-0"
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
          <CardHeader>
            <CardTitle className="text-lg">Detail Margin per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full text-sm">
                <TableHeader>
                  <TableRow className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                    <TableHead className="pb-3">Produk & Toko</TableHead>
                    <TableHead className="pb-3 text-right">Harga Beli</TableHead>
                    <TableHead className="pb-3 text-right">Harga Jual</TableHead>
                    <TableHead className="pb-3 text-right">Potongan</TableHead>
                    <TableHead className="pb-3 text-right text-green-600">Margin/Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {sales.map((item) => {
                    const profitPerItem = item.sell - item.buy - item.fee;
                    // const marginPercent = (profitPerItem / item.sell) * 100;

                    return (
                      <TableRow key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="font-bold">{item.product}</div>
                          <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                            <Store className="w-3 h-3 mr-1" /> {item.marketplace}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">Rp {item.buy.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="py-4 text-right font-medium">Rp {item.sell.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="py-4 text-right text-red-500">- Rp {item.fee.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="font-bold text-green-600">Rp {profitPerItem.toLocaleString('id-ID')}</div>
                          {/* <Badge className="text-[9px] py-0 px-1 border-green-200 text-green-600">
                            {marginPercent.toFixed(1)}%
                          </Badge> */}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableHead className="text-center font-bold uppercase text-[15px]">Total</TableHead>
                    <TableHead className="text-right font-bold">Rp {sales.reduce((acc, curr) => acc + curr.buy, 0).toLocaleString('id-ID')}</TableHead>
                    <TableHead className="text-right font-bold">Rp {sales.reduce((acc, curr) => acc + curr.sell, 0).toLocaleString('id-ID')}</TableHead>
                    <TableHead className="text-right font-bold">- Rp {sales.reduce((acc, curr) => acc + curr.fee, 0).toLocaleString('id-ID')}</TableHead>
                    <TableHead className="text-right font-bold text-green-600">Rp {sales.reduce((acc, curr) => acc + (curr.sell - curr.buy - curr.fee), 0).toLocaleString('id-ID')}</TableHead>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}