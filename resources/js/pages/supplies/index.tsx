/* eslint-disable @typescript-eslint/no-explicit-any */
// import SupplyController from '@/actions/App/Http/Controllers/SupplyController';
import SupplyController from '@/actions/App/Http/Controllers/SupplyController';
import InputError from '@/components/input-error';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import supplies from '@/routes/supplies';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Box, Edit2, History, Layers, MoreVertical, Plus, RefreshCw, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Bahan Operasional',
    href: supplies.index().url,
  },
];

export default function Index({ supplyData }: { supplyData: any[] }) {
  // Dialog
  const [open, setOpen] = useState(false);
  // state untuk mendeteksi mode edit
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Form untuk tambah bahan baru
  const { data, setData, reset } = useForm({
    name: '',
    initial_stock: '',
    current_stock: '',
    unit: 'Pcs',
    reduction_type: 'per_transaction',
    min_stock_alert: 10,
  });
  // Fungsi untuk handle buka modal Edit
  const handleEdit = (item: any) => {
    setSelectedId(item.id);
    setData({
      name: item.name,
      initial_stock: item.initial_stock, // Meskipun tidak diedit, tetap diisi agar tidak error
      unit: item.unit || 'Pcs', // Tambahkan ini agar tidak kosong
      reduction_type: item.reduction_type,
      min_stock_alert: item.min_stock_alert,
    });
    setOpen(true);
  };
  // Reset saat modal ditutup
  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!open) {
      setSelectedId(null);
      reset();
    }
  }
  // Dialog Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  // Fungsi untuk memicu dialog hapus
  const triggerDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };
  // Fungsi hapus bahan
  const handleDelete = (id: number) => {
    router.delete(supplies.destroy(id), {
      onStart: () => { toast.loading('Menghapus bahan...', { id: 'delete-supply' }); },
      onSuccess: () => { toast.success('Bahan berhasil dihapus!', { id: 'delete-supply' }); },
      onError: () => { toast.error('Gagal menghapus bahan!', { id: 'delete-supply' }); },

      preserveScroll: true
    });
  }
  // Dialog Restock
  const [restockOpen, setRestockOpen] = useState(false);
  const [selectedRestockItem, setSelectedRestockItem] = useState<any>(null);
  // Fungsi untuk memicu dialog restock
  // Menggunakan useForm standar untuk restock agar lebih fleksibel
  const { data: restockData, setData: setRestockData, reset: resetRestock } = useForm({
    amount: '',
  });
  // Fungsi untuk memicu dialog restock
  const handleRestockOpen = (item: any) => {
    setSelectedRestockItem(item);
    resetRestock();
    setRestockOpen(true);
  };
  // Fungsi untuk memicu dialog history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [histories, setHistories] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Fungsi untuk menghandle dialog history
  const handleShowHistory = async (item: any) => {
    setSelectedRestockItem(item); // Gunakan state yang ada untuk simpan data bahan yang dipilih
    setHistoryOpen(true);
    setLoadingHistory(true);

    try {
      const response = await fetch(`/supplies/${item.id}/history`);
      const data = await response.json();
      setHistories(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Gagal mengambil riwayat");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manajemen Bahan Operasional" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Box className="text-indigo-500 w-7 h-7" />
              Bahan Operasional
            </h1>
            <p className="text-slate-500 text-sm">Pantau stok kertas thermal, plastik, dan perlengkapan lainnya.</p>
          </div>
          {/* Dialog Tambah Bahan */}
          <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Plus className="w-4 h-4" />Tambah Bahan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedId ? 'Edit Bahan' : 'Tambah Bahan Baru'}</DialogTitle>
                <DialogDescription>
                  {selectedId ? 'Perbarui informasi bahan operasional kamu.' : 'Input stok awal bahan operasional kamu di sini.'}
                </DialogDescription>
              </DialogHeader>
              {/* Form Tambah Bahan / Edit Bahan */}
              <Form
                {...selectedId ? supplies.update.form(selectedId) : supplies.store.form()}
                onStart={() => toast.loading(`${selectedId ? 'Memperbarui' : 'Menambahkan bahan'} ...`, { id: `${selectedId ? 'update-supply' : 'add-supply'}` })}
                onSuccess={() => {
                  toast.success(`Bahan berhasil di${selectedId ? 'perbarui' : 'tambahkan'}!`, { id: `${selectedId ? 'update-supply' : 'add-supply'}` });
                  setOpen(false);
                  reset();
                }}
                onError={() => toast.error(`Gagal ${selectedId ? 'memperbarui' : 'menambahkan'} bahan!`, { id: `${selectedId ? 'update-supply' : 'add-supply'}` })}
              >
                {({ processing, errors }: any) => {
                  return (
                    <>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>Nama Bahan</Label>
                          <Input
                            placeholder="Contoh: Kertas Thermal 57x40"
                            name='name'
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            required
                          />
                          <InputError message={errors.name} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Stok Awal</Label>
                            <Input
                              type="number"
                              name='initial_stock'
                              value={data.initial_stock}
                              onChange={e => setData('initial_stock', e.target.value)}
                              required
                            />
                            <InputError message={errors.initial_stock} />
                          </div>
                          <div className="space-y-2">
                            <Label>Satuan</Label>
                            <Input
                              name='unit'
                              placeholder="Pcs/Lembar/Roll"
                              value={data.unit}
                              onChange={e => setData('unit', e.target.value)}
                              required
                            />
                            <InputError message={errors.unit} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cara Berkurang (Otomatis)</Label>
                          <Select
                            name='reduction_type'
                            value={data.reduction_type}
                            onValueChange={(val) => setData('reduction_type', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_transaction">Per Transaksi (Resi)</SelectItem>
                              <SelectItem value="per_item">Per Jumlah Barang (Qty)</SelectItem>
                            </SelectContent>
                          </Select>
                          <InputError message={errors.reduction_type} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          disabled={processing}
                          className="w-full bg-indigo-600">
                          {selectedId ? 'Simpan Perbarui' : 'Simpan Bahan'}
                        </Button>
                      </DialogFooter>
                    </>
                  );
                }}
              </Form>
            </DialogContent>
          </Dialog>
          {/* Dialog Restok */}
          <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-500" />
                  Restok {selectedRestockItem?.name}
                </DialogTitle>
                <DialogDescription>
                  Masukkan jumlah {selectedRestockItem?.unit} baru yang kamu terima.
                </DialogDescription>
              </DialogHeader>
              {/* Form Restok */}
              <Form
                {...SupplyController.restock.form(selectedRestockItem?.id || 0)}
                onStart={() => toast.loading('Memperbarui stok...', { id: 'restock' })}
                onSuccess={() => {
                  toast.success('Stok berhasil diperbarui!', { id: 'restock' });
                  setRestockOpen(false);
                  reset();
                }}
                onError={() => toast.error('Gagal memperbarui stok!', { id: 'restock' })}
                options={{ preserveScroll: true }}
              >
                {({ processing, errors }: any) => {
                  return (
                    <>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Jumlah Tambahan ({selectedRestockItem?.unit})</Label>
                          <Input
                            type="number"
                            name='amount'
                            placeholder="Misal: 100"
                            value={restockData.amount}
                            onChange={e => setRestockData('amount', e.target.value)}
                            required
                            autoFocus
                          />
                          <InputError message={errors.amount} />
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-600 dark:text-indigo-400">
                          Stok saat ini: <strong>{selectedRestockItem?.current_stock}</strong>.
                          Setelah ditambah, total stok akan menjadi <strong>{(Number(selectedRestockItem?.current_stock) + Number(restockData.amount || 0))}</strong>.
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={processing}
                          className="w-full bg-indigo-600"
                        >
                          Konfirmasi Restok
                        </Button>
                      </DialogFooter>
                    </>
                  );
                }}
              </Form>
            </DialogContent>
          </Dialog>
          {/* Dialog History */}
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  Riwayat <span className='capitalize'>{selectedRestockItem?.name}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="py-4 max-h-[400px] overflow-y-auto">
                {loadingHistory ? (
                  <p className="text-center text-sm text-slate-500">Memuat riwayat...</p>
                ) : histories.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">Belum ada aktivitas stok.</p>
                ) : (
                  <div className="space-y-4">
                    {histories.map((h) => (
                      <div key={h.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{h.note}</p>
                          <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${h.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {h.amount > 0 ? '+' : ''}{h.amount} <span className='capitalize'>{selectedRestockItem?.unit}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">Sisa: {h.stock_after}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistik Ringkasan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Box className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Bahan</p>
                <h4 className="text-xl font-black">{supplyData.length} Jenis</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Stok Kritis</p>
                <h4 className="text-xl font-black">
                  {supplyData.filter(i => (i.current_stock / i.initial_stock) <= 0.2).length} Bahan
                </h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Perlu Restok</p>
                <h4 className="text-xl font-black">
                  {supplyData.filter(i => i.current_stock <= (i.min_stock_alert || 10)).length} Bahan
                </h4>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List Bahan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplyData.length === 0 &&
            <div className="col-span-3">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle className="text-slate-400 dark:text-slate-300">Belum ada data</EmptyTitle>
                  <EmptyDescription className="text-slate-400 dark:text-slate-500">
                    Kamu belum menambahkan bahan operasional.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          }
          {supplyData.map((item) => {
            const percentage = Math.round((item.current_stock / item.initial_stock) * 100) || 0;
            const isLow = percentage <= 20;

            return (
              <Card key={item.id} className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-2">

                    {/* Sisi Kiri: Nama & Badge */}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg leading-tight capitalize truncate">
                          {item.name}
                        </h3>
                        {/* Ikon peringatan sekarang nempel di sebelah judul */}
                        {isLow && <AlertTriangle className="text-rose-500 w-4 h-4 animate-pulse flex-shrink-0" />}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {item.reduction_type === 'per_transaction' ? <Zap className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                          {item.reduction_type === 'per_transaction' ? 'Per Resi' : 'Per Item'}
                        </span>
                      </div>
                    </div>

                    {/* Sisi Kanan: Titik Tiga (Dropdown) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0 -mr-2">
                          <MoreVertical className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleEdit(item)}
                          className="cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4 mr-2" /> Edit Bahan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleShowHistory(item)}
                          className="cursor-pointer text-indigo-600"
                        >
                          <History className="w-4 h-4 mr-2" /> Riwayat
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => triggerDelete(item)}
                          className="cursor-pointer text-rose-600 focus:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isLow ? 'text-rose-500' : 'text-slate-600'}>{percentage}% Tersisa</span>
                      <span className="text-slate-400 font-medium capitalize">{item.current_stock} / {item.initial_stock} {item.unit}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : percentage <= 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleRestockOpen(item)}
                      variant="outline"
                      className="w-full text-xs h-9 rounded-xl border-slate-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Restok
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      {/* Dialog Hapus */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="w-[95vw] max-w-[400px] rounded-[1.5rem] p-6 gap-6">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold tracking-tight">
                  Hapus Bahan
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-slate-500">
                  Apakah kamu yakin ingin menghapus bahan <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">{itemToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete(itemToDelete?.id);
                setDeleteOpen(false);
              }}
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
