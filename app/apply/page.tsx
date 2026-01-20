import NavBar from '@/components/layout/NavBar';
import MainContainer from '@/components/layout/MainContainer';
import ContentsContainer from '@/components/issue/ContentsContainer';
import Empty from '@/components/ui/Empty';
import FloatingBar from '@/components/layout/FloatingBar';
import Footer from '@/components/layout/Footer';

export default function ApplyPage() {
  return (
    <MainContainer>
      <NavBar />
      <ContentsContainer title="Apply">
        <Empty>Google Form coming soon...</Empty>
      </ContentsContainer>
      <FloatingBar showAbout={true} showLatest={true} />
      <Footer />
    </MainContainer>
  );
}
