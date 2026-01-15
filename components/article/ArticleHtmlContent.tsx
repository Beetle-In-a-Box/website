import React from 'react'
import Image from 'next/image'
import parse, {
    domToReact,
    HTMLReactParserOptions,
    Element,
    DOMNode,
} from 'html-react-parser'

interface ArticleHtmlContentProps {
    html: string
}

/**
 * Convert HTML attributes to React props
 * - class -> className
 * - data-footnote-target -> preserved for client-side handling
 */
function convertAttributesToReactProps(attribs: { [key: string]: string }) {
    const reactProps: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(attribs)) {
        if (key === 'onclick') {
            // Extract element ID from onclick="goToElementWithHighlightModern('f1')"
            const match = value.match(
                /goToElementWithHighlightModern\('([^']+)'\)/
            )
            if (match && match[1]) {
                // Store as data attribute for client-side script to handle
                reactProps['data-footnote-target'] = match[1]
                reactProps['style'] = { cursor: 'pointer' }
            }
        } else if (key === 'class') {
            reactProps.className = value
        } else {
            reactProps[key] = value
        }
    }

    return reactProps
}

/**
 * Component that safely converts HTML content to React components
 * - Converts <img> to Next Image components
 * - Makes all links open in new tabs
 * - Preserves footnote functionality via data attributes
 */
export default function ArticleHtmlContent({ html }: ArticleHtmlContentProps) {
    const options: HTMLReactParserOptions = {
        replace: domNode => {
            if (domNode instanceof Element) {
                const { name, attribs, children } = domNode

                // Convert HTML attributes to React props
                const reactProps = convertAttributesToReactProps(attribs)

                // Handle images: convert to Next Image
                if (name === 'img' && attribs.src) {
                    return (
                        <Image
                            src={attribs.src}
                            alt={attribs.alt || ''}
                            width={parseInt(attribs.width) || 800}
                            height={parseInt(attribs.height) || 600}
                            style={{ width: '100%', height: 'auto' }}
                        />
                    )
                }

                // Handle links: add target="_blank"
                if (name === 'a') {
                    return (
                        <a
                            {...reactProps}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {domToReact(children as DOMNode[], options)}
                        </a>
                    )
                }

                // Handle elements with data-footnote-target or className
                if (
                    reactProps['data-footnote-target'] ||
                    reactProps.className
                ) {
                    // Use React.createElement to avoid JSX namespace issues
                    return React.createElement(
                        name,
                        reactProps,
                        domToReact(children as DOMNode[], options)
                    )
                }
            }
        },
    }

    return <>{parse(html, options)}</>
}
