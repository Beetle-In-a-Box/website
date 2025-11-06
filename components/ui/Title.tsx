import styles from './Title.module.scss';

interface TitleProps {
  children: React.ReactNode;
  className?: string;
}

export default function Title({ children, className = '' }: TitleProps) {
  return <div className={`${styles.title} ${className}`}>{children}</div>;
}
