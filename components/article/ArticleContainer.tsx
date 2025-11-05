import styles from './ArticleContainer.module.scss';

interface ArticleContainerProps {
  children: React.ReactNode;
}

export default function ArticleContainer({ children }: ArticleContainerProps) {
  return <div className={styles.articleContainer}>{children}</div>;
}
