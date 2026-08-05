'use client';

import { useRouter } from 'next/navigation';
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
            {/*
              Plain <img> on a pre-built WebP rather than next/image: the platform
              image optimizer silently passes originals through on the deploy host,
              so /_next/image would ship the 16KB JPEG on every page. logo.webp is
              committed alongside logo.jpg and needs no optimizer at all.
              Regenerate after changing logo.jpg:
                node -e "require('sharp')('public/logo.jpg').webp({quality:80}).toFile('public/logo.webp')"
            */}
            <img
              src="/logo.webp"
              alt="Beetle in a Box Logo"
              width={212}
              height={212}
              className={styles.logo}
            />
          </div>
          <div className={styles.textContainer}>
            <h1 id="cNavTitle">BEETLE IN A BOX</h1>
            <p>UNDERGRADUATE PHILOSOPHY REVIEW AT BERKELEY</p>
          </div>
        </div>
      </div>
      {/*
        The wrapper renders even with no date, because it is one of the seven
        columns the desktop grid is built from (leftSide 1 + center 5 + this 1)
        and dropping it would un-centre the masthead. The <h3> is conditional
        so that the wrapper matches :empty on the pages that pass no date
        (about, apply, archive) -- stacked, that is what lets it collapse
        instead of adding a blank row. See NavBar.module.scss.
      */}
      <div className={`${styles.item} ${styles.rightSide}`} id="rNav">
        {date && <h3>{date}</h3>}
      </div>
    </nav>
  );
}
