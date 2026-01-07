import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import FloatingBar from '@/components/layout/FloatingBar'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import Empty from '@/components/ui/Empty'

export default function About() {
    return (
        <MainContainer>
            <NavBar />
            <ContentsContainer title="ABOUT US">
                <Empty />
            </ContentsContainer>
            <FloatingBar showAbout={false} showLatest={true} />
            <Footer />
        </MainContainer>
    )
}
