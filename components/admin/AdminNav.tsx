'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Admin.module.scss';

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin' && pathname === '/admin') return true;
        if (path !== '/admin' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <nav className={styles.nav}>
            <div className={styles.navHeader}>
                <h2>Admin Panel</h2>
            </div>
            <ul className={styles.navList}>
                <li>
                    <Link
                        href="/admin"
                        className={isActive('/admin') && pathname === '/admin' ? styles.active : ''}
                    >
                        Dashboard
                    </Link>
                </li>
                <li>
                    <Link
                        href="/admin/issues"
                        className={isActive('/admin/issues') ? styles.active : ''}
                    >
                        Issues
                    </Link>
                </li>
                <li>
                    <Link
                        href="/admin/articles"
                        className={isActive('/admin/articles') ? styles.active : ''}
                    >
                        Articles
                    </Link>
                </li>
            </ul>
            <div className={styles.navFooter}>
                <Link href="/">View Site</Link>
            </div>
        </nav>
    );
}
