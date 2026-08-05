import MainContainer from '@/components/layout/MainContainer'
import NavBar from '@/components/layout/NavBar'
import FloatingBar from '@/components/layout/FloatingBar'
import Footer from '@/components/layout/Footer'

interface PageLayoutProps {
    /** Shown at the right of the nav bar. */
    date?: string
    /** Whether clicking the nav bar navigates home. Mirrors NavBar's own default. */
    clickable?: boolean
    /** Mirrors FloatingBar's own default. */
    showAbout?: boolean
    /** Mirrors FloatingBar's own default. */
    showLatest?: boolean
    children: React.ReactNode
}

export default function PageLayout({
    date,
    clickable,
    showAbout,
    showLatest,
    children,
}: PageLayoutProps) {
    return (
        <MainContainer>
            <NavBar clickable={clickable} date={date} />
            {children}
            <FloatingBar showAbout={showAbout} showLatest={showLatest} />
            <Footer />
        </MainContainer>
    )
}
