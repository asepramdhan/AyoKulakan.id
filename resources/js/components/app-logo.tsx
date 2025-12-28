import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-slate-200 shadow dark:bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="w-8 h-8 text-green-600" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="font-bold text-xl tracking-tight">
                    AyoKulakan.id
                </span>
            </div>
        </>
    );
}
