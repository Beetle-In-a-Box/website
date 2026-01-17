/**
 * This script generates .docx files for Issue 2 articles with sample content
 * Run with: bun scripts/generate-issue-2-docx.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import HTMLtoDOCX from 'html-to-docx'
import { fixHTMLForDocx } from './fix-html-for-docx'

const SEED_DOCX_PATH = join(process.cwd(), 'scripts', 'seed-docx')

interface ArticleContent {
    fileName: string
    paragraphs: string[]
    endnotes: string[]
}

const articles: ArticleContent[] = [
    {
        fileName: 'ethics-artificial',
        paragraphs: [
            'As artificial intelligence systems become increasingly sophisticated, we face a fundamental philosophical question: Can machines be moral agents? This question has profound implications for how we design, deploy, and regulate AI systems in society.',
            'Traditional moral philosophy assumes that moral agency requires consciousness, intentionality, and the capacity for rational deliberation. If AI lacks these properties, then it cannot be a genuine moral agent, no matter how complex its decision-making algorithms become.',
            'However, functionalist approaches to mind suggest that what matters is not the substrate of thought, but its functional organization. If an AI system can reliably distinguish right from wrong, weigh competing values, and act accordingly, does it matter whether it has phenomenal consciousness?',
            'Consider autonomous vehicles faced with trolley problem scenarios. These systems must make life-or-death decisions without human intervention. Should we hold them morally responsible for their choices, or does responsibility ultimately rest with their human designers and operators?',
            'Some philosophers argue for a spectrum of moral agency rather than a binary distinction. Perhaps advanced AI systems occupy a middle ground between fully responsible agents and mere tools—what we might call "quasi-agents" deserving of some but not all moral consideration.',
            'The answer to this question will shape our approach to AI ethics, liability law, and the future of human-machine collaboration.',
        ],
        endnotes: [
            'Floridi, L., & Sanders, J. W. (2004). "On the Morality of Artificial Agents." Minds and Machines, 14(3), 349-379.',
            'Dennett, D. C. (1987). The Intentional Stance. Cambridge, MA: MIT Press.',
            'Wallach, W., & Allen, C. (2009). Moral Machines: Teaching Robots Right from Wrong. Oxford University Press.',
        ],
    },
    {
        fileName: 'meaning-absurd',
        paragraphs: [
            'Albert Camus famously declared that the fundamental question of philosophy is whether life is worth living. For Camus, this question arises from the confrontation between human beings—who crave meaning, order, and purpose—and a universe that appears indifferent to these desires.',
            'This tension is what Camus calls "the Absurd." We are meaning-seeking creatures in a meaningless cosmos. The realization of this mismatch could lead to nihilistic despair. Yet Camus argues that we must imagine Sisyphus happy.',
            "The myth of Sisyphus, condemned to eternally push a boulder uphill only to watch it roll back down, serves as Camus's central metaphor. Like Sisyphus, we face repetitive struggles that seem to lead nowhere. But meaning, Camus suggests, is not found in transcendent purposes—it is created through our defiant engagement with existence itself.",
            'This perspective rejects both the escapism of suicide and the false hope of religious or metaphysical consolation. Instead, it calls for lucid awareness of our situation combined with passionate involvement in life. We must embrace the struggle itself.',
            "Contemporary existentialists have extended Camus's framework, arguing that meaning-making is an active, creative process. We are not passive recipients of cosmic meaning but active authors of our own significance through the projects we choose and the commitments we maintain.",
            'The question then becomes not "Why is there meaning?" but "How shall we create meaning?" This shift transforms the problem of absurdity from a metaphysical crisis into an ethical opportunity.',
        ],
        endnotes: [
            'Camus, A. (1955). The Myth of Sisyphus. New York: Vintage Books.',
            'Nagel, T. (1971). "The Absurd." The Journal of Philosophy, 68(20), 716-727.',
            'Sartre, J. P. (1946). Existentialism Is a Humanism. Paris: Éditions Nagel.',
        ],
    },
    {
        fileName: 'free-will',
        paragraphs: [
            'Recent advances in neuroscience have reignited ancient debates about free will. Brain imaging studies suggest that neural activity predicting a decision can occur several seconds before we become consciously aware of making that choice.',
            'These findings, particularly Benjamin Libet\'s famous experiments from the 1980s, seem to challenge our intuitive sense of authorship over our actions. If the brain has already "decided" before conscious awareness kicks in, are we truly free agents or merely witnesses to predetermined neural processes?',
            "However, the relationship between neural determinism and free will is more complex than it first appears. Compatibilist philosophers argue that free will doesn't require causal independence but rather the absence of external coercion and the presence of rational deliberation.",
            'Daniel Dennett suggests that we should think of free will as a biologically evolved capacity for self-control and future planning, not as some mysterious power to transcend the laws of nature. On this view, the relevant question is not whether our choices are determined, but whether they flow from our own values and reasoning.',
            'Moreover, recent research on neuroplasticity shows that conscious deliberation can reshape neural pathways over time. While individual decisions may be influenced by prior neural states, our patterns of thought and reflection can modify the very brain structures that generate future decisions.',
            'The free will debate thus reveals a tension between our phenomenology—the felt sense of choosing—and our scientific understanding of neural causation. Resolving this tension may require revising both our folk psychology and our interpretation of neuroscientific data.',
        ],
        endnotes: [
            'Libet, B., Gleason, C. A., Wright, E. W., & Pearl, D. K. (1983). "Time of Conscious Intention to Act in Relation to Onset of Cerebral Activity." Brain, 106(3), 623-642.',
            'Dennett, D. C. (2003). Freedom Evolves. New York: Viking.',
            'Mele, A. R. (2009). Effective Intentions: The Power of Conscious Will. Oxford University Press.',
        ],
    },
    {
        fileName: 'identity-persistence',
        paragraphs: [
            'What makes you the same person over time? This ancient puzzle, known as the problem of personal identity, becomes vivid through thought experiments like the Ship of Theseus. If all the planks of a ship are gradually replaced, is it still the same ship?',
            'When applied to persons, this question becomes urgent. Your body completely replaces its cells every seven years. Your memories fade and are reconstructed. Your personality evolves. What persists through these changes to preserve your identity?',
            'One influential answer is psychological continuity theory, developed by philosophers like John Locke and Derek Parfit. On this view, you are the same person as a past individual if there is an overlapping chain of psychological connections—memories, intentions, character traits—linking them to you.',
            'However, psychological theories face challenges. What about cases of amnesia or dramatic personality change? Are you a different person after severe brain injury? Parfit famously argued that personal identity might not be what matters—what we care about is psychological continuity, whether or not a "self" persists.',
            'Biological theories offer an alternative: you are the same person as long as you are the same living organism. This view handles cases of memory loss more easily but struggles with hypothetical scenarios involving brain transplants or uploading consciousness to computers.',
            'Perhaps the deepest lesson is that personal identity is not a simple, all-or-nothing affair. Different criteria (psychological, biological, narrative) may be relevant in different contexts. Understanding these criteria helps us navigate profound questions about life, death, and what matters in survival.',
        ],
        endnotes: [
            'Locke, J. (1689). An Essay Concerning Human Understanding, Book II, Chapter 27.',
            'Parfit, D. (1984). Reasons and Persons. Oxford: Clarendon Press.',
            'Olson, E. T. (1997). The Human Animal: Personal Identity Without Psychology. Oxford University Press.',
        ],
    },
    {
        fileName: 'moral-relativism',
        paragraphs: [
            'Moral relativism—the view that moral truths are relative to cultures, individuals, or frameworks—has become increasingly popular in contemporary discourse. It is often motivated by laudable impulses: tolerance, cultural humility, and recognition of diversity.',
            'However, I will argue that moral relativism, despite its appeal, is ultimately incoherent and practically self-defeating. While we should certainly be humble about our moral knowledge, this humility need not collapse into full-blown relativism.',
            'First, consider the logical problem: if relativism is true, then the claim "moral relativism is true" is itself only relatively true. But then someone who denies relativism is not making a mistake—they are simply operating within a different framework. The relativist thus cannot consistently argue for relativism.',
            'Second, relativism makes moral disagreement impossible. When cultures clash over practices like human sacrifice or gender equality, relativism says they are simply talking past each other—each is correct within their own framework. But this misrepresents the phenomenology of moral debate, where we take ourselves to be disagreeing about what is actually right, not merely expressing cultural preferences.',
            'Third, relativism undermines moral progress. If the Nazis were right within their framework, then criticizing them requires imposing our framework on theirs—which the relativist says we should not do. This is an unacceptable conclusion.',
            'A better alternative is moral objectivism with epistemic humility. We can believe there are objective moral truths while acknowledging that discovering them is difficult and that we might be wrong. This position preserves the possibility of moral debate, progress, and cross-cultural criticism while maintaining appropriate intellectual humility.',
        ],
        endnotes: [
            'Harman, G. (1975). "Moral Relativism Defended." The Philosophical Review, 84(1), 3-22.',
            'Nagel, T. (1986). The View from Nowhere. Oxford: Oxford University Press.',
            'Shafer-Landau, R. (2003). Moral Realism: A Defence. Oxford: Clarendon Press.',
        ],
    },
    {
        fileName: 'consciousness-problem',
        paragraphs: [
            'Why does the physical processing of information in the brain give rise to the felt quality of experience? This is what philosopher David Chalmers calls "the hard problem of consciousness," distinguishing it from the "easy problems" of explaining cognitive functions like memory, attention, and learning.',
            'The hard problem asks: why is there something it is like to see red, taste chocolate, or feel pain? In principle, we could imagine a universe where information processing occurs without any accompanying subjective experience—a universe of "philosophical zombies" who behave exactly like conscious beings but have no inner mental life.',
            'Materialist approaches struggle with this problem. We can explain how neurons fire, how information is integrated, and how the brain generates behavior. But explaining these functional relationships does not explain why they are accompanied by phenomenal experience. There seems to be an explanatory gap between physical processes and subjective qualities.',
            'Some philosophers, like Daniel Dennett, argue that the hard problem rests on an illusion. Once we fully understand the functional organization of consciousness, there will be no residual mystery about experience itself. What seems like an explanatory gap is really just incomplete understanding.',
            'Others, including Chalmers, argue that consciousness might be a fundamental feature of reality, like mass or charge. Just as physics takes some properties as basic and unexplained, perhaps phenomenal experience must be added to our ontological inventory as an irreducible aspect of nature.',
            'This debate matters because how we understand consciousness shapes our view of minds, persons, and moral status. If experience is fundamental, then panpsychism—the view that consciousness is ubiquitous in nature—becomes plausible. If it is emergent from complexity, then sophisticated AI might eventually be conscious. The hard problem thus connects to nearly every area of philosophy.',
        ],
        endnotes: [
            'Chalmers, D. J. (1995). "Facing Up to the Problem of Consciousness." Journal of Consciousness Studies, 2(3), 200-219.',
            'Dennett, D. C. (1991). Consciousness Explained. Boston: Little, Brown and Company.',
            'Nagel, T. (1974). "What Is It Like to Be a Bat?" The Philosophical Review, 83(4), 435-450.',
        ],
    },
]

function generateHTMLContent(article: ArticleContent): string {
    let html = ''

    // Add main content paragraphs
    for (let i = 0; i < article.paragraphs.length; i++) {
        const para = article.paragraphs[i]

        // Add endnote references at strategic points (paragraphs 2 and 4)
        const hasEndnote = i === 2 || i === 4
        const endnoteNum = hasEndnote ? Math.floor(i / 2) + 1 : null

        if (hasEndnote && endnoteNum && article.endnotes[endnoteNum - 1]) {
            html += `<p>${para}<sup class='footnoteLink' id='fl${endnoteNum}'>${endnoteNum}</sup></p>\n`
        } else {
            html += `<p>${para}</p>\n`
        }
    }

    // Add footnote border
    html += `<p><centered class="footnoteBorder">* * *</centered></p>\n`

    // Add endnotes section
    article.endnotes.forEach((note, index) => {
        const num = index + 1
        html += `<p class='footnote' id='f${num}'><sup class='footnoteNumber' id='fn${num}'>${num}</sup> ${note}</p>\n`
    })

    return html
}

async function generateDocxFile(article: ArticleContent) {
    console.log(`Generating ${article.fileName}.docx...`)

    // Generate HTML content
    const htmlContent = generateHTMLContent(article)

    // Fix HTML structure to prevent formatting issues
    const fixedHTML = fixHTMLForDocx(htmlContent)

    // Convert to .docx
    const docxBuffer = (await HTMLtoDOCX(fixedHTML, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
    })) as unknown as Buffer

    // Save to file
    const outputPath = join(SEED_DOCX_PATH, `${article.fileName}.docx`)
    writeFileSync(outputPath, docxBuffer)
    console.log(`✓ Created ${article.fileName}.docx`)
}

async function generateAllDocx() {
    console.log('Generating Issue 2 article .docx files...\n')

    // Create output directory if it doesn't exist
    if (!existsSync(SEED_DOCX_PATH)) {
        mkdirSync(SEED_DOCX_PATH, { recursive: true })
    }

    for (const article of articles) {
        await generateDocxFile(article)
    }

    console.log('\n✅ All .docx files generated successfully!')
    console.log(`Files saved to: ${SEED_DOCX_PATH}`)
}

generateAllDocx()
