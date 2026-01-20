/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'; // Tambahkan useState & useMemo
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // Pastikan ada component Input
import { Label } from '@/components/ui/label'; // Pastikan ada component Label
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BarChart3, TrendingDown, TrendingUp, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import analysis from '@/routes/analysis';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Analisa Margin', href: '/analysis/margin' },
];

export default function MarginAnalysis({ analysisData }: { analysisData: any[] }) {
  // 1. State untuk menyimpan nilai Persen Admin secara dinamis
  const [adminPercent, setAdminPercent] = useState<number>(9.5);
  const [fixFee, setFixFee] = useState<number>(1250); // Biaya proses pesanan tetap
  const [extraPercent, setExtraPercent] = useState<number>(4.5); // Gratis Ongkir/Cashback Extra
  const [marketingFee, setMarketingFee] = useState<number>(0); // Iklan/Affiliate
  // Tambahkan ini: filterStatus bisa 'all', 'kritis', 'tipis', atau 'sehat'
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(''); // State pencarian
  const [selectedStore, setSelectedStore] = useState<string>('all'); // State filter toko

  const targetMarginPercent = 20;

  const { summary, filteredData, stores } = useMemo(() => {
    let totalProfit = 0;
    let totalInvValue = 0;

    // Ambil daftar toko unik dari analysisData untuk dropdown filter
    const uniqueStores = Array.from(new Set(analysisData.map(item => item.store_name).filter(Boolean)));

    const allData = analysisData.map((product) => {
      // Pastikan semua diconvert ke Number dan handle jika null/undefined
      const sellPrice = Number(product.sell_price || 0);

      // Cek apakah kolomnya buy_price atau last_price
      const buyPrice = Number(product.buy_price ?? product.last_price ?? 0);

      // Ambil stok (pastikan field ini ada di query Controller kamu)
      const currentStock = Number(product.stock ?? product.qty ?? 0);

      const adminAmount = (sellPrice * adminPercent) / 100;
      const extraAmount = (sellPrice * extraPercent) / 100;
      const marketingAmount = (sellPrice * marketingFee) / 100;

      const totalDeduction = adminAmount + extraAmount + marketingAmount + fixFee;
      const netProfitPerItem = sellPrice - buyPrice - totalDeduction;

      // HANYA hitung jika stok lebih dari 0 dan harga beli ada
      if (currentStock > 0) {
        // eslint-disable-next-line react-hooks/immutability
        totalInvValue += (buyPrice * currentStock);
        totalProfit += (netProfitPerItem * currentStock);
      }

      const marginPercent = sellPrice > 0 ? (netProfitPerItem / sellPrice) * 100 : 0;
      const totalPercentDecimal = (adminPercent + extraPercent + marketingFee + targetMarginPercent) / 100;

      // Cegah pembagian dengan nol (Infinity)
      const divider = 1 - totalPercentDecimal;
      const recommendedPrice = divider > 0 ? (buyPrice + fixFee) / divider : 0;

      return {
        ...product,
        buy_price_final: buyPrice, // simpan untuk tampilan tabel
        admin_fee_amount: totalDeduction,
        net_profit: netProfitPerItem,
        margin_percent: Math.round(marginPercent * 100) / 100,
        recommended_price: Math.ceil(recommendedPrice / 100) * 100,
      };
    });

    // LOGIKA FILTER:
    // GABUNGAN SEMUA FILTER
    const filtered = allData.filter((item) => {
      // 1. Filter Status Kesehatan
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'kritis' && item.margin_percent <= 5) ||
        (filterStatus === 'tipis' && item.margin_percent > 5 && item.margin_percent <= 15) ||
        (filterStatus === 'sehat' && item.margin_percent > 15);

      // 2. Filter Pencarian Nama Produk
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Filter Nama Toko
      const matchesStore = selectedStore === 'all' || item.store_name === selectedStore;

      return matchesStatus && matchesSearch && matchesStore;
    });

    // Hitung ulang summary hanya dari data yang sudah di-filter (agar angka di Card ikut berubah)
    filtered.forEach(item => {
      const currentStock = Number(item.stock || 0);
      totalInvValue += (Number(item.buy_price) * currentStock);
      totalProfit += (item.net_profit * currentStock);
    });

    return {
      summary: { totalPotentialProfit: totalProfit, totalInventoryValue: totalInvValue },
      filteredData: filtered,
      stores: uniqueStores
    };
  }, [adminPercent, extraPercent, marketingFee, fixFee, analysisData, filterStatus, searchQuery, selectedStore]);

  const getMarginBadge = (percent: number) => {
    if (percent <= 5) return <Badge variant="destructive">Kritis ({percent}%)</Badge>;
    if (percent <= 15) return <Badge className="bg-orange-500 text-white border-none">Tipis ({percent}%)</Badge>;
    return <Badge className="bg-green-600 text-white border-none">Sehat ({percent}%)</Badge>;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Simulator Analisa Margin" />
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>Simulator Analisa Margin</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              <span className="font-bold">AyoKulakan.id</span> - Analisa Margin
            </p>
          </div>
        </div>

        {/* Bagian Input Simulator */}
        <Card className="border-none bg-gradient-to-br from-slate-50 to-blue-50 shadow-sm dark:from-slate-900/50 dark:to-blue-950/20">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Kalkulator Biaya Admin
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Biaya Admin Dasar */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Admin Dasar (%)</Label>
                <Input
                  type="number"
                  value={adminPercent}
                  onChange={(e) => setAdminPercent(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              {/* Biaya Program Extra */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-orange-600">Program Extra (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={extraPercent}
                    onChange={(e) => setExtraPercent(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="bg-white dark:bg-slate-950"
                  />
                  <Button size="sm" variant="outline" onClick={() => setExtraPercent(9)}>9%</Button>
                </div>
              </div>

              {/* Biaya Proses Tetap */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fix Fee / Pesanan (Rp)</Label>
                <Input
                  type="number"
                  value={fixFee}
                  onChange={(e) => setFixFee(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="bg-white dark:bg-slate-950"
                />
              </div>

              {/* Iklan & Affiliate */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-600">Iklan / Affiliate (%)</Label>
                <Input
                  type="number"
                  value={marketingFee}
                  onChange={(e) => setMarketingFee(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <p className="mt-4 text-[10px] text-slate-500 italic">
              *Rumus: Harga Jual - Modal - (Admin + Extra + Iklan)% - Fix Fee {fixFee.toLocaleString()} = Profit Bersih.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kartu Nilai Inventori */}
          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-slate-400">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Modal Mengendap</p>
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                    Rp {summary.totalInventoryValue.toLocaleString('id-ID')}
                  </h3>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <BarChart3 className="w-6 h-6 text-slate-500" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">*Total harga beli x stok saat ini</p>
            </CardContent>
          </Card>

          {/* Kartu Potensi Profit */}
          <Card className="bg-white dark:bg-slate-900 border-l-4 border-l-green-500 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Estimasi Profit Bersih</p>
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                    Rp {summary.totalPotentialProfit.toLocaleString('id-ID')}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-[10px] text-green-500 mt-2 italic">*Profit bersih (setelah biaya admin) jika semua stok laku</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="space-y-4 sticky top-15 z-30 py-4 backdrop-blur-md border-b border-transparent transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Hasil Simulasi Profit
              </CardTitle>

              {/* Indikator Jumlah */}
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Menampilkan {filteredData.length} Produk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Input Pencarian */}
              <div className="relative">
                <Input
                  placeholder="Cari nama produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3"
                />
              </div>

              {/* Filter Toko */}
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="all">Semua Toko</option>
                {stores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>

              {/* Filter Status (Tombol yang tadi) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'ghost'}
                  size="sm" onClick={() => setFilterStatus('all')}
                  className="flex-1 text-[10px] h-8 px-1"
                >Semua</Button>
                <Button
                  variant={filterStatus === 'kritis' ? 'destructive' : 'ghost'}
                  size="sm" onClick={() => setFilterStatus('kritis')}
                  className="flex-1 text-[10px] h-8 px-1"
                >Kritis</Button>
                <Button
                  variant={filterStatus === 'tipis' ? 'secondary' : 'ghost'}
                  size="sm" onClick={() => setFilterStatus('tipis')}
                  className={`flex-1 text-[10px] h-8 px-1 ${filterStatus === 'tipis' ? 'bg-orange-500 text-white' : ''}`}
                >Tipis</Button>
                <Button
                  variant={filterStatus === 'sehat' ? 'secondary' : 'ghost'}
                  size="sm" onClick={() => setFilterStatus('sehat')}
                  className={`flex-1 text-[10px] h-8 px-1 ${filterStatus === 'sehat' ? 'bg-green-600 text-white' : ''}`}
                >Sehat</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900">
                <TableRow>
                  <TableHead>Toko</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga Modal</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Potongan ({adminPercent}%)</TableHead>
                  <TableHead>Profit Bersih</TableHead>
                  <TableHead>Kesehatan</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/30">Saran Harga (Margin 20%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs text-slate-500 capitalize truncate max-w-[100px]">{item.store_name || '-'}</TableCell>
                      <TableCell className="font-medium capitalize truncate max-w-[150px]">{item.name}</TableCell>
                      <TableCell>Rp {item.buy_price.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {item.sell_price.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-red-500 text-xs italic">
                        - Rp {item.admin_fee_amount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className={`font-bold ${item.net_profit <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                        <div className="flex items-center gap-1">
                          {item.net_profit > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          Rp {item.net_profit.toLocaleString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>{getMarginBadge(item.margin_percent)}</TableCell>
                      <TableCell className="bg-green-50/50 dark:bg-green-950/10 font-bold">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-blue-600">Rp {item.recommended_price.toLocaleString('id-ID')}</span>
                            <span className="text-[10px] text-slate-400 font-normal">Target untung 20%</span>
                          </div>

                          {/* Tombol Terapkan */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                Terapkan <ArrowRight className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[2rem] p-6 gap-6 sm:w-full">
                              <AlertDialogHeader>
                                <div className="flex flex-col items-center gap-4 text-center">
                                  {/* Icon Info yang Cantik */}
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Info className="h-6 w-6 text-blue-600" />
                                  </div>

                                  <div className="space-y-2">
                                    <AlertDialogTitle className="text-xl font-bold tracking-tight">
                                      Info Rekomendasi Harga
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                      Harga rekomendasi <span className="font-bold text-slate-900 dark:text-slate-200">Rp {item.recommended_price.toLocaleString('id-ID')}</span> akan diterapkan untuk produk <span className="font-bold text-slate-900 dark:text-slate-200 capitalize">{item.name}</span>.
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
                                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none border-none cursor-pointer"
                                >
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                      router.patch(analysis.margin.updatePrice(item.id), {
                                        sell_price: item.recommended_price
                                      }, {
                                        onStart: () => toast.loading('Memperbarui harga...', { id: 'margin' }),
                                        onSuccess: () => toast.success('Harga berhasil diperbarui!', { id: 'margin' }),
                                        onError: () => toast.error('Gagal memperbarui harga!', { id: 'margin' }),
                                        preserveScroll: true,
                                      });
                                    }}
                                  >
                                    Terapkan
                                  </Button>
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                      Tidak ada produk dengan kategori ini.
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