'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSeasonAndYear } from '@/utils/date-utils';
import styles from './NavBar.module.scss';

interface NavBarProps {
  clickable?: boolean;
  date?: string;
}

export default function NavBar({ clickable = true, date }: NavBarProps) {
  const router = useRouter();
  const [displayDate, setDisplayDate] = useState<string>(date || '');

  useEffect(() => {
    if (!date) {
      setDisplayDate(getSeasonAndYear());
    }
  }, [date]);

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
        <h1 id="cNavTitle">BEETLE IN A BOX</h1>
        <p>UC BERKELEY UNDERGRADUATE PHILOSOPHY REVIEW</p>
      </div>
      <div className={`${styles.item} ${styles.rightSide}`} id="rNav">
        <h3>{displayDate || date}</h3>
      </div>
    </nav>
  );
}
