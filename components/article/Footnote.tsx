'use client';

import styles from './Footnote.module.scss';

interface FootnoteProps {
  id: string;
  number: number;
  children: React.ReactNode;
}

export default function Footnote({ id, number, children }: FootnoteProps) {
  const goToReference = () => {
    const element = document.getElementById(`fl${number}`);
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
    <p className={`${styles.text} ${styles.footnote}`} id={id} onClick={goToReference}>
      <sup>{number}</sup> {children}
    </p>
  );
}
