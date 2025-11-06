import NextLink from 'next/link';
import styles from './Link.module.scss';

interface LinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  target?: '_blank' | '_self';
  variant?: 'default' | 'bold' | 'text';
  className?: string;
}

export default function Link({
  children,
  href,
  onClick,
  target,
  variant = 'default',
  className = ''
}: LinkProps) {
  const variantClass = variant === 'bold' ? styles.bold : variant === 'text' ? styles.textLink : styles.link;
  const classNames = `${variantClass} ${className}`;

  if (href) {
    return (
      <NextLink href={href} target={target} className={classNames} onClick={onClick}>
        {children}
      </NextLink>
    );
  }

  return (
    <a className={classNames} onClick={onClick}>
      {children}
    </a>
  );
}
