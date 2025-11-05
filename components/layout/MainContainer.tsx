import styles from './MainContainer.module.scss';

interface MainContainerProps {
  children: React.ReactNode;
}

export default function MainContainer({ children }: MainContainerProps) {
  return <div className={styles.mainContainer}>{children}</div>;
}
