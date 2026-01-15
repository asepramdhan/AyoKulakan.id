import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import marketplace from '@/routes/marketplace';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, CalendarClock, CheckCircle2, ClipboardCheck, Clock, ExternalLink, MapPin, Package, Printer, RefreshCw, Search, Store, Truck, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Marketplace',
    href: marketplace.index().url,
  },
];

// --- 1. MOCK DATA (Simulasi Data API Shopee) ---
const MOCK_ORDERS = [
  {
    id: '240115ABC123',
    store: 'Store A',
    product: 'Sepatu Sneakers Aero v2',
    variant: 'Hitam, 42',
    price: 'Rp 250.000',
    status: 'READY_TO_SHIP',
    courier: 'J&T Express',
    resi: 'JP123456789',
    date: '15 Jan, 10:30',
    ship_by_date: '2024-01-17 10:30:00', // Contoh tanggal batas kirim
    customer: 'Budi Santoso',
    address: 'Jl. Melati No. 123, Jakarta Selatan, DKI Jakarta',
    phone: '081234567890',
    weight: '500 gr', // atau 0.5 kg
    deadline: '17 Jan 2026',
    paymentMethod: 'NONTUNAI', // atau 'NONTUNAI' / 'LUNAS'
  },
  {
    id: '240115XYZ456',
    store: 'Store B',
    product: 'Kaos Polos Cotton Combed',
    variant: 'Putih, L',
    price: 'Rp 75.000',
    status: 'SHIPPED',
    courier: 'SiCepat',
    resi: 'REG99887722',
    date: '15 Jan, 11:45',
    ship_by_date: '2024-01-17 11:45:00',
    customer: 'Siti Aminah',
    address: 'Komp. Permai Blok B5, Bandung, Jawa Barat',
    phone: '085566778899',
    weight: '200 gr',
    deadline: '17 Jan 2026',
    paymentMethod: 'LUNAS'
  },
  {
    id: '240115DEF789',
    store: 'Store C',
    product: 'Kemeja Polos Cotton Combed',
    variant: 'Biru, M',
    price: 'Rp 100.000',
    status: 'READY_TO_SHIP',
    courier: 'J&T Express',
    resi: 'JP987654321',
    date: '15 Jan, 12:15',
    ship_by_date: '2024-01-17 12:15:00',
    customer: 'Budi Santoso',
    address: 'Jl. Melati No. 123, Jakarta Selatan, DKI Jakarta',
    phone: '081234567890',
    weight: '500 gr',
    deadline: '17 Jan 2026',
    paymentMethod: 'LUNAS'
  },
  {
    id: '240115GHI012',
    store: 'Store D',
    product: 'Kaos Polos Cotton Combed',
    variant: 'Biru, M',
    price: 'Rp 100.000',
    status: 'SHIPPED',
    courier: 'J&T Express',
    resi: 'JP987654321',
    date: '15 Jan, 12:15',
    ship_by_date: '2024-01-17 12:15:00',
    customer: 'Budi Santoso',
    address: 'Jl. Melati No. 123, Jakarta Selatan, DKI Jakarta',
    phone: '081234567890',
    weight: '500 gr',
    deadline: '17 Jan 2026',
    paymentMethod: 'NONTUNAI'
  }
];

