import NavBar from '@/components/layout/NavBar';
import MainContainer from '@/components/layout/MainContainer';
import ContentsContainer from '@/components/issue/ContentsContainer';
import Text from '@/components/ui/Text';
import Link from '@/components/ui/Link';
import FloatingBar from '@/components/layout/FloatingBar';
import Footer from '@/components/layout/Footer';
import styles from './page.module.scss';

export default function ApplyPage() {
  return (
    <MainContainer>
      <NavBar />
      <ContentsContainer title="Apply">
        <Text as="p" className={styles.centeredText}>
          Beetle in a Box is recruiting writers and artists. Please fill out{' '}
          <Link
            href="https://docs.google.com/forms/d/1m9pXMf5iISXGZx_3-TdfRghI-S7f1ckXzumdjoGXZWw/viewform"
            target="_blank"
          >
            this form
          </Link>{' '}
          by Sunday, 2/1 to apply.
        </Text>
      </ContentsContainer>
      <FloatingBar showAbout={true} showLatest={true} />
      <Footer />
    </MainContainer>
  );
}
