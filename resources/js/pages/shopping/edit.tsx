/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping'; // Wayfinder routes
import { SharedData, type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, useForm, usePage } from '@inertiajs/react'; // Gunakan useForm untuk state management
import { Plus, Save, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Edit Belanja',
    href: shopping.edit(1).url,
  },
];

export default function Edit() {
  const { list, store, stores, products } = usePage<SharedData>().props;
  console.log('list', list, 'store', store, 'stores', stores, 'products', products);
  const { flash } = usePage().props as any;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Daftar Belanja" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Daftar Belanja</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...ShoppingListController.store()} options={{
              preserveScroll: true,
            }} className="space-y-6">
              {({ processing, recentlySuccessful, errors }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Judul Belanja</Label>
                      <Input
                        id="title"
                        name='title'
                        defaultValue={list.title}
                        className="mt-1 block w-full"
                        placeholder='Contoh: Belanja Bulanan MeowMeal.id'
                        required
                      />
                      <InputError message={errors.title} />
                    </div>
                  </div>
                </>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}