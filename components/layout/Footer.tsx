import { getCurrentYear } from '@/utils/date-utils'
import styles from './Footer.module.scss'

export default function Footer() {
    const year = getCurrentYear()
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div>
                    <p>
                        Copyright © {year} Beetle in a Box | All Rights Reserved
                    </p>
                    <p>Website made by Leo Abubucker and Michael Slain</p>
                    <p>
                        Disclaimer:
                        <i>
                            {' '}
                            We are a student group acting independently of the
                            University of California. We take full
                            responsibility for our organization and this web
                            site.
                        </i>
                    </p>
                </div>
                <a
                    href="https://www.ocf.berkeley.edu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ocfLink}
                >
                    {/*
                        Plain <img> rather than next/image: this is a remote SVG,
                        and next/image declines to optimize SVG anyway (it emits a
                        direct src and skips the optimizer entirely). Going through
                        it bought nothing and required a remotePatterns entry in
                        next.config just to permit a fetch that never happened.

                        https, not http: the site is served over TLS, so an http
                        image is mixed content that browsers either auto-upgrade or
                        block outright. The OCF serves this over https already.
                    */}
                    <img
                        src="https://www.ocf.berkeley.edu/hosting-logos/ocf-hosted-penguin.svg"
                        alt="Hosted by the OCF"
                        width={88}
                        height={31}
                        loading="lazy"
                        decoding="async"
                    />
                </a>
            </div>
        </footer>
    )
}
