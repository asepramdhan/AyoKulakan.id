import { update } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react'; // Icon tambahan

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import AppLogoIcon from '@/components/app-logo-icon';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <AuthLayout
            title="Setel Ulang Kata Sandi"
            description="Langkah terakhir untuk mengamankan kembali akun Anda."
        >
            <Head title="Reset Kata Sandi" />

            {/* Visual Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl mb-3 relative">
                    <AppLogoIcon className="w-8 h-8 text-orange-600" />
                    <div className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-900">
                        <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                </div>
            </div>

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        {/* Email Field - Read Only */}
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-bold text-gray-500">Email Anda</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={email}
                                className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 text-gray-400 cursor-not-allowed"
                                readOnly
                            />
                            <InputError message={errors.email} />
                        </div>

                        {/* New Password Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="password" shadow-sm className="font-bold text-gray-700">Kata Sandi Baru</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="••••••••••••"
                                    className="pl-10 h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirmation Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="font-bold text-gray-700">Konfirmasi Kata Sandi Baru</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="••••••••••••"
                                    className="pl-10 h-11 focus-visible:ring-orange-500 border-gray-200"
                                />
                            </div>
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing ? <Spinner className="mr-2" /> : null}
                            Perbarui Kata Sandi
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}