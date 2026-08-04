'use client';

import { usePathname } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Admin.module.scss';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // The login page lives under /admin, so this layout wraps it too — in the App
    // Router a nested layout nests INSIDE its parent rather than replacing it, so
    // app/admin/login/layout.tsx cannot opt out on its own. Without this check the
    // sidebar (including a Logout button) renders for signed-out visitors looking
    // at the login form.
    if (usePathname() === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div>
            <AdminNav />
            <main className={styles.adminContainer}>
                {children}
            </main>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}
