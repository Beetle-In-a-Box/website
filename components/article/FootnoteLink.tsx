'use client';

import styles from './FootnoteLink.module.scss';

interface FootnoteLinkProps {
  number: number;
}

export default function FootnoteLink({ number }: FootnoteLinkProps) {
  const goToFootnote = () => {
    const element = document.getElementById(`f${number}`);
    if (!element) return;

    const yOffset = window.innerHeight * 0.22;
    const y = element.getBoundingClientRect().top + window.pageYOffset - yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });

    element.style.backgroundColor = 'yellow';
    element.style.fontSize = 'x-large';
    setTimeout(() => {
      element.style.backgroundColor = 'unset';
      element.style.fontSize = 'unset';
    }, 3000);
  };

  return (
    <sup
      className={styles.footnoteLink}
      id={`fl${number}`}
      onClick={goToFootnote}
    >
      {number}
    </sup>
  );
}
