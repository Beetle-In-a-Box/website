import NavBar from '@/components/layout/NavBar'
import Footer from '@/components/layout/Footer'
import FloatingBar from '@/components/layout/FloatingBar'
import MainContainer from '@/components/layout/MainContainer'
import ContentsContainer from '@/components/issue/ContentsContainer'
import IssueCover from '@/components/issue/IssueCover'
import ArticlePreview from '@/components/issue/ArticlePreview'

export default function Home() {
    const articles = [
        {
            id: 'article1',
            title: 'Making Beauty In Ugly Things',
            author: 'Sichen Li',
        },
        {
            id: 'article2',
            title: 'The Convenience of Illusion',
            author: 'Nicole Kadi',
        },
        {
            id: 'article3',
            title: 'The Only Thing We Fear Is You',
            author: 'Deniz Durusoy',
        },
        {
            id: 'article4',
            title: 'Hyperreality: A Cultural Analysis',
            author: 'Vienna Gaspar',
        },
        {
            id: 'article5',
            title: 'Does Liberalism Understand People?',
            author: 'Max Abubucker',
        },
        {
            id: 'article6',
            title: 'Gossiping Tweens & Ending Regimes',
            author: 'Karis Morasch',
        },
    ]

    return (
        <MainContainer>
            <NavBar clickable={false} date="August 2025" />
            <ContentsContainer title="Issue 1">
                <IssueCover
                    imageSrc="/Issue-1/Images/issue-1_cover.png"
                    articles={articles}
                />
                <div className="text contents previewContainer">
                    <ArticlePreview
                        id="article1"
                        title="Making Beauty In Ugly Things"
                        author="Sichen Li"
                        previewText="Perhaps you've also overheard the puzzlingly proverbial 'I like men who are a little bit ugly.' Or you've faced David or The Starry Night only to feel a brief pulse of awe before disappointment. You've attended the spectacle, and you can put it in the family newsletter or an instagram story, but where was the promised sublimity? These two events could be motivated by the same desire. I think there is a natural longing in all of us to participate in the things we perceive."
                        imageUrl="/Issue-1/Images/making-beauty_cover.jpeg"
                        articleUrl="/issue-1/making-beauty"
                    />
                    <ArticlePreview
                        id="article2"
                        title="The Convenience of Illusion: Are We Truly Committed to Reality?"
                        author="Nicole Kadi"
                        previewText="Imagine you could live your life experiencing the greatest pleasures of the world. All your dreams and greatest desires would come true, whether it's making groundbreaking scientific discoveries or becoming a world-renowned politician. The imaginations are endless. This is what Robert Nozick's experience machine offers: a chance to live your greatest, most pleasurable life. What of reality? Would you choose this reality? More importantly, what does your answer reveal about how committed you truly are to reality?"
                        imageUrl="/Issue-1/Images/convenience-illusion_cover.png"
                        articleUrl="/issue-1/convenience-illusion"
                    />
                    <ArticlePreview
                        id="article3"
                        title="The Only Thing We Fear Is You: How Chernobyl Turned Fear of The Unknown Into Fear of Ourselves"
                        author="Deniz Durusoy"
                        previewText="No one familiar with the history of 'Weird Fiction' can say that the books of the genre have as important of a role in our lives as they did at the end of the 19th century. Back in the good old days when death by polio was a common occurrence and the world was getting ready for the World War(s), writers such as Arthur Machen and E.T.A Hoffman and their sometimes gruesome, or dreadful, or other times thought-provoking stories has shaped what we now call fiction."
                        imageUrl="/Issue-1/Images/only-thing_cover.jpeg"
                        articleUrl="/issue-1/only-thing"
                    />
                    <ArticlePreview
                        id="article4"
                        title="Hyperreality: A Cultural Analysis"
                        author="Vienna Gaspar"
                        previewText="The term 'simulation' brings to mind images straight out of The Matrix. Thousands of human bodies in vats, powering the outside world. Simulated lives that can be woken up from once they reach the realization that 'this isn't reality'. Post-structuralist Jean Baudrillard's conception of 'simulation' is much more nuanced. In his 1981 book Simulacra and Simulation, Baudrillard puts forward his theory that signs have come to constitute and replace reality."
                        imageUrl="/Issue-1/Images/life-simulators_cover.png"
                        articleUrl="/issue-1/hyperreality-cultural"
                    />
                    <ArticlePreview
                        id="article5"
                        title="Does Liberalism Understand People?"
                        author="Max Abubucker"
                        previewText="Since the end of World War II, liberalism has been the dominant political philosophy of Western nations. Recently, however, liberalism in the United States and across the globe has been failing. We are experiencing widespread discontent with public institutions and the rise of populism and authoritarianism. In this context, liberalism can be questioned and criticized from many directions."
                        imageUrl="/Issue-1/Images/does-liberalism_cover.png"
                        articleUrl="/issue-1/does-liberalism"
                    />
                    <ArticlePreview
                        id="article6"
                        title="Gossiping Tweens & Ending Regimes: The Promises & Pitfalls of the Doctrine of Double Effect"
                        author="Karis Morasch"
                        previewText="Every day of our lives, we are presented with choices. Some are as small as how much creamer to put in your morning coffee, while others, perhaps deciding whether to forgive a friend in an argument or weighing how mad your roommate will be if you eat the last of their chips, have consequences that directly affect the lives of others."
                        imageUrl="/Issue-1/Images/gossiping-tweens_cover.png"
                        articleUrl="/issue-1/gossiping-tweens"
                    />
                </div>
            </ContentsContainer>
            <FloatingBar showAbout={true} showLatest={false} />
            <Footer />
        </MainContainer>
    )
}
