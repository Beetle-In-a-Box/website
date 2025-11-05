import styles from './ContentsContainer.module.scss';

interface ContentsContainerProps {
  children: React.ReactNode;
}

export default function ContentsContainer({ children }: ContentsContainerProps) {
  return <div className={styles.contentsContainer}>{children}</div>;
}
