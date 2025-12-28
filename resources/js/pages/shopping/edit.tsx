/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react'; // Gunakan useForm untuk state management

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Edit Daftar Belanja',
    href: shopping.edit(1).url,
  },
];

export default function Edit({ shoppingLists }: { shoppingLists: any[] }) {
  const { flash } = usePage().props as any;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit Daftar Belanja" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <h1>edit daftar belanja</h1>
      </div>
    </AppLayout>
  );
}