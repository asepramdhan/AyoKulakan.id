// Components
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';
import { MailOpen, Send } from 'lucide-react'; // Tambah icon

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verifikasi Email Anda"
            description="Satu langkah lagi! Kami telah mengirimkan tautan verifikasi ke email yang Anda daftarkan."
        >
            <Head title="Verifikasi Email" />

            {/* Visual Header */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <div className="p-4 bg-orange-100 dark:bg-orange-950/30 rounded-full animate-pulse">
                        <MailOpen className="w-10 h-10 text-orange-600" />
                    </div>
                    <div className="absolute -right-2 -top-2 bg-white dark:bg-gray-900 rounded-full p-1 shadow-sm">
                        <Send className="w-4 h-4 text-orange-500" />
                    </div>
                </div>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                    <p className="text-sm font-bold text-green-700">
                        Link baru telah dikirim!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                        Silakan periksa folder inbox atau spam email Anda.
                    </p>
                </div>
            )}

            <div className="space-y-6">
                <Form {...send.form()} className="flex flex-col gap-4 text-center">
                    {({ processing }) => (
                        <>
                            <Button
                                disabled={processing}
                                variant="default"
                                className="h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-100 dark:shadow-none"
                            >
                                {processing ? <Spinner className="mr-2" /> : null}
                                Kirim Ulang Email Verifikasi
                            </Button>

                            <div className="pt-2">
                                <TextLink
                                    href={logout()}
                                    className="text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
                                >
                                    Keluar (Log out)
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>

                <p className="text-center text-xs text-muted-foreground px-4 leading-relaxed">
                    Tidak menerima email? Pastikan alamat email sudah benar dan cek folder promosi/spam.
                </p>
            </div>
        </AuthLayout>
    );
}