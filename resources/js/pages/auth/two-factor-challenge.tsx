import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';
import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import { ShieldCheck, LifeBuoy } from 'lucide-react';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
        icon: React.ReactNode;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Kode Pemulihan',
                description: 'Masukkan salah satu kode pemulihan darurat Anda untuk mengakses akun.',
                toggleText: 'Gunakan kode autentikasi biasa',
                icon: <LifeBuoy className="w-8 h-8 text-orange-600" />
            };
        }

        return {
            title: 'Verifikasi Dua Langkah',
            description: 'Masukkan kode verifikasi dari aplikasi autentikator Anda.',
            toggleText: 'Gunakan kode pemulihan darurat',
            icon: <ShieldCheck className="w-8 h-8 text-orange-600" />
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <Head title="Two-Factor Authentication" />

            {/* Icon & Brand Section */}
            <div className="flex flex-col items-center mb-8">
                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl mb-4">
                    {authConfigContent.icon}
                </div>
            </div>

            <div className="space-y-6">
                <Form
                    {...store.form()}
                    className="space-y-6"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <div className="space-y-2">
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder="Contoh: abcd1-efgh2"
                                        autoFocus={showRecoveryInput}
                                        className="h-12 text-center font-mono uppercase tracking-widest border-gray-200 focus-visible:ring-orange-500"
                                        required
                                    />
                                    <InputError message={errors.recovery_code} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <InputOTP
                                        name="code"
                                        maxLength={OTP_MAX_LENGTH}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                        disabled={processing}
                                        pattern={REGEXP_ONLY_DIGITS}
                                    >
                                        <InputOTPGroup className="gap-2">
                                            {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                    className="w-12 h-14 text-xl font-bold border-2 rounded-xl border-gray-200 data-[active=true]:border-orange-500 data-[active=true]:ring-orange-500"
                                                />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-100 dark:shadow-none"
                                disabled={processing || (!showRecoveryInput && code.length < OTP_MAX_LENGTH)}
                            >
                                {processing ? 'Memverifikasi...' : 'Lanjutkan Masuk'}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-sm font-medium text-orange-600 hover:text-orange-700 underline decoration-orange-200 underline-offset-4 transition-all"
                                    onClick={() => toggleRecoveryMode(clearErrors)}
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}