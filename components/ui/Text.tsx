import styles from './Text.module.scss';

interface TextProps {
  children: React.ReactNode;
  indent?: boolean;
  className?: string;
  as?: 'p' | 'div' | 'span';
}

export default function Text({ children, indent = false, className = '', as = 'div' }: TextProps) {
  const Component = as;
  const classNames = `${styles.text} ${indent ? styles.withIndent : ''} ${className}`;

  return <Component className={classNames}>{children}</Component>;
}
