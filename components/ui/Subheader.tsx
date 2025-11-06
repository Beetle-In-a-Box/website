import styles from './Subheader.module.scss';

interface SubheaderProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function Subheader({ children, onClick, className = '' }: SubheaderProps) {
  return (
    <span className={`${styles.subheader} ${className}`} onClick={onClick}>
      {children}
    </span>
  );
}
