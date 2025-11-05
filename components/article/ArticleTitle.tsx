import styles from './ArticleTitle.module.scss';

interface ArticleTitleProps {
  title: string;
}

export default function ArticleTitle({ title }: ArticleTitleProps) {
  return <div className={styles.title}>{title}</div>;
}
