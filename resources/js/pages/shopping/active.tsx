/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Clock, ChevronRight, ShoppingCart, Pencil, Wallet, Share2, Printer, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Daftar Belanja Aktif', href: shopping.active().url }];
const today = new Date().toISOString().split('T')[0];

const formatSingkat = (dateString: string) => {
  const d = new Date(dateString);
  const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  return `${hari}, ${tgl} ${jam}`;
};

// --- FUNGSI EXPORT ---
const shareToWhatsApp = (list: any) => {
  const line = "----------------------------------";
  const title = `*🛒 DAFTAR BELANJA: ${list.title.toUpperCase()}*`;
  const store = `📍 *Toko:* ${list.store?.name || 'Bebas'}`;
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Perbaikan: Cek berbagai kemungkinan nama field (product_name atau name)
  const itemsText = list.items?.length > 0
    ? list.items.map((item: any, i: number) => {
      const status = item.is_bought ? '✅' : '';
      const rawName = item.product_name || item.name || item.product_name_snapshot || 'Produk Tanpa Nama';
      const itemName = toTitleCase(rawName);
      const qty = item.quantity || 0;
      const unit = item.unit || 'pcs';

      return `${i + 1}. *${itemName}* (${qty} ${unit}) ${status}`;
    }).join('\n')
    : "_Daftar item kosong_";

  const total = `*TOTAL ESTIMASI: Rp ${Number(list.total_estimated_price).toLocaleString('id-ID')}*`;
  const footer = "Dikirim via *AyoKulakan.PortoKu.id*";

  const fullMessage = `${title}\n${line}\n${store}\n\n${itemsText}\n\n${line}\n${total}\n\n${footer}`;

  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(fullMessage), "_blank");
};

