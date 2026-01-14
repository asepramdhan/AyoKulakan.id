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
    phone: '081234567890'
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
    phone: '085566778899'
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
    phone: '081234567890'
  },
  {
    id: '240115GHI012',
    store: 'Store D',
    product: 'Kaos Polos Cotton Combed',
    variant: 'Biru, M',
    price: 'Rp 100.000',
    status: 'READY_TO_SHIP',
    courier: 'J&T Express',
    resi: 'JP987654321',
    date: '15 Jan, 12:15',
    ship_by_date: '2024-01-17 12:15:00',
    customer: 'Budi Santoso',
    address: 'Jl. Melati No. 123, Jakarta Selatan, DKI Jakarta',
    phone: '081234567890'
  }
];

export default function Index() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // State untuk filter tab
  const [searchQuery, setSearchQuery] = useState(''); // State untuk pencarian
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                          <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20">
                            <Printer className="h-4 w-4" />
                          </Button>
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
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Pesanan harus dikirim sebelum 17 Januari, 10:30</p>
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
                    <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">{selectedOrder?.phone}</div>
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
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kurir</div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">{selectedOrder?.courier}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">No. Resi</div>
                    <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedOrder?.resi}</div>
                  </div>
                </div>
              </div>

              {/* FOOTER: Tetap di bawah */}
              <div className="p-6 pt-4 flex gap-2 bg-white dark:bg-slate-950 border-t dark:border-slate-900 shrink-0">
                <Button onClick={() => setIsModalOpen(false)} variant="outline" className="flex-1 rounded-xl font-bold border-slate-200 dark:border-slate-800">
                  Tutup
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20">
                  <Printer className="w-4 h-4 mr-2" /> Cetak Resi
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
}
