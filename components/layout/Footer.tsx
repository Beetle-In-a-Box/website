import Image from 'next/image';
import { getCurrentYear } from '@/utils/date-utils';
import styles from './Footer.module.scss';

export default function Footer() {
  const year = getCurrentYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div>
          <p>Copyright © {year} Beetle in a Box / Leo Abubucker | All Rights Reserved</p>
          <p>Website Development By Leo Abubucker</p>
          <p>
            Disclaimer:
            <i>
              {' '}We are a student group acting independently of the University of California. We take full
              responsibility for our organization and this web site.
            </i>
          </p>
        </div>
        <a href="https://www.ocf.berkeley.edu" target="_blank" rel="noopener noreferrer" className={styles.ocfLink}>
          <Image
            src="http://www.ocf.berkeley.edu/hosting-logos/ocf-hosted-penguin.svg"
            alt="Hosted by the OCF"
            width={88}
            height={31}
          />
        </a>
      </div>
    </footer>
  );
}
