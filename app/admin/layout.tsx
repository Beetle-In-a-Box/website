import AdminNav from '@/components/admin/AdminNav';
import styles from '@/components/admin/Admin.module.scss';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <AdminNav />
            <main className={styles.adminContainer}>
                {children}
            </main>
        </div>
    );
}
