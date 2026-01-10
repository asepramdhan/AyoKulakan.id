/* eslint-disable @typescript-eslint/no-explicit-any */
import SupplyController from '@/actions/App/Http/Controllers/SupplyController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import supplies from '@/routes/supplies';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Box, Layers, Plus, RefreshCw, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Bahan Packing',
    href: supplies.index().url,
  },
];

export default function Index({ supplies }: { supplies: any[] }) {

  // Dialog
  const [open, setOpen] = useState(false);

  // Form untuk tambah bahan baru
  const { data, setData, reset } = useForm({
    name: '',
    initial_stock: '',
    current_stock: '',
    unit: 'Pcs',
    reduction_type: 'per_transaction',
    min_stock_alert: 10,
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Manajemen Bahan Packing" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Box className="text-indigo-500 w-7 h-7" />
              Bahan Packing
            </h1>
            <p className="text-slate-500 text-sm">Pantau stok kertas thermal, plastik, dan perlengkapan lainnya.</p>
          </div>
          {/* Dialog Tambah Bahan */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                <Plus className="w-4 h-4" />Tambah Bahan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tambah Bahan Baru</DialogTitle>
                <DialogDescription>Input stok awal bahan operasional kamu di sini.</DialogDescription>
              </DialogHeader>
              <Form
                {...SupplyController.store()}
                onStart={() => toast.loading('Menambah bahan...', { id: 'add-supply' })}
                onSuccess={() => {
                  toast.success('Bahan berhasil ditambahkan!', { id: 'add-supply' });
                  setOpen(false);
                  reset();
                }}
                onError={() => toast.error('Gagal menambah bahan!', { id: 'add-supply' })}
                options={{ preserveScroll: true }}
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
                          Simpan Bahan
                        </Button>
                      </DialogFooter>
                    </>
                  );
                }}
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* List Bahan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplies.length === 0 && <div className="col-span-3">Belum ada bahan packing.</div>}
          {supplies.map((item) => {
            const percentage = Math.round((item.current_stock / item.initial_stock) * 100) || 0;
            const isLow = percentage <= 20;

            return (
              <Card key={item.id} className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg leading-tight capitalize">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {item.reduction_type === 'per_transaction' ? <Zap className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                          {item.reduction_type === 'per_transaction' ? 'Per Resi' : 'Per Item'}
                        </span>
                      </div>
                    </div>
                    {isLow && <AlertTriangle className="text-rose-500 w-6 h-6 animate-bounce" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className={isLow ? 'text-rose-500' : 'text-slate-600'}>{percentage}% Tersisa</span>
                      <span className="text-slate-400 font-medium">{item.current_stock} / {item.initial_stock} {item.unit}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : percentage <= 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="w-full text-xs h-9 rounded-xl border-slate-200">
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Restok
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
