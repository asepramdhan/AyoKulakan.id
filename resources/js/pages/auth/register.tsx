import { home, login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import AppLogoIcon from '@/components/app-logo-icon';
import toast from 'react-hot-toast';

export default function Register() {
    return (
        <AuthLayout
            title="Buat Akun Baru"
            description="Gabung bersama ribuan seller cerdas di ayokulakan.id"
        >
            <Head title="Daftar Akun" />

            {/* Tambahkan Logo di atas form untuk memperkuat branding */}
            <div className="flex flex-col items-center mb-2">
                <Link href={home.url()} className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-200 mb-2">
                    <AppLogoIcon className="w-8 h-8 text-white" />
                </Link>
            </div>

            <Form
                {...store.form()}
                onStart={() => toast.loading('Memvalidasi akun...', { id: 'account-register' })}
                onSuccess={() => toast.success('Akun berhasil dibuat!', { id: 'account-register' })}
                onError={() => toast.error('Akun gagal dibuat.', { id: 'account-register' })}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="font-bold text-gray-700 dark:text-gray-300">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Contoh: Budi Santoso"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-bold text-gray-700">Email Toko</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="nama@toko.com"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" title="Gunakan minimal 8 karakter" className="font-bold text-gray-700">Kata Sandi</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="••••••••••••"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation" className="font-bold text-gray-700 text-xs uppercase tracking-wider">Konfirmasi Kata Sandi</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="••••••••••••"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                                tabIndex={5}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {/* {processing ? <Spinner className="mr-2" /> : null} */}
                                Daftar Sekarang
                            </Button>
                        </div>

                        <div className="text-center text-sm font-medium text-muted-foreground">
                            Sudah punya akun?{' '}
                            <TextLink href={login()} tabIndex={6} className="text-orange-600 font-bold hover:underline">
                                Masuk di sini
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}