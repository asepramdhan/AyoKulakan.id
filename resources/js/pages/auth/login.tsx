import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { home, register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import toast from 'react-hot-toast';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {

    return (
        <AuthLayout
            title="Selamat Datang Kembali"
            description="Pantau perkembangan profit tokomu hari ini"
        >
            <Head title="Masuk ke ayokulakan.id" />

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-6">
                <Link href={home.url()} className="p-3 bg-orange-600 rounded-2xl shadow-lg shadow-orange-200 mb-2">
                    <AppLogoIcon className="w-8 h-8 text-white" />
                </Link>
                <p className="text-xs font-black uppercase tracking-widest text-orange-600">ayokulakan.id</p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                onStart={() => toast.loading('Memvalidasi akun...', { id: 'account-login' })}
                onSuccess={() => toast.success('Selamat datang kembali!', { id: 'account-login' })}
                onError={() => toast.error('Email atau kata sandi salah.', { id: 'account-login' })}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="font-bold text-gray-700">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" shadow-sm className="font-bold text-gray-700">Kata Sandi</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                                            tabIndex={5}
                                        >
                                            Lupa Kata Sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••••••••"
                                    className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-gray-300 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                                />
                                <Label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">
                                    Ingat saya di perangkat ini
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {/* {processing ? <Spinner className="mr-2" /> : null} */}
                                Masuk Dashboard
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm font-medium text-muted-foreground pt-2">
                                Belum punya akun?{' '}
                                <TextLink href={register()} tabIndex={6} className="text-orange-600 font-black hover:underline">
                                    Daftar Gratis
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-100 text-center text-sm font-bold text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}