import React from 'react'
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
 * Parse a CSS text style attribute (e.g. `"height:0.68em;margin-right:0.25em"`)
 * into the object React's `style` prop requires. KaTeX emits inline `style`
 * attributes on nearly every span it renders, and passing that string
 * through verbatim makes React throw ("The `style` prop expects a mapping
 * from style properties to values, not a string").
 */
function parseStyleAttribute(styleText: string): Record<string, string> {
    const style: Record<string, string> = {}

    for (const declaration of styleText.split(';')) {
        const colonIndex = declaration.indexOf(':')
        if (colonIndex === -1) continue

        const property = declaration.slice(0, colonIndex).trim()
        const value = declaration.slice(colonIndex + 1).trim()
        if (!property || !value) continue

        // Custom properties (--foo) are used as-is; everything else is
        // camelCased the way React expects (margin-right -> marginRight).
        const reactProperty = property.startsWith('--')
            ? property
            : property.replace(/-([a-z])/g, (_, letter: string) =>
                  letter.toUpperCase()
              )

        style[reactProperty] = value
    }

    return style
}

/**
 * Convert HTML attributes to React props
 * - class -> className
 * - style -> parsed into a style object (React rejects a raw CSS string)
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
                reactProps['style'] = {
                    ...(reactProps['style'] as Record<string, string>),
                    cursor: 'pointer',
                }
            }
        } else if (key === 'class') {
            reactProps.className = value
        } else if (key === 'style') {
            reactProps['style'] = {
                ...parseStyleAttribute(value),
                ...(reactProps['style'] as Record<string, string>),
            }
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

                // Handle images.
                //
                // Plain <img>, not next/image, for the same reason CoverImage
                // avoids it: the platform optimizer silently passes originals
                // through on the deploy host, so it buys nothing and costs a
                // round trip. mammoth also emits article images as base64
                // data: URIs, which next/image refuses to optimize anyway.
                //
                // Intrinsic dimensions are forwarded only when the source
                // actually supplies them. The previous code defaulted to
                // 800x600, which invents an aspect ratio for every image that
                // has no width/height - and mammoth's output never does - so
                // the browser reserved a wrongly-shaped box and then jumped
                // when the real image loaded. Omitting them is not worse; a
                // wrong ratio is.
                if (name === 'img' && attribs.src) {
                    const width = parseInt(attribs.width)
                    const height = parseInt(attribs.height)
                    const hasIntrinsicSize =
                        Number.isFinite(width) && Number.isFinite(height)

                    return (
                        <img
                            src={attribs.src}
                            alt={attribs.alt || ''}
                            {...(hasIntrinsicSize ? { width, height } : {})}
                            loading="lazy"
                            decoding="async"
                            style={{ maxWidth: '100%', height: 'auto' }}
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
