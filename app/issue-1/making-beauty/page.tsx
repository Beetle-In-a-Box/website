import NavBar from '@/components/layout/NavBar';
import Footer from '@/components/layout/Footer';
import FloatingBar from '@/components/layout/FloatingBar';
import MainContainer from '@/components/layout/MainContainer';
import ArticleContainer from '@/components/article/ArticleContainer';
import ArticleTitle from '@/components/article/ArticleTitle';
import ArticleAuthor from '@/components/article/ArticleAuthor';
import ArticleContent from '@/components/article/ArticleContent';
import Footnote from '@/components/article/Footnote';
import FootnoteLink from '@/components/article/FootnoteLink';
import Image from 'next/image';

export default function MakingBeautyArticle() {
  return (
    <MainContainer>
      <NavBar date="August 2025" />
      <ArticleContainer>
        <ArticleTitle title="Making Beauty In Ugly Things" />
        <ArticleAuthor author="Sichen Li" role="Staff Writer" />
        <Image
          src="/Issue-1/Images/making-beauty_cover.jpeg"
          alt="Making Beauty In Ugly Things"
          width={800}
          height={600}
          style={{ width: '100%', height: 'auto' }}
        />
        <ArticleContent>
          <p>
            Perhaps you've also overheard the puzzlingly proverbial "I like men who are a little bit
            ugly." Or you've faced <i>David</i> or <i>The Starry Night</i> only to feel a brief pulse of
            awe before disappointment. You've attended the spectacle, and you can put it in the family
            newsletter or an instagram story, but where was the promised sublimity?
          </p>
          <p></p>
          <p>These two events could be motivated by the same desire.</p>
          <p></p>
          <p>
            I think there is a natural longing in all of us to participate in the things we perceive. This
            participation turns more passive perception into an experience, often by providing amusement or
            emotional value. We of course remember the day we flirted exhilaratingly with our third-grade crush
            more than our introduction to fractions.
          </p>
          <p></p>
          <p>
            When faced with beauty, we prefer it when our perspective is a crucial part of that encounter. This
            special class of beautiful things, which elicit chatter, controversy, and participation, exists
            primarily in objects we would not initially call beautiful at all.
          </p>
          <p></p>
          <p>
            My paper is about how the things that we find the most beautiful are not exactly conventional,
            because it is often imperfections that encourage us to participate with our perspective.
          </p>
          <p></p>
          <p style={{ textAlign: 'center' }}>* * *</p>
          <p></p>
          <p>
            Two things about seeing are worth borrowing from the first essay of John Berger's popular collection,
            <i>Ways of Seeing</i>.<FootnoteLink number={1} /> First, the act of seeing more or less
            involves a choice. Here I will clarify that my reading of Berger is that we can still receive
            sensory data passively or absentmindedly, but when we are consciously looking at something we are
            active and liable. The agency invoked when we look is the beginning of what I call
            <b>participation</b> in the act of seeing.
          </p>
          <p></p>
          <p>The question provoked is: how can participation be encouraged?</p>
          <p></p>
          <p>
            Secondly, what we see is in a close and curious relation to what we know and who we are. At the
            height of our participation in seeing, "we are always looking at the relation between things and
            ourselves." This phenomenon would be impossible without what I will call <b>perspective</b>. A
            perspective entails a certain subjectivity. When invoked in an act of seeing, perspective turns it
            from a one-way event into a relationship.
          </p>
          <p></p>
          <p>
            This is Giorgio de Chirico's 1914 <i>Mystery and Melancholy of a Street</i>. I recall looking at it
            on my computer screen and bringing to it the perspective of someone stranded at home in the midst of
            the pandemic. It was moving and relatable in a way I cannot replicate anymore - even the title had a
            different ring to it back then.
          </p>
          <p></p>
          <p>That is a little example of meaningful participation.</p>
          <p></p>
          <p>
            To participate is to bring a certain perspective. The stronger the perspective, the more you
            participate in the act of seeing.
          </p>
          <p></p>
          <p>
            The question now becomes, <i>how can something encourage participation particularly by emphasizing or
                creating a certain perspective?</i>
          </p>
          <p></p>
          <p>
            Chirico certainly didn't give me the context of the pandemic. It is accidental that his art should
            have so fittingly captured that prevailing physical and mental state of the world. Sure, you could
            call him lucky. Or maybe his craft is just in creating something with the potential to be
            universally relatable - the yearning we find when motion clashes with stillness, or that lonely mood
            Edward Hopper also evokes. Somehow, though he did not release the virus, Chirico has long been
            complicit in the creation of a perspective that, like mist, envelops his art. And from the title we
            certainly know that a lens of mystery and melancholy was his intention.
          </p>
          <p></p>
          <p style={{ textAlign: 'center' }}>* * *</p>
          <p></p>
          <p>
            Let us return to exploring what we find beautiful, and how some beautiful things gain aesthetic
            meaning through our participation with it.
          </p>
          <p></p>
          <p>
            There are certain things so beautiful that you cannot help but feel, intuitively, that their beauty
            would persist even if you did not perceive it, or even if no one perceived it at all. It is both
            impossible and unnecessary to anatomize its beauty with language. They seem to trigger something in
            us that we take for granted. I call these things conventionally beautiful.
          </p>
          <p></p>
          <p>Consider Michelangelo's <i>David</i>.</p>
          <p></p>
          <p>
            No further discussion of his beauty is required for the layman viewer. It has become so hailed as
            beautiful that he feels it has defied the subjectivity of beauty. It's as if the sculpture has the
            same aesthetic value in the objective world of things and the subjective world of perception.
          </p>
          <p></p>
          <p>
            But that is not the kind of beauty I want to discuss. Rather, I want to propose a new kind of beauty,
            even a new class of subliminal things, which are not granted to be beautiful, but explicitly
            <i>seen</i> to be beautiful. Beautiful objects which, without perspective, would be utterly
            unremarkable.
          </p>
          <p></p>
          <p>
            I want to write about how different art forms create these objects through an emphasis on
            <i>perspective</i>.
          </p>

          <div className='footnoteBorder'></div>
          <Footnote id="f1" number={1}>
            Berger, John. 1972. <i>Ways of Seeing</i>. London: Penguin.
          </Footnote>
        </ArticleContent>
      </ArticleContainer>
      <FloatingBar showAbout={true} showLatest={false} />
      <Footer />
    </MainContainer>
  );
}