export default function ActiveLists({ lists }: { lists: any[] }) {
  const grandTotal = lists.reduce((acc, curr) => acc + Number(curr.total_estimated_price || 0), 0);

  return (
    <>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title='Daftar Belanja Aktif' />
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

          {/* Header & Grand Total */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold dark:text-slate-100">Daftar Belanja Aktif</h2>
                <p className="text-sm text-muted-foreground">{lists.length} Daftar belanja yang sedang berjalan</p>
              </div>
            </div>

            {lists.length > 0 && (
              <Card className="bg-orange-600 text-white border-none shadow-lg md:min-w-[250px]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-orange-100">Total Anggaran</p>
                    <div className="text-xl font-black text-white">Rp {grandTotal.toLocaleString('id-ID')}</div>
                  </div>
                  <Wallet className="w-8 h-8 opacity-40" />
                </CardContent>
              </Card>
            )}
          </div>

          {lists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer"
                onClick={() => {
                  // Memastikan UI selesai render sebelum print
                  setTimeout(() => {
                    window.print();
                  }, 100);
                }}
              >
                <Printer className="w-5 h-5" />
                Print Semua Daftar Belanja
              </div>
            </div>
          )}

          {lists.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
              <p className="text-slate-400">Belum ada daftar belanja aktif.</p>
              <Link
                href={shopping.index().url}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500 mt-2"
              >
                Buat Daftar Belanja
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.map((list) => {
                const progress = (list.completed_items_count / list.items_count) * 100;
                const isToday = list.shopping_date.startsWith(today);

                return (
                  <div key={list.id} className="relative group bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">

                    {/* Bagian Atas: Bisa diklik untuk ke halaman Cek List */}
                    <Link href={shopping.check(list.id).url} className="block p-5 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <span className="text-[9px] font-bold uppercase text-orange-700 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400 px-2 py-0.5 rounded">{list.store?.name}</span>
                            {isToday && <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded">Hari Ini</span>}
                          </div>
                          <h3 className="font-bold text-lg dark:text-slate-100 capitalize">{list.title}</h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]"><Clock className="w-3 h-3" /> {formatSingkat(list.shopping_date)}</div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </div>

                      <div className="w-full space-y-2 mt-4">
                        {/* Header: Label & Persentase */}
                        <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                              {list.completed_items_count} <span className="text-slate-400 font-normal">dari</span> {list.items_count} Item
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-black ${Math.round(progress) === 100 ? 'text-green-500' : 'text-orange-500'}`}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                          {/* Progress Fill */}
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(234,88,12,0.3)] ${Math.round(progress) === 100
                              ? 'bg-green-500 shadow-green-200'
                              : 'bg-orange-500'
                              }`}
                            style={{ width: `${progress}%` }}
                          />

                          {/* Efek kilau (Glow effect) agar lebih mewah */}
                          <div
                            className="absolute top-0 left-0 h-full w-full opacity-20 pointer-events-none"
                            style={{
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                              transform: `translateX(${progress - 100}%)`,
                              transition: 'transform 0.7s ease-in-out'
                            }}
                          />
                        </div>
                      </div>
                    </Link>

                    {/* Bagian Bawah: Tombol Aksi (Diletakkan di luar Link agar tidak bentrok) */}
                    <div className="px-5 py-4 flex items-center justify-between border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {/* Label Estimasi dengan gaya yang lebih subtle */}
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            Estimasi
                          </span>

                          {/* Badge Jumlah Item yang lebih estetik */}
                          {/* <span className="flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                            {list.items_count} Item
                          </span> */}
                        </div>

                        {/* Nilai Harga dengan font yang lebih tegas dan rapi */}
                        <div className="text-sm font-black text-slate-900 dark:text-white flex items-baseline gap-0.5">
                          <span className="text-[11px] font-bold text-slate-500">Rp</span>
                          <span className="tracking-tight">
                            {Number(list.total_estimated_price || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8 hover:bg-orange-100 hover:text-orange-600 dark:border-slate-700 cursor-pointer"
                          onClick={(e) => { e.preventDefault(); shareToWhatsApp(list); }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        <Link href={shopping.edit(list.id)}>
                          <Button variant="outline" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>

                        {/* Tombol hapus */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full h-8 w-8 hover:text-rose-600 hover:bg-rose-50 dark:border-slate-700 cursor-pointer"
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
                                    Hapus Daftar Belanja Aktif
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                                    Apakah kamu yakin ingin menghapus daftar belanja <span className="font-bold text-slate-900 dark:text-slate-200">"{list.title}"</span>?
                                    <p>
                                      Cek list ini terlebih dahulu sebelum menghapus
                                      <Link href={shopping.check(list.id)} className="ms-1 underline font-bold text-slate-900 dark:text-slate-200">disini</Link>
                                    </p>
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
                                  href={shopping.destroy(list.id)}
                                  method="delete"
                                  as="button"
                                  preserveScroll={true}
                                  onClick={() => {
                                    toast.promise<{ name: string }>(
                                      () =>
                                        new Promise((resolve) =>
                                          setTimeout(() => resolve({ name: list.title }), 1000)
                                        ),
                                      {
                                        loading: "Menghapus...",
                                        success: (data) => `Daftar Belanja ${data.name} Berhasil Dihapus`,
                                        error: "Terjadi Kesalahan",
                                      }
                                    )
                                  }}
                                >
                                  Ya, Hapus
                                </Link>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>

      {/* TEMPLATE KHUSUS PRINT (PDF) */}
      <div id="print-area" className="hidden print:block bg-white text-black p-4">
        {/* Header Laporan */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase text-black">Daftar Belanja AyoKulakan</h1>
          <p className="text-sm text-black">URL: ayokulakan.id</p>
          <p className="text-xs text-slate-500 mt-1 italic">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        </div>

        {/* Looping setiap list belanja aktif */}
        {lists.map((list: any) => (
          <div key={list.id} className="mb-10 break-inside-avoid">
            <div className="flex justify-between items-end mb-2 border-b border-slate-300 pb-1">
              <div>
                <h2 className="text-lg font-bold uppercase">{list.title}</h2>
                <p className="text-sm">Toko: <strong>{list.store?.name || 'Bebas'}</strong></p>
              </div>
              <p className="text-sm text-right">{new Date(list.shopping_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Tabel Barang */}
            <table className="w-full border-collapse mt-4">
              <thead>
                <tr className="border-b-2 border-black text-left text-sm">
                  <th className="py-2 w-10">No</th>
                  <th className="py-2">Nama Barang</th>
                  <th className="py-2 w-24">Jumlah</th>
                  <th className="py-2 text-right w-32">Harga Satuan</th>
                </tr>
              </thead>
              <tbody>
                {list.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200 text-sm">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{item.product_name || item.name || item.product_name_snapshot || 'Produk Tanpa Nama'}</td>
                    <td className="py-2">{item.quantity} {item.unit || 'pcs'}</td>
                    <td className="py-2 text-right">Rp {Number(item.price || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ringkasan Per List */}
            <div className="flex justify-end mt-4">
              <div className="text-right">
                <p className="text-xs uppercase text-slate-500">Total Estimasi Daftar Ini:</p>
                <p className="text-lg font-bold">Rp {Number(list.total_estimated_price).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Footer PDF */}
        <div className="mt-12 pt-4 border-t border-dashed border-slate-400 text-center">
          <p className="text-sm font-bold">Total Seluruh Anggaran: Rp {grandTotal.toLocaleString('id-ID')}</p>
          <p className="text-[10px] mt-4 text-slate-400">Terima kasih telah menggunakan AyoKulakan.id</p>
        </div>
      </div>
    </>
  );
}