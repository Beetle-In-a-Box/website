import styles from './Empty.module.scss'

interface EmptyProps {
    children?: React.ReactNode
}

export default function Empty({ children = 'Content Coming Soon...' }: EmptyProps) {
    return <p className={styles.empty}>{children}</p>
}
