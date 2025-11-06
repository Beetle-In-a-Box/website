import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import FloatingBar from '@/components/layout/FloatingBar'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'

export default function About() {
    return (
        <MainContainer>
            <NavBar date="AUGUST 2025" />
            <ContentsContainer title="ABOUT US">
                <h1>Content Coming Soon...</h1>
            </ContentsContainer>
            <FloatingBar showAbout={false} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
