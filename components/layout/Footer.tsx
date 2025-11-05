import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        <p>Copyright © 2025 Beetle in a Box / Leo Abubucker | All Rights Reserved</p>
        <p>Website Development By Leo Abubucker</p>
        <p>
          Disclaimer:
          <i>
            {' '}We are a student group acting independently of the University of California. We take full
            responsibility for our organization and this web site.
          </i>
        </p>
      </div>
      <a href="https://www.ocf.berkeley.edu" target="_blank" rel="noopener noreferrer">
        {/* <img src="Images/ocf.png" alt="Hosted by the OCF" style="border: 0;" /> */}
      </a>
    </footer>
  );
}
