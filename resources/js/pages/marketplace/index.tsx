/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import marketplace from '@/routes/marketplace';
import shopee from '@/routes/shopee';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, CalendarClock, CheckCircle2, ClipboardCheck, Clock, ExternalLink, MapPin, Package, Printer, RefreshCw, Search, Store, StoreIcon, Truck, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Marketplace',
    href: marketplace.index().url,
  },
];

export default function Index({ orders = [], stats, shops = [], currentShopId }: { orders: any[], stats: any, shops: any[], currentShopId: any }) {
  const [isSyncing, setIsSyncing] = useState(false);
  // Membaca dari localStorage saat pertama kali load, default ke 'ALL' jika kosong
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('marketplace_active_tab') || 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState(''); // State untuk pencarian
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'dropoff' | 'pickup' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [paperSize, setPaperSize] = useState<'100x150' | '78x100'>('100x150');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const getCityCode = (address: string) => {
    if (!address) return 'JKT';
    // Mencoba mengambil kata yang terlihat seperti Kota (Sederhana)
    const parts = address.split(',');
    const city = parts[parts.length - 2]?.trim() || 'JKT';
    return city.substring(0, 3).toUpperCase();
  };
  const handleShopChange = (value: string) => {
    // Pindah halaman dengan query string baru
    // Ini akan memicu fungsi index() di Laravel berjalan lagi dengan shop_id tersebut
    router.get(marketplace.index().url, { shop_id: value }, {
      preserveState: true,
      replace: true
    });
  };
  // Sinkronisasi data
  const handleSync = () => {
    setIsSyncing(true);

    // Jika tidak ada toko yang terhubung
    if (shops.length === 0) {
      toast.loading('Mengarahkan ke Shopee...', { id: 'auth' });

      // LANGSUNG arahkan ke route Laravel yang menghandle redirect
      // Jangan pakai router.get karena ini URL eksternal
      window.location.href = '/shopee/auth';
      return;
    }

    toast.loading('Sinkronisasi data...', { id: 'sync' });
    // Gunakan router.reload untuk menarik data terbaru dari Laravel
    router.reload({
      only: ['orders', 'stats'],
      onSuccess: () => {
        setIsSyncing(false);
        toast.success('Data berhasil diperbarui!', { id: 'sync' });
      },
      onError: () => {
        setIsSyncing(false);
        toast.error('Gagal sinkronisasi data.', { id: 'sync' });
      },
      onFinish: () => {
        setIsSyncing(false);
      }
    });
  };
  // Summary statistik
  const statsSummary = [
    {
      label: 'Perlu Diproses',
      count: stats?.perlu_diproses ?? 0,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-500/10'
    },
    {
      label: 'Dalam Pengiriman',
      count: stats?.dalam_pengiriman ?? 0,
      icon: Truck,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      label: 'Selesai',
      count: stats?.selesai ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      label: 'Pembatalan',
      count: stats?.pembatalan ?? 0,
      icon: AlertCircle,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-500/10'
    },
  ];
  //  Fungsi pembayaran
  const getPaymentBadge = (method: string) => {
    const normalizedMethod = method?.toUpperCase() || '';

    // Jika mengandung kata COD
    if (normalizedMethod.includes('COD')) {
      return {
        label: 'COD (BAYAR DI TEMPAT)',
        classes: 'bg-amber-100 text-amber-700 border border-amber-200',
      };
    }

    // Jika pembayaran online (ShopeePay, Transfer, CC)
    return {
      label: method || 'SUDAH DIBAYAR',
      classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    };
  };
  // Fungsi untuk menghitung sisa waktu
  const getDeadlineStatus = (timestamp: number | null) => {
    if (!timestamp) return { label: "N/A", color: "text-slate-400" };

    const deadline = new Date(timestamp * 1000); // Shopee (detik) -> JS (milidetik)
    const now = new Date();

    // Selisih dalam jam
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Format jam:menit untuk label
    const timeStr = deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    // 1. Jika sudah lewat (Expired)
    if (diffInHours <= 0) {
      return {
        label: `Lewat Batas: ${dateStr}, ${timeStr}`,
        color: "text-red-600 font-black",
        isUrgent: false
      };
    }

    // 2. Jika sisa kurang dari 12 jam (Sangat Mendesak)
    if (diffInHours <= 12) {
      return {
        label: `Segera Kirim: ${timeStr} (Hari Ini)`,
        color: "text-rose-500 animate-pulse font-black",
        isUrgent: true
      };
    }

    // 3. Jika sisa kurang dari 24 jam (Urgent)
    if (diffInHours <= 24) {
      return {
        label: `Maks: Besok, ${timeStr}`,
        color: "text-orange-500 font-bold",
        isUrgent: true
      };
    }

    // 4. Masih aman
    return {
      label: `Maks: ${dateStr}, ${timeStr}`,
      color: "text-slate-500",
      isUrgent: false
    };
  };
  // Membaca dari localStorage saat pertama kali load, default ke 'ALL' jika kosong
  useEffect(() => {
    localStorage.setItem('marketplace_active_tab', activeTab);
  }, [activeTab]);
  // Filter dan pencarian
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter berdasarkan Tab
      const matchesTab =
        activeTab === 'ALL' ||
        // Siap Kirim mencakup yang baru masuk dan yang sudah diatur pengirimannya (resi keluar)
        (activeTab === 'READY' && (order.status === 'READY_TO_SHIP' || order.status === 'PROCESSED')) ||
        // Dikirim mencakup yang sedang dijalan dan yang sudah sampai tapi belum diklik selesai
        (activeTab === 'SHIPPED' && (order.status === 'SHIPPED' || order.status === 'TO_CONFIRM_RECEIVE')) ||
        // Tab tambahan jika ingin memisahkan yang sudah beres
        (activeTab === 'COMPLETED' && order.status === 'COMPLETED');

      // Filter berdasarkan Search
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query) ||
        order.resi.toLowerCase().includes(query) || // Tambahkan pencarian berdasarkan Resi
        order.customer.toLowerCase().includes(query); // Tambahkan pencarian berdasarkan Nama Customer

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, orders]);

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // --- PERBAIKAN LOGIKA CONFIRM SHIPMENT ---
  const confirmShipment = () => {
    if (!selectedOrder) return;
    setIsSyncing(true); // Mulai loading
    toast.loading('Memproses ke Shopee...', { id: 'ship-process' });

    router.post(marketplace.ship().url, {
      order_sn: selectedOrder.id,
      method: shippingMethod,
    }, {
      onSuccess: () => {
        setIsShipModalOpen(false);
        setIsModalOpen(false);
        toast.loading('Menunggu Resi Shopee (10 detik)...', { id: 'ship-process' });

        // TUNGGU 10 DETIK, BARU RELOAD DATA
        setTimeout(() => {
          router.reload({
            only: ['orders', 'stats'],
            onSuccess: () => toast.success('Berhasil! Resi muncul.', { id: 'ship-process' }),
            onFinish: () => setIsSyncing(false) // Baru matikan loading di sini
          });
        }, 10000);
      },
      onError: (errors: any) => {
        setIsSyncing(false); // Matikan loading jika error
        toast.error(errors.message || 'Gagal memproses.', { id: 'ship-process' });
      }
    });
  };
  // Fungsi toggle pilih semua atau satu per satu
  const toggleSelectOrder = (id: string, checked: boolean) => {
    setSelectedOrderIds((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };
  const getShippingType = (courierName: string) => {
    const name = courierName?.toLowerCase() || '';
    if (name.includes('hemat')) return 'ECO'; // Economy
    if (name.includes('reguler')) return 'STD'; // Standard
    if (name.includes('kargo') || name.includes('cargo')) return 'KRG'; // Kargo
    if (name.includes('instant')) return 'INS'; // Instant
    return 'STD'; // Default ke Standard
  };
  const handlePrint = () => {
    const printContent = document.getElementById("thermal-label");
    if (!printContent) return;

    // 1. Buat iframe tersembunyi agar tidak buka window baru
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // 2. Tulis konten ke iframe dengan CSS Khusus Print
    doc.write(`
    <html>
      <head>
        <title>Cetak Label</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* CSS KRUSIAL: Memaksa warna latar belakang muncul saat di-print */
          @media print {
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            @page { 
              margin: 0; 
              size: auto;
            }
          }
          /* Memastikan barcode dan background hitam benar-benar hitam */
          .bg-black { background-color: black !important; color: white !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .border-black { border-color: black !important; }
        </style>
      </head>
      <body>
        <div class="p-4">
          ${printContent.innerHTML}
        </div>
        <script>
          // Tunggu library Tailwind selesai memproses class sebelum print
          setTimeout(() => {
            window.print();
            window.frameElement.remove(); // Hapus iframe setelah print selesai
          }, 800);
        </script>
      </body>
    </html>
  `);
    doc.close();
  };

  const renderLabelHTML = (order: any) => {
    // Samakan logika pembayaran dengan kode kamu
    const isCOD = order.paymentMethod === 'COD' || order.paymentMethod === 'NONTUNAI';

    return `
    <div class="page-break flex justify-center bg-white p-4">
      <div class="bg-white text-black flex flex-col border border-black shrink-0 shadow-none" 
           style="width: ${paperSize === '100x150' ? '380px' : '300px'}; min-height: ${paperSize === '100x150' ? '570px' : '385px'};">
        
        <div class="flex border-b border-black shrink-0">
          <div class="w-1/4 p-3 border-r border-black flex items-center justify-center">
            <h1 class="text-xl font-black italic tracking-tighter">Shopee</h1>
          </div>
          <div class="w-2/4 p-2 flex flex-col justify-center items-center bg-black text-white" style="background-color: black !important; color: white !important;">
            <span class="text-[10px] font-bold leading-none uppercase opacity-70 italic">Reguler</span>
            <span class="text-xl font-black uppercase tracking-tight leading-none mb-1">${order.courier}</span>
            <span class="text-[11px] font-bold border-t border-white/40 w-full text-center pt-0.5">${order.weight || '0.5 kg'}</span>
          </div>
          <div class="w-1/4 p-2 flex flex-col justify-center items-center border-l border-black">
            <span class="text-[9px] font-black uppercase">Bayar</span>
            <span class="text-lg font-black">${isCOD ? 'COD' : 'CASH'}</span>
          </div>
        </div>

        <div class="p-2 border-b border-black flex flex-col items-center">
          <div class="flex h-8 items-end mb-1">
            ${Array(40).fill(0).map((_, i) => `<div style="border-left: 1.5px solid black; height: 100%; margin-right: ${i % 5 === 0 ? '4px' : '2px'};"></div>`).join('')}
          </div>
          <span class="text-[8px] font-mono font-bold uppercase">No. Pesanan: ${order.id}</span>
        </div>

        <div class="p-4 border-b border-black flex flex-col items-center justify-center bg-slate-50" style="background-color: #f8fafc !important;">
          <div class="flex h-14 items-end mb-2">
            ${Array(65).fill(0).map((_, i) => `<div style="border-left: 2px solid black; height: 100%; margin-right: ${i % 4 === 0 ? '3px' : '1px'};"></div>`).join('')}
          </div>
          <span class="text-lg font-black font-mono tracking-[0.2em]">${order.resi}</span>
        </div>

        <div class="flex border-b border-black min-h-[160px] relative text-black">
          ${isCOD ? `<div style="position: absolute; top: 12px; right: 12px; border: 2px solid black; padding: 2px 8px; transform: rotate(12deg); z-index: 10; background: white; font-weight: 900; font-size: 20px;">COD</div>` : ''}
          
          <div class="w-[65%] p-3 border-r border-black border-dashed flex flex-col">
            <div style="background-color: black !important; color: white !important;" class="text-[9px] font-black px-1.5 py-0.5 uppercase w-fit mb-1">Penerima:</div>
            <div class="font-black text-[15px] leading-tight uppercase mb-2">${order.customer}</div>
            <div class="text-[11px] leading-[1.3] font-bold uppercase">${order.address}</div>
          </div>

          <div class="w-[35%] p-3 flex flex-col justify-between bg-slate-50" style="background-color: #f8fafc !important;">
            <div>
              <div class="text-[8px] font-black uppercase text-slate-500 mb-1 italic">Pengirim:</div>
              <div class="text-[11px] font-black uppercase leading-tight">${order.store}</div>
            </div>
            <div class="pt-2 border-t border-black/20 text-center">
              <div class="text-[24px] font-black uppercase leading-none">JKT</div>
              <div class="text-[9px] font-black uppercase leading-none mt-1">INTERNAL</div>
            </div>
          </div>
        </div>

        <div class="p-3 bg-white flex-1">
          <div class="flex justify-between items-end mb-1 border-b border-black pb-1">
             <span class="text-[9px] font-black uppercase">Daftar Produk</span>
             <span style="background-color: black !important; color: white !important;" class="text-[9px] font-bold px-1 uppercase">Kirim Sebelum: ${order.deadline || '17 Jan'}</span>
          </div>
          <div class="flex justify-between items-start text-[11px] mt-2">
            <div class="flex-1 pr-2">
              <div class="font-bold uppercase">${order.product}</div>
              <div class="text-[9px] font-normal italic mt-0.5">Variasi: ${order.variant || '-'}</div>
            </div>
            <div class="font-black text-sm">(1)</div>
          </div>
        </div>

        <div style="background-color: black !important; color: white !important;" class="p-2 border-t border-black flex justify-between items-center shrink-0">
          <span class="text-[9px] font-black italic">S-LOGISTICS</span>
          <span class="text-[8px] font-bold">${new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>
    </div>
  `;
  };

  const handleBulkPrint = () => {
    const ordersToPrint = filteredOrders.filter(o => selectedOrderIds.includes(o.id));
    if (ordersToPrint.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
    <html>
      <head>
        <title>Cetak Massal</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            body { 
              margin: 0; 
              background: white !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .page-break { page-break-after: always; }
            @page { margin: 0; size: auto; }
          }
          /* Memastikan semua border tipis sesuai desain kamu */
          .border { border-width: 1px !important; }
          .border-b { border-bottom-width: 1px !important; }
          .border-r { border-right-width: 1px !important; }
        </style>
      </head>
      <body>
        ${ordersToPrint.map(order => renderLabelHTML(order)).join('')}
        <script>
          // Delay sedikit agar Tailwind memproses class sebelum dialog print muncul
          setTimeout(() => {
            window.print();
            window.frameElement.remove();
          }, 1000);
        </script>
      </body>
    </html>
  `);
    doc.close();
    setSelectedOrderIds([]); // Kosongkan seleksi setelah print
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Marketplace Management" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

        {/* --- HEADER SECTION (FIXED FOR MOBILE) --- */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between px-1">
          <div className="space-y-1">
            <h1 className="text-lg md:text-2xl flex items-center gap-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">
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
              <Select value={currentShopId} onValueChange={handleShopChange}>
                <SelectTrigger className="w-full lg:w-[200px] h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 shadow-sm focus:ring-indigo-500/20">
                  <div className="flex items-center gap-2 truncate">
                    <Store className="w-4 h-4 text-indigo-500 shrink-0" />
                    <SelectValue placeholder="Pilih Toko" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  {shops.map((shop: any) => (
                    <SelectItem key={shop.shop_id} value={shop.shop_id.toString()}>
                      {shop.shop_name || `Toko ${shop.shop_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tombol Sync - Ikon saja di HP, Teks+Ikon di Desktop */}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="h-11 px-4 lg:px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 border-none transition-all active:scale-95 shrink-0"
            >
              {shops.length === 0 ?
                <StoreIcon className="w-5 h-5 lg:w-4 lg:h-4" />
                :
                <RefreshCw className="w-5 h-5 lg:w-4 lg:h-4" />
              }
              <span className="hidden lg:inline uppercase tracking-wider text-xs">
                {shops.length === 0 ? 'Hubungkan Toko' : 'Sync Data'}
              </span>
            </Button>
          </div>
        </div>

        {/* --- STATS SUMMARY --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsSummary.map((stat, i) => (
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
        <div className="sticky top-15 z-30 -mx-4 px-4 pt-4 backdrop-blur-md border-b border-transparent transition-all">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500" />
              <Input
                placeholder="Cari No. Pesanan, Resi atau Produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* TAB FILTER (Dinamis) */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {[
                { id: 'ALL', label: 'Semua', count: orders.length },
                { id: 'READY', label: 'Siap Kirim', count: orders.filter(o => ['READY_TO_SHIP', 'PROCESSED'].includes(o.status)).length },
                { id: 'SHIPPED', label: 'Dikirim', count: orders.filter(o => ['SHIPPED', 'TO_CONFIRM_RECEIVE'].includes(o.status)).length },
                { id: 'COMPLETED', label: 'Selesai', count: orders.filter(o => o.status === 'COMPLETED').length },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'default' : 'secondary'}
                  className={`h-11 rounded-xl px-5 font-bold text-xs uppercase shrink-0 transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? 'bg-slate-900 dark:bg-white dark:text-slate-900 shadow-lg'
                    : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-500'
                    }`}
                >
                  <span>{tab.label}</span>
                  {/* Badge Angka Kecil */}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {tab.count}
                  </span>
                </Button>
              ))}
            </div>
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
                    <TableHead className="py-4 px-6">
                      <Checkbox
                        checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead>Pesanan</TableHead>
                    <TableHead>Produk</TableHead>
                    <TableHead>Batas Kirim</TableHead>
                    <TableHead>Pengiriman</TableHead>
                    <TableHead className="text-center">QTY</TableHead>
                    <TableHead>Total & Status</TableHead>
                    <TableHead className="text-right px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all border-b dark:border-slate-800/50">
                        <TableCell className="py-4 px-6">
                          <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={(checked) => toggleSelectOrder(order.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
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
                          {(() => {
                            const status = getDeadlineStatus(order.deadline_raw);
                            return (
                              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${status.color}`}>
                                <CalendarClock className={`w-3.5 h-3.5 ${status.isUrgent ? 'animate-bounce' : ''}`} />
                                {status.label}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{order.courier}</div>
                          {order.resi !== 'BELUM ADA RESI' ? (
                            <div className="text-[10px] font-mono text-slate-400 mt-1">{order.resi}</div>
                          ) : (
                            <div className="text-[10px] font-mono text-slate-400 mt-1">Menunggu Resi...</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-lg px-3 py-1 min-w-[32px]">
                            {/* Gunakan data quantity yang sudah kita hitung di controller */}
                            {order.quantity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{order.price}</div>
                          <Badge className={`mt-1 border-none shadow-none font-black text-[9px] uppercase px-2 py-0.5 ${order.status === 'READY_TO_SHIP' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20' :
                            order.status === 'PROCESSED' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                order.status === 'TO_CONFIRM_RECEIVE' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                                  order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' // Untuk status lain seperti CANCELLED atau UNPAID
                            }`}>
                            {
                              order.status === 'READY_TO_SHIP' ? 'Perlu Diproses' :
                                order.status === 'PROCESSED' ? 'Menunggu Pickup/Dropoff' :
                                  order.status === 'SHIPPED' ? 'Dalam Pengiriman' :
                                    order.status === 'TO_CONFIRM_RECEIVE' ? 'Sampai Tujuan' :
                                      order.status === 'COMPLETED' ? 'Selesai' :
                                        order.status
                            }
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
                      <TableCell colSpan={8} className="py-10 text-center text-slate-400 font-medium italic">
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
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Metode Pembayaran
                      </div>

                      {(() => {
                        const badge = getPaymentBadge(selectedOrder?.paymentMethod);
                        return (
                          <div className={`font-black inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] shadow-sm ${badge.classes}`}>
                            {/* Tambahkan dot indicator agar lebih modern */}
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
                            {badge.label}
                          </div>
                        );
                      })()}
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

          {/* Floating Bar untuk Cetak Massal */}
          {selectedOrderIds.length > 0 && (
            <div className="fixed bottom-6 right-6 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center gap-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Terpilih</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedOrderIds.length} Pesanan
                </span>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkPrint}
                  className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold px-6 shadow-lg shadow-indigo-500/20"
                >
                  <Printer className="w-4 h-4 mr-2" /> CETAK MASAL
                </Button>
              </div>
            </div>
          )}

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
                  {/* Row 1: Logo & Kurir & Pembayaran */}
                  <div className="flex border-b-2 border-black shrink-0 h-20">
                    <div className="w-1/3 p-2 border-r-2 border-black flex items-center justify-center">
                      <h1 className="text-3xl font-black italic tracking-tighter">Shopee</h1>
                    </div>
                    <div className="w-1/3 p-2 flex flex-col justify-center items-center bg-black text-white" style={{ WebkitPrintColorAdjust: 'exact' }}>
                      <span className="text-3xl font-bold uppercase opacity-80 italic">
                        {getShippingType(selectedOrder?.courier)}
                      </span>
                      <span className="text-sm font-black uppercase text-center leading-tight">
                        {selectedOrder?.courier}
                      </span>
                    </div>
                    <div className="w-1/3 p-2 flex flex-col justify-center items-center border-l-2 border-black">
                      <span className="text-[10px] font-black uppercase tracking-tighter">Metode:</span>
                      {/* Gunakan text-black pekat karena thermal tidak kenal abu-abu */}
                      <span className="text-xl font-black uppercase">
                        {selectedOrder?.paymentMethod?.toUpperCase().includes('COD') ? 'COD' : 'NON-COD'}
                      </span>
                      {/* Tambahkan info tambahan jika COD agar kurir lebih waspada */}
                      {selectedOrder?.paymentMethod?.toUpperCase().includes('COD') && (
                        <span className="text-[9px] font-black bg-black text-white px-1 leading-none">Tagih Tunai</span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Barcode No Pesanan - Dibuat lebih rapat & akurat */}
                  <div className="p-2 border-b-2 border-black flex flex-col items-center shrink-0">
                    <div className="flex h-8 items-end mb-1">
                      {[...Array(50)].map((_, i) => (
                        <div key={i} className={`h-full border-l-[1.5px] border-black ${i % 6 === 0 ? 'mr-1' : 'mr-[1px]'}`} />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold font-mono tracking-widest text-center uppercase">No. Pesanan: {selectedOrder?.id}</span>
                  </div>

                  {/* Row 3: Barcode Resi - Jauh lebih besar untuk memudahkan Kurir Scan */}
                  <div className="py-6 border-b-2 border-black flex flex-col items-center justify-center bg-white shrink-0">
                    <div className="flex h-16 items-end mb-3">
                      {[...Array(65)].map((_, i) => (
                        <div key={i} className={`h-full border-l-2 border-black ${i % 4 === 0 ? 'mr-[3px]' : 'mr-[1px]'}`} />
                      ))}
                    </div>
                    <span className="text-3xl font-black font-mono tracking-[0.2em]">{selectedOrder?.resi}</span>
                  </div>

                  {/* Row 4: Area Alamat (Penerima & Pengirim) - Pakai flex-1 atau min-height agar tidak potong */}
                  <div className="flex border-b-2 border-black min-h-[160px] text-black">
                    {/* PENERIMA */}
                    <div className="w-[65%] p-3 border-r-2 border-black border-dashed flex flex-col bg-white">
                      {/* Watermark COD Melayang */}
                      {selectedOrder?.paymentMethod?.toUpperCase().includes('COD') && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
                          <span className="text-[120px] font-black border-[12px] border-black p-4 rotate-12 uppercase">
                            COD
                          </span>
                        </div>
                      )}
                      <div className="bg-black text-white text-[14px] font-black px-1.5 py-0.5 uppercase w-fit mb-1">Penerima:</div>
                      <div className="font-black text-[14px] leading-tight mb-2 uppercase">{selectedOrder?.customer}</div>
                      <div className="text-[13px] leading-tight font-bold uppercase break-words">
                        {selectedOrder?.address}
                      </div>
                    </div>
                    {/* PENGIRIM */}
                    <div className="w-[35%] p-3 flex flex-col bg-slate-50 justify-between items-center text-center">
                      <div className="w-full">
                        <div className="text-[12px] font-black uppercase text-slate-500 italic">Pengirim:</div>
                        <div className="text-[13px] font-black uppercase leading-tight truncate w-full">
                          {selectedOrder?.store}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/20 w-full">
                        <div className="text-[34px] font-black leading-none py-1 uppercase">
                          {getCityCode(selectedOrder?.address)}
                        </div>
                        <div className="text-[11px] font-black uppercase border-t-2 border-black mt-1">
                          {/* Dinamis berdasarkan apakah alamat di luar provinsi atau dalam kota */}
                          {selectedOrder?.address?.toLowerCase().includes('jakarta') ? 'DOMESTIK' : 'INTERCITY'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Produk */}
                  <div className="p-3 bg-white flex-1">
                    <div className="flex justify-between items-end mb-1">
                      {/* TAMPILAN BERAT */}
                      <span className="text-end text-[14px] font-bold border-t border-white/30 w-full">
                        Berat: {selectedOrder?.weight || '1.0 kg'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[14px] font-black uppercase border-b border-black">Daftar Produk</span>
                      {/* INFO BATAS KIRIM DI SINI */}
                      <span className="text-[14px] font-bold text-white bg-black px-1">Batas Kirim: {selectedOrder?.deadline}</span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-[14px] leading-tight uppercase font-bold flex-1">
                        {selectedOrder?.product}
                        <div className="text-[10] font-normal italic">Variasi: {selectedOrder?.variant}</div>
                      </div>
                      <div className="text-[14px] me-2">(<span className="font-bold">{selectedOrder?.quantity}</span>)</div>
                    </div>
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
