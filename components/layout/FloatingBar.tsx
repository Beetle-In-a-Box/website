'use client';

import Link from 'next/link';
import styles from './FloatingBar.module.scss';

interface FloatingBarProps {
  showAbout?: boolean;
  showLatest?: boolean;
}

export default function FloatingBar({ showAbout = true, showLatest = false }: FloatingBarProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={styles.floatingBar}>
      <a className={styles.text} onClick={scrollToTop}>
        Back to Top
      </a>
      <p className={styles.text}>|</p>
      {showAbout && (
        <>
          <Link className={styles.text} href="/about">
            About Us
          </Link>
          <p className={styles.text}>|</p>
        </>
      )}
      {showLatest && (
        <>
          <Link className={styles.text} href="/">
            Latest
          </Link>
          <p className={styles.text}>|</p>
        </>
      )}
      <a className={styles.text}>Archive</a>
    </div>
  );
}
