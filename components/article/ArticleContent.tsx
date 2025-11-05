'use client';

import styles from './ArticleContent.module.scss';

interface ArticleContentProps {
  children: React.ReactNode;
}

export default function ArticleContent({ children }: ArticleContentProps) {
  return <div className={`${styles.text} ${styles.contents}`}>{children}</div>;
}
