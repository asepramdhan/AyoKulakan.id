// Components
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail } from 'lucide-react'; // Tambah icon Mail

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import AppLogoIcon from '@/components/app-logo-icon';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Lupa Kata Sandi?"
            description="Jangan panik, masukkan email Anda untuk mendapatkan tautan pemulihan."
        >
            <Head title="Lupa Kata Sandi" />

            {/* Logo Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-2">
                    <AppLogoIcon className="w-8 h-8 text-orange-600" />
                </div>
            </div>

            {status ? (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                    <p className="text-sm font-bold text-green-600">
                        {status}
                    </p>
                    <p className="text-xs text-green-500 mt-1">Silakan periksa folder inbox atau spam Anda.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <Form {...email.form()}>
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="font-bold text-gray-700">Email Pemulihan</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            autoFocus
                                            placeholder="nama@email.com"
                                            className="pl-10 h-11 focus-visible:ring-orange-500 border-gray-200"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <div className="my-6">
                                    <Button
                                        className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                                        disabled={processing}
                                        data-test="email-password-reset-link-button"
                                    >
                                        {processing ? (
                                            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                                        ) : null}
                                        Kirim Link Reset
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>

                    <div className="text-center text-sm font-medium text-muted-foreground">
                        Ingat kata sandi?{' '}
                        <TextLink href={login()} className="text-orange-600 font-bold hover:underline">
                            Kembali Masuk
                        </TextLink>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
}