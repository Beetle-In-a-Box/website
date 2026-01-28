'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './NavBar.module.scss';

interface NavBarProps {
  clickable?: boolean;
  date?: string;
}

export default function NavBar({ clickable = true, date }: NavBarProps) {
  const router = useRouter();

  const handleClick = () => {
    if (clickable) {
      router.push('/');
    }
  };

  return (
    <nav className={styles.navBar} id="nav" onClick={handleClick} style={{ cursor: clickable ? 'pointer' : 'default' }}>
      <div className={`${styles.item} ${styles.leftSide}`} id="lNav">
        <h3>BERKELEY, CA</h3>
      </div>
      <div className={`${styles.item} ${styles.center}`} id="cNav">
        <div className={styles.centerContent}>
          <div className={styles.logoContainer}>
            <Image
              src="/logo.jpg"
              alt="Beetle in a Box Logo"
              fill
              className={styles.logo}
            />
          </div>
          <div className={styles.textContainer}>
            <h1 id="cNavTitle">BEETLE IN A BOX</h1>
            <p>UNDERGRADUATE PHILOSOPHY REVIEW AT BERKELEY</p>
          </div>
        </div>
      </div>
      <div className={`${styles.item} ${styles.rightSide}`} id="rNav">
        <h3>{date}</h3>
      </div>
    </nav>
  );
}
