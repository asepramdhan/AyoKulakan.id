import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/password/confirm';
import { Form, Head } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react'; // Tambah icon keamanan

export default function ConfirmPassword() {
    return (
        <AuthLayout
            title="Konfirmasi Keamanan"
            description="Ini adalah area sensitif. Masukkan kata sandi Anda untuk melanjutkan."
        >
            <Head title="Konfirmasi Kata Sandi" />

            {/* Logo & Info Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-3 relative">
                    <AppLogoIcon className="w-8 h-8 text-orange-600" />
                    <div className="absolute -right-1 -bottom-1 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm">
                        <LockKeyhole className="w-4 h-4 text-orange-600" />
                    </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verifikasi Identitas</p>
            </div>

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="font-bold text-gray-700 dark:text-gray-300">
                                Kata Sandi
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                placeholder="••••••••••••"
                                className="h-11 focus-visible:ring-orange-500 border-gray-200"
                                autoComplete="current-password"
                                autoFocus
                            />

                            <InputError message={errors.password} />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing ? <Spinner className="mr-2" /> : null}
                                Konfirmasi Akses
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}