export default function Index() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // State untuk filter tab
  const [searchQuery, setSearchQuery] = useState(''); // State untuk pencarian
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'dropoff' | 'pickup' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<'100x150' | '78x100'>('100x150');
  // Fungsi untuk menghitung sisa waktu (Sederhana)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDeadlineStatus = (dateString: string) => {
    return {
      label: "Maks. Kirim: 17 Jan, 10:30",
      isUrgent: true
    };
  };

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((order) => {
      // Filter berdasarkan Tab
      const matchesTab =
        activeTab === 'ALL' ||
        (activeTab === 'READY' && order.status === 'READY_TO_SHIP') ||
        (activeTab === 'SHIPPED' && order.status === 'SHIPPED');

      // Filter berdasarkan Search (No. Pesanan atau Nama Produk)
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);
  const handleSync = () => {
    setIsSyncing(true);
    toast.loading('Memperbarui data...', { id: 'sync' });
    // Simulasi penarikan data API Shopee
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Data berhasil diperbarui!', { id: 'sync' });
    }, 2000);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const confirmShipment = () => {
    setIsSyncing(true); // Simulasi proses ke API Shopee
    toast.loading('Memproses pesanan...', { id: 'sync' });
    setTimeout(() => {
      setIsSyncing(false);
      setIsShipModalOpen(false);
      setIsModalOpen(false);
      toast.success(`Berhasil diproses (${shippingMethod})`, { id: 'sync' });
      // Di sini nantinya kamu akan panggil router.post atau router.put ke Laravel
    }, 1500);
  };

  const handlePrint = () => {
    const printContent = document.getElementById("thermal-label");
    const windowUrl = window.open('', '', 'left=0,top=0,width=400,height=600,toolbar=0,scrollbars=0,status=0');

    if (windowUrl) {
      windowUrl.document.write('<html><head><title>Cetak Label</title>');
      // Import Tailwind ke jendela print agar styling tidak hilang
      windowUrl.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      windowUrl.document.write('</head><body >');
      windowUrl.document.write(printContent?.innerHTML || '');
      windowUrl.document.write('</body></html>');
      windowUrl.document.close();
      windowUrl.focus();

      // Beri jeda sedikit agar Tailwind sempat render sebelum dialog print muncul
      setTimeout(() => {
        windowUrl.print();
        windowUrl.close();
      }, 500);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Marketplace Management" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* --- HEADER SECTION (FIXED FOR MOBILE) --- */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between px-1">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl flex items-center gap-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
              <ClipboardCheck className="text-indigo-500 w-6 h-6 md:w-7 md:h-7" />
              Marketplace <span className="text-indigo-600 dark:text-indigo-400">Management</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Kelola dan sinkronisasi pesanan Shopee secara real-time</p>
          </div>

          {/* Grouping Filter & Button for Mobile */}
          <div className="flex items-end gap-2 w-full lg:w-auto">
            {/* Filter Pilih Toko - Lebih fleksibel di HP */}
            <div className="flex flex-col gap-1.5 flex-1 lg:flex-none">
              <span className="text-[10px] font-black uppercase text-slate-400 ml-1">Pilih Toko</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-[200px] h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-indigo-500/20">
                  <div className="flex items-center gap-2 truncate">
                    <Store className="w-4 h-4 text-indigo-500 shrink-0" />
                    <SelectValue placeholder="Semua Toko" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="all">Semua Toko</SelectItem>
                  <SelectItem value="shopee-1">Shopee Store A</SelectItem>
                  <SelectItem value="shopee-2">Shopee Store B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tombol Sync - Ikon saja di HP, Teks+Ikon di Desktop */}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="h-11 px-4 lg:px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 border-none transition-all active:scale-95 shrink-0"
            >
              <RefreshCw className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline ml-2 uppercase tracking-wider text-xs">Sync Data</span>
            </Button>
          </div>
        </div>

        {/* --- STATS SUMMARY --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Perlu Diproses', count: 12, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
            { label: 'Dalam Pengiriman', count: 8, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
            { label: 'Selesai', count: 145, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Pembatalan', count: 2, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- FILTER & SEARCH --- */}
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500" />
            <Input
              placeholder="Cari No. Pesanan atau Produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 pl-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* TAB FILTER (Dinamis) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'READY', label: 'Siap Kirim' },
              { id: 'SHIPPED', label: 'Dikirim' },
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'secondary'}
                className={`h-11 rounded-xl px-6 font-bold text-xs uppercase shrink-0 transition-all ${activeTab === tab.id
                  ? 'bg-slate-900 dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'
                  }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* --- TABLE ORDERS --- */}
        <div className="relative">
          {isSyncing && <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] z-10 rounded-3xl" />}

          <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b dark:border-slate-800">
                    <TableHead className="py-4 px-6">Pesanan</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Batas Kirim</TableHead>
                    <TableHead>Pengiriman</TableHead>
                    <TableHead>Total & Status</TableHead>
                    <TableHead className="text-right px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b dark:border-slate-800/50">
                        <TableCell className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            <div
                              onClick={() => openDetail(order)}
                              className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-indigo-500 transition-colors cursor-pointer"
                            >
                              {order.id}
                              <ExternalLink className="w-3 h-3 text-slate-300" />
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none font-bold italic">{order.store}</Badge>
                              <span className="text-[10px] text-slate-400">{order.date}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[180px] truncate font-semibold text-slate-700 dark:text-slate-300 text-sm">{order.product}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 tracking-tight">{order.variant}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1.5 text-[11px] font-bold ${order.status === 'READY_TO_SHIP' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                            <CalendarClock className="w-3.5 h-3.5" />
                            {getDeadlineStatus(order.ship_by_date).label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{order.courier}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">{order.resi}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{order.price}</div>
                          <Badge className={`mt-1 border-none shadow-none font-black text-[9px] uppercase px-2 py-0.5 ${order.status === 'READY_TO_SHIP' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20' :
                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' :
                              'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20'
                            }`}>
                            {order.status === 'READY_TO_SHIP' ? 'Perlu Diproses' : order.status === 'SHIPPED' ? 'Dikirim' : 'Selesai'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {order.status === 'READY_TO_SHIP' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order); // TAMBAHKAN INI
                                setIsShipModalOpen(true);
                              }}
                              className='h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20'
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order); // TAMBAHKAN INI
                                setIsPreviewOpen(true);
                              }}
                              className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all border border-transparent hover:border-green-100 dark:hover:border-green-500/20"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-slate-400 font-medium italic">
                        Pesanan tidak ditemukan...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* --- MODAL DETAIL PESANAN --- */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent
              className="max-w-lg rounded-3xl p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* HEADER: Tetap di atas */}
              <DialogHeader className="p-6 bg-slate-900 dark:bg-indigo-950 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Detail Pesanan</DialogTitle>
                    <p className="text-indigo-200 text-xs font-mono">{selectedOrder?.id}</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md">{selectedOrder?.status}</Badge>
                </div>
              </DialogHeader>

              {/* CONTENT: Bisa di-scroll */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* WARNING BOX UNTUK BATAS KIRIM */}
                {selectedOrder?.status === 'READY_TO_SHIP' && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                      <Clock className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Perhatian: Batas Waktu Kirim</p>
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Pesanan harus dikirim sebelum {selectedOrder?.deadline}</p>
                    </div>
                  </div>
                )}

                {/* Info Pembeli */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                    <User className="w-3 h-3" /> Informasi Pembeli
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl space-y-2 border dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{selectedOrder?.customer}</div>
                    <div className="text-xs text-slate-500 flex items-start gap-2">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                      {selectedOrder?.address}
                    </div>
                    {/* <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">{selectedOrder?.phone}</div> */}
                  </div>
                </div>

                {/* Info Produk */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                    <Package className="w-3 h-3" /> Produk Dipesan
                  </div>
                  {/* Simulasi kalau produk banyak, ini akan memanjang ke bawah */}
                  <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">{selectedOrder?.product}</div>
                      <div className="text-xs text-slate-500">Variasi: {selectedOrder?.variant}</div>
                    </div>
                    <div className="text-right font-black text-sm text-indigo-600 dark:text-indigo-400">
                      {selectedOrder?.price}
                    </div>
                  </div>
                </div>

                {/* Ekspedisi */}
                <div className="grid grid-cols-2 gap-4 pt-2 pb-2">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Berat Paket</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">{selectedOrder?.weight || '1.0 kg'}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Batas Kirim</div>
                    <div className="font-bold text-rose-600 dark:text-rose-400">{selectedOrder?.deadline}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 pb-2">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kurir</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">{selectedOrder?.courier}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No. Resi</div>
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedOrder?.resi}</div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metode Pembayaran</div>
                    <div className={`font-bold inline-block px-2 py-0.5 rounded text-xs ${selectedOrder?.paymentMethod === 'NONTUNAI' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {selectedOrder?.paymentMethod === 'NONTUNAI' ? 'COD' : 'LUNAS'}
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER: Tetap di bawah */}
              <div className="p-6 pt-0 flex gap-2">
                <Button onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1 rounded-xl font-bold">
                  Tutup
                </Button>

                {selectedOrder?.status === 'READY_TO_SHIP' ? (
                  <Button
                    onClick={() => setIsShipModalOpen(true)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-lg shadow-orange-600/20 animate-bounce-subtle"
                  >
                    <Truck className="w-4 h-4 mr-2" /> Atur Pengiriman
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsPreviewOpen(true)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20"
                  >
                    <Printer className="w-4 h-4 mr-2" /> Cetak Label
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* --- MODAL ATUR PENGIRIMAN --- */}
          <Dialog open={isShipModalOpen} onOpenChange={setIsShipModalOpen}>
            <DialogContent className="max-w-md rounded-3xl p-6 border-none bg-white dark:bg-slate-950 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
                  <Truck className="w-5 h-5 text-indigo-500" /> Atur Pengiriman
                </DialogTitle>
                <p className="text-sm text-slate-500">Pilih metode pengiriman untuk pesanan ini.</p>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3 py-4">
                {/* Opsi Drop-off */}
                <button
                  onClick={() => setShippingMethod('dropoff')}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${shippingMethod === 'dropoff'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${shippingMethod === 'dropoff' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Drop-off</div>
                    <div className="text-xs text-slate-500">Anda antar paket ke cabang kurir terdekat.</div>
                  </div>
                </button>

                {/* Opsi Pickup */}
                <button
                  onClick={() => setShippingMethod('pickup')}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${shippingMethod === 'pickup'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${shippingMethod === 'pickup' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">Pickup</div>
                    <div className="text-xs text-slate-500">Kurir akan menjemput paket ke lokasi Anda.</div>
                  </div>
                </button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setIsShipModalOpen(false)} className="flex-1 rounded-xl font-bold">
                  Batal
                </Button>
                <Button
                  disabled={!shippingMethod || isSyncing}
                  onClick={confirmShipment}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20"
                >
                  Konfirmasi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* --- MODAL PREVIEW LABEL SHOPEE STYLE --- */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent
              className="max-w-2xl p-0 border-none bg-white dark:bg-slate-950 shadow-2xl overflow-hidden flex flex-col h-[90vh]"
            >
              {/* HEADER: Tetap di atas (Sama dengan Detail Modal) */}
              <DialogHeader className="p-6 bg-slate-900 dark:bg-indigo-950 text-white shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 mt-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Printer className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-black uppercase tracking-tight">Print Label</DialogTitle>
                      <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Shopee Official Layout</p>
                    </div>
                  </div>

                  {/* Ukuran Kertas */}
                  <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPaperSize('100x150')}
                      className={`text-[10px] font-bold h-7 rounded-lg ${paperSize === '100x150' ? 'bg-white text-slate-900' : 'text-white'}`}
                    >
                      A6 (100x150)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPaperSize('78x100')}
                      className={`text-[10px] font-bold h-7 rounded-lg ${paperSize === '78x100' ? 'bg-white text-slate-900' : 'text-white'}`}
                    >
                      78x100
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {/* CONTENT: Bisa di-scroll (Sama dengan Detail Modal) */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-900 flex justify-center no-scrollbar">
                {/* Container Kertas Thermal */}
                <div
                  className={`bg-white text-black shadow-xl transition-all duration-300 ease-in-out flex flex-col border border-black/10 shrink-0 ${paperSize === '100x150' ? 'w-[380px] min-h-[570px]' : 'w-[300px] min-h-[385px]'
                    }`}
                  id="thermal-label"
                >
                  {/* Row 1: Logo & Kurir */}
                  <div className="flex border-b-4 border-black shrink-0">
                    <div className="w-1/3 p-3 border-r-4 border-black flex items-center justify-center">
                      <h1 className="text-lg font-black italic tracking-tighter">Shopee</h1>
                    </div>
                    <div className="w-2/3 p-3 flex flex-col justify-center items-center bg-black text-white">
                      <span className="text-xs font-bold leading-none uppercase">Reguler</span>
                      <span className="text-lg font-black uppercase">{selectedOrder?.courier}</span>
                      {/* TAMPILAN BERAT */}
                      <span className="text-[11px] font-bold mt-1 border-t border-white/30 w-full text-center pt-0.5">
                        {selectedOrder?.weight || '1.0 kg'}
                      </span>
                    </div>
                    {/* AREA METODE PEMBAYARAN */}
                    {selectedOrder?.paymentMethod === 'NONTUNAI' ?
                      <div className='w-1/4 p-3 flex flex-col justify-center items-center border-l-4 border-black bg-white text-black'>
                        <span className="text-[10px] font-black leading-none uppercase">Bayar</span>
                        <span className="text-lg font-black uppercase">COD</span>
                      </div>
                      :
                      ''
                    }
                  </div>

                  {/* Row 2: Barcode No Pesanan */}
                  <div className="p-3 border-b-4 border-black flex flex-col items-center shrink-0">
                    <div className="w-full h-10 bg-slate-100 flex items-center justify-center mb-1">
                      <div className="flex gap-[1px] h-6 opacity-80">
                        {[...Array(40)].map((_, i) => <div key={i} className={`h-full ${i % 4 === 0 ? 'w-1' : 'w-[1px]'} bg-black`} />)}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold font-mono tracking-widest text-center">No. Pesanan: {selectedOrder?.id}</span>
                  </div>

                  {/* Row 3: Barcode Resi */}
                  <div className="p-4 border-b-4 border-black flex flex-col items-center justify-center bg-slate-50 shrink-0">
                    <div className="w-full h-16 flex items-center justify-center mb-1">
                      <div className="flex gap-[2px] h-12">
                        {[...Array(50)].map((_, i) => <div key={i} className={`h-full ${i % 5 === 0 ? 'w-1.5' : 'w-[1.5px]'} bg-black`} />)}
                      </div>
                    </div>
                    <span className="text-lg font-black font-mono tracking-[0.2em]">{selectedOrder?.resi}</span>
                  </div>

                  {/* Row 4: Area Alamat (Penerima & Pengirim) - Pakai flex-1 atau min-height agar tidak potong */}
                  <div className="flex border-b-4 border-black min-h-[160px] text-black">
                    {/* PENERIMA */}
                    <div className="w-[65%] p-3 border-r-2 border-black border-dashed flex flex-col bg-white">
                      {/* Badge COD Melayang jika metodenya COD */}
                      {selectedOrder?.paymentMethod === 'COD' && (
                        <div className="absolute top-3 right-3 border-4 border-black px-2 py-1 rotate-12">
                          <span className="text-2xl font-black">COD</span>
                        </div>
                      )}
                      <div className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase w-fit mb-1">Penerima:</div>
                      <div className="font-black text-[14px] leading-tight mb-2 uppercase">{selectedOrder?.customer}</div>
                      {/* <div className="text-[11px] font-black mb-1.5 underline">{selectedOrder?.phone}</div> */}
                      <div className="text-[10px] leading-tight font-bold uppercase break-words">
                        {selectedOrder?.address}
                      </div>
                    </div>
                    {/* PENGIRIM */}
                    <div className="w-[35%] p-3 flex flex-col bg-slate-50 justify-between">
                      <div>
                        <div className="text-[8px] font-black uppercase text-slate-500 italic">Pengirim:</div>
                        <div className="text-[10px] font-black uppercase leading-tight truncate">{selectedOrder?.store}</div>
                        <div className="text-[9px] font-bold">0812-XXXX-XXXX</div>
                      </div>
                      <div className="pt-2 border-t border-black/20 text-center">
                        <div className="text-[20px] font-black">JKT</div>
                        <div className="text-[8px] font-black uppercase">Internal</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Produk */}
                  <div className="p-3 bg-white flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[9px] font-black uppercase border-b border-black">Daftar Produk</span>
                      {/* INFO BATAS KIRIM DI SINI */}
                      <span className="text-[9px] font-bold text-white bg-black px-1">Kirim Sebelum: {selectedOrder?.deadline}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-[10px] leading-tight uppercase font-bold flex-1">
                        {selectedOrder?.product}
                        <div className="text-[8px] font-normal italic">Variasi: {selectedOrder?.variant}</div>
                      </div>
                      <div className="text-[10px] font-black">x1</div>
                    </div>
                  </div>

                  {/* Bottom */}
                  <div className="p-2 border-t-4 border-black flex justify-between items-center bg-black text-white shrink-0">
                    <span className="text-[9px] font-black italic">S-LOGISTICS</span>
                    <span className="text-[8px] font-bold">{new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER: Tetap di bawah (Sama dengan Detail Modal) */}
              <div className="p-6 bg-white dark:bg-slate-950 border-t flex gap-3 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Tutup
                </Button>
                <Button
                  onClick={handlePrint}
                  className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Printer className="w-5 h-5 mr-2" /> CETAK SEKARANG
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
}
