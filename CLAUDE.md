# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains three interconnected projects for "Beetle in a Box", an undergraduate philosophy review publication at Berkeley:

1. **beetle-in-a-box/** - Next.js 15 web application (modern rebuild, in development)
2. **BeetleInABox_Website/** - Static HTML/CSS/JS site. **DEAD — do not modify.** Superseded by the
   Next.js app, which is now the live site. Kept only as reference material for rebuilding pages.
3. **ArticleFormatter/** - Python tool that generated HTML for the old static site. **Not part of live
   work** — reference only; the Next.js admin panel handles .docx uploads now.

## Development Commands

### beetle-in-a-box (Next.js App)
```bash
cd beetle-in-a-box
bun dev          # Start development server (uses Turbopack)
bun build        # Build for production (uses Turbopack)
bun start        # Start production server
bun run lint     # Run ESLint
```

**Testing Commands**:
```bash
bun test              # Run all tests
bun test:watch        # Run tests in watch mode
bun test:coverage     # Run tests with coverage report
```

**Database Commands**:
```bash
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create and apply migrations
npx prisma db push       # Push schema changes (prototyping)
npx prisma generate      # Generate Prisma Client
```

**Note**: Use `npx` for Prisma commands (not `bun`) to ensure proper `.env` file loading.

**Important**: `package.json` includes a `postinstall` script that runs `prisma generate` automatically after dependencies are installed. This ensures Prisma Client types are generated during deployment.

The Next.js app runs on http://localhost:3000 by default. Uses Bun as the package manager, not npm.

### ArticleFormatter (Python Tool)
```bash
cd ArticleFormatter
python main.py <path_to_json>
```

Takes a JSON config file (see `templates/infoTemplate.json` for schema) and generates HTML files in the `output/` directory. Requires the `docx2txt` package.

## Architecture

### beetle-in-a-box (Next.js App)

**Tech Stack**:
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Runtime**: Bun
- **UI**: React 19
- **Styling**: SCSS modules
- **Database**: PostgreSQL with Prisma ORM
- **Build Tool**: Turbopack
- **Testing**: Bun's built-in test runner

**Project Structure**:
```
beetle-in-a-box/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Homepage (Issue 1)
│   ├── about/               # About page
│   ├── admin/               # Admin panel (password protected)
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── login/               # Login page
│   │   │   └── page.tsx
│   │   ├── issues/              # Issue management
│   │   └── articles/            # Article management
│   ├── issue/               # Issue pages
│   │   └── [number]/        # Dynamic issue route
│   │       ├── page.tsx         # Issue listing page
│   │       └── [articleFileName]/  # Dynamic article route
│   │           └── page.tsx     # Article detail page
│   ├── api/                 # REST API routes (protected)
│   │   ├── auth/            # Authentication
│   │   │   ├── login/route.ts   # POST login
│   │   │   └── logout/route.ts  # POST logout
│   │   ├── issues/          # Issue CRUD (protected)
│   │   │   ├── route.ts         # POST, GET
│   │   │   └── [id]/route.ts    # GET, PUT, DELETE
│   │   └── articles/        # Article CRUD (protected)
│   │       ├── route.ts         # POST, GET
│   │       └── [id]/route.ts    # GET, PUT, DELETE
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── middleware.ts            # Auth middleware for protected routes
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   │   ├── Title.tsx        # Page/article titles
│   │   ├── Subheader.tsx    # Section headings
│   │   ├── Text.tsx         # Body text
│   │   └── Link.tsx         # Styled links
│   ├── article/             # Article-specific components
│   │   ├── ArticleContainer.tsx
│   │   ├── ArticleTitle.tsx
│   │   ├── ArticleAuthor.tsx
│   │   ├── ArticleContent.tsx
│   │   ├── ArticleHtmlContent.tsx   # Converts HTML to React with safe Image components
│   │   └── FootnoteHandler.tsx      # Client-side footnote click handling
│   ├── issue/               # Issue listing components
│   │   ├── ContentsContainer.tsx
│   │   ├── IssueCover.tsx
│   │   ├── ArticlePreview.tsx
│   │   ├── IssueListItem.tsx        # Horizontal issue card for archive listing
│   │   ├── IssueListContainer.tsx   # Wrapper container for issue lists
│   └── layout/              # Layout components
│       ├── NavBar.tsx
│       ├── Footer.tsx
│       ├── FloatingBar.tsx
│       └── MainContainer.tsx
├── utils/                   # Utility functions
│   ├── prisma.ts           # Prisma client singleton
│   ├── prisma-test.ts      # Mocked Prisma for testing
│   ├── auth.ts             # JWT verification
│   ├── file-upload.ts      # File validation & upload
│   ├── docx-utils.ts       # .docx to HTML conversion
│   └── text-utils.ts       # HTML entity utilities
├── tests/                   # Test files (63 tests)
│   ├── api/                # API tests (32 tests)
│   │   ├── issues.test.ts      # 14 tests
│   │   └── articles.test.ts    # 18 tests
│   └── utils/              # Utility tests (31 tests)
│       ├── file-upload.test.ts  # 13 tests
│       ├── docx-utils.test.ts   # 11 tests
│       └── text-utils.test.ts   # 7 tests
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma        # Prisma schema (Issue & Article models)
│   └── migrations/          # Database migrations
├── uploads/                 # Mounted volume for user-generated content
│   ├── images/             # Uploaded issue & article images (served via /api/static/images)
│   └── articles/           # Uploaded .docx files (served via /api/static/articles)
├── public/                  # Static assets (favicon, robots.txt, etc.)
├── scripts/                 # Utility scripts
│   ├── seed-issue-1.ts      # Database seeding script
│   ├── clear-database.ts    # Clear database and uploads
│   ├── seed-docx/          # Sample .docx files for seeding
│   └── seed-images/        # Sample images for seeding
└── package.json            # Dependencies
```

**API Routes**:

All API routes accept and return JSON, with file uploads via FormData.

*Issues API*:
- `POST /api/issues` - Create issue (FormData: title, number, date, published, imageArtist?, image?, pdf?)
  - Saves cover image to `/uploads/images/` (optional)
  - Saves PDF to `/uploads/pdfs/` (optional)
  - Stores paths in database as `imageUrl`, `imageArtist`, and `pdfUrl`
- `GET /api/issues?published=true|false` - List issues
- `GET /api/issues/:id` - Get single issue with articles
- `PATCH /api/issues/:id` - Update issue (all fields optional, can update imageArtist, image and/or PDF)
- `DELETE /api/issues/:id` - Delete issue (also deletes image and PDF files). Returns `204 No Content`.

*Articles API*:
- `POST /api/articles` - Create article (FormData: issueId, title, author, number, content.docx, image?, subtitle?, shortTitle?, imageArtist?, published)
  - Saves .docx file to `/uploads/articles/` and stores path in database
  - Extracts preview text from .docx for issue listing page
  - Optional `subtitle` field displayed under article title
- `GET /api/articles?issueId=<id>&published=true|false` - List articles
- `GET /api/articles/:id` - Get single article
- `PATCH /api/articles/:id` - Update article (all fields optional, can update .docx file, imageArtist, subtitle)
- `DELETE /api/articles/:id` - Delete article. Returns `204 No Content`.

*Static Files API*:
- `GET /api/static/images/[filename]` - Serve uploaded images (transparently rewired from `/images/*`)
- `GET /api/static/articles/[filename]` - Serve uploaded .docx files (transparently rewired from `/articles/*`)
  - These routes are transparent to the browser via Next.js rewrites
  - Files are served with immutable caching headers (max-age: 31536000)
  - Supports all image formats and .docx files

*Authors API*:
- `GET /api/authors` - List all authors with article counts
- `POST /api/authors` - Create new author (JSON: name, bio?) - slug auto-generated
- `GET /api/authors/:id` - Get single author with all published articles
- `PATCH /api/authors/:id` - Update author (JSON: name?, bio?) - slug regenerated if name changes
- `DELETE /api/authors/:id` - Delete author (fails if author has articles). Returns `204 No Content`.
- `GET /api/authors/by-slug/:slug` - Get author by URL slug with all published articles

**Conventions**: partial updates use `PATCH` on every resource; `DELETE` returns `204 No Content` with no body on success. `utils/api-client.ts` therefore does not parse a response body after a successful delete.

*Auth API*:
- `POST /api/auth/login` - Login with password, returns JWT cookie
- `POST /api/auth/logout` - Logout and clear cookie

**Public Pages**:
- `GET /` - Homepage: Displays the latest issue with all articles in full grid layout
- `GET /archive` - Archive page: Lightweight list of past issues using `IssueListItem` cards (excludes latest issue)
  - Each card shows thumbnail, issue number, title, date, and article count
  - Two buttons per card: "Visit" (navigates to `/issue/[number]`) and "Download PDF" (if PDF available)
  - PDF downloads available if issue has pdfUrl set
- `GET /issue/[number]` - Issue detail page: Full article listing for a specific issue (layout mirrors homepage)
  - Displays issue title, cover image (with artist attribution if set), and all articles in grid layout
  - No PDF download button (PDF downloads only available on archive page)
  - Returns 404 if issue is not published or doesn't exist
- `GET /issue/[number]/[fileName]` - Article detail page: Full article content with footnote navigation
- `GET /author/[slug]` - Author detail page: Grid of all articles by author across all issues (slug format: "name-shortid")
- `GET /about` - About page: Two-column layout with publication description and editorial board (left), "On the name" story (right), stacking below 768px
- `GET /connect` - Connect page: Contact links (email, Instagram, print-form submission, apply link)
- `GET /apply` - Permanently redirects to `/connect` (308 redirect via `next.config.ts`)

**Admin Pages** (password-protected):
- `GET /admin` - Admin dashboard
- `GET /admin/login` - Login page
- `GET /admin/issues` - List all issues with CRUD actions
- `GET /admin/issues/new` - Create new issue form
- `GET /admin/issues/:id/edit` - Edit issue form
- `GET /admin/articles` - List all articles with CRUD actions (filtered by issue)
- `GET /admin/articles/new` - Create new article form
- `GET /admin/articles/:id/edit` - Edit article form
- `GET /admin/authors` - List all authors with CRUD actions
- `GET /admin/authors/new` - Create new author form
- `GET /admin/authors/:id/edit` - Edit author form

**All admin routes (`/admin/*`) and all API routes are protected, but via two different mechanisms — see below.**

**Authentication**:

The admin panel and API routes are protected with password authentication, enforced by two separate mechanisms:

- **Password Storage**: Admin password is stored as a bcrypt hash in `.env` (`ADMIN_PASSWORD_HASH`)
- **Session Management**: JWT tokens stored in httpOnly cookies (7-day expiration)
- **Middleware Protection**: `middleware.ts` enforces authentication for `/admin/*` and `/api/issues/*` only — its matcher is `['/admin/:path*', '/api/issues/:path*']`. Unauthenticated requests to these paths are redirected to `/admin/login`.
- **Inline Route Protection**: `/api/articles/*` and the `/api/authors/*` mutation routes (`PUT`/`DELETE`, and `POST` on the collection route) are NOT covered by the middleware matcher. Each of these route handlers instead calls `verifyAuth()` directly on the `admin-token` cookie and returns a `401` JSON response if unauthenticated.
- **Login Flow**:
  1. Navigate to `/admin/login`
  2. Enter password
  3. JWT token set in httpOnly cookie
  4. Redirected to admin dashboard
- **Logout**: Click "Logout" button in admin nav to clear session

**Environment Variables Required**:
```
ADMIN_PASSWORD_HASH=\$2b\$10\$... # bcrypt hash of admin password
SESSION_SECRET=your-secret-key    # JWT signing secret
```

**Generating Password Hash**:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));"
```

**Database Schema**:

**IMPORTANT**: Schema changes added `Article.subtitle` and `Author.bio` using `npx prisma db push` (not migrations). Production deployment requires `npx prisma db push` to apply these columns to the live database.

- **Author**: id, name, bio, slug (unique), articles[], createdAt, updatedAt
  - **bio**: Optional author biography text, displayed under author name on author pages
  - **slug**: URL-safe string in format "name-shortid" (e.g., "john-doe-abc123") generated from author name
  - **articles**: Bidirectional relationship to Article model
  - Used for author detail pages at `/author/[slug]` to display all articles by author
- **Issue**: id, title, number (unique), date, imageUrl, imageArtist, pdfUrl, published, articles[], createdAt, updatedAt
  - **date**: `DateTime` - determines the month/year shown in page headers, formatted for display as "MONTH YEAR" (e.g., "AUGUST 2025", "JANUARY 2026") via `formatIssueDate()`
  - **imageUrl**: URL path to cover image (e.g., `/images/issue-cover-1234567890.jpeg`), served via `/api/static/images/`
  - **imageArtist**: Artist name for cover image attribution (optional, displayed as "Art by [name]" under cover image on issue pages)
  - **pdfUrl**: URL path to PDF file (optional, e.g., `/pdfs/issue-1-1234567890.pdf`), served via `/api/static/pdfs/`, available for download on archive page only
- **Article**: id, title, subtitle, shortTitle, number, imageArtist, imageUrl, contentDocxPath, previewText, fileName, published, issueId, authorId, author?, issue?, createdAt, updatedAt
  - **subtitle**: Optional article subtitle, displayed under title on article pages
  - **author**: Now a bidirectional relationship to Author model (replaces old string author field)
  - **authorId**: Foreign key to Author model (nullable for backward compatibility during migration)
  - **imageArtist**: Artist name for image attribution (optional, displayed as "Art by [name]" under images)
  - **imageUrl**: URL path to image (e.g., `/images/article-1-1234567890.jpeg`), served via `/api/static/images/`
  - **contentDocxPath**: Path to .docx file (e.g., `/articles/article-1-1234567890.docx`), served via `/api/static/articles/`
  - **previewText**: Plain text extracted from .docx for issue listing page
  - Article pages read .docx files from `/uploads/articles/` at runtime

**Utility Functions**:

*file-upload.ts*:
- `validateImageFile(file)` - Validates images (JPEG/PNG/WebP/GIF, max 200MB)
- `validateDocxFile(file)` - Validates .docx files (max 200MB, non-empty)
- `validatePdfFile(file)` - Validates PDF files (application/pdf, max 200MB, non-empty)
- `saveImage(file, issueNumber, prefix)` - Saves the upload as the canonical full-resolution
  original in `/uploads/images/` with a timestamped filename, then warms its derivatives
- `storeOriginal(buffer, mimeType)` - Prepares an upload for storage as the full-resolution
  original: passes bytes through untouched unless the longest edge exceeds
  `MAX_ORIGINAL_DIMENSION` (4000px), in which case it downscales once. GIFs pass through.
  This is not where compression happens
- `saveDocx(file, prefix)` - Saves .docx file to `/uploads/articles/` with timestamped filename
- `savePdf(file, prefix)` - Saves PDF file to `/uploads/pdfs/` with timestamped filename
- `deleteFile(publicPath)` - Deletes file from `/uploads/` directory (e.g., `/images/file.jpg` deletes from `/uploads/images/file.jpg`)

*image-variants.ts*:

Compressed, display-sized copies of uploaded images, generated on demand and cached on
disk under `uploads/images/.variants/`. The `.variants/` directory is gitignored; originals are tracked.

- `getVariant(filename, width)` - WebP derivative at an allowlisted width, generated and
  cached on first request. Returns `null` if sharp is unavailable, so callers fall back to
  the original
- `getBlurDataUrl(filename)` - ~300-byte WebP data URI used as a blur-up placeholder,
  memoised in process and cached on disk
- `warmVariants(filename)` / `deleteVariants(filename)` - generate all derivatives up
  front / remove them when the original is deleted
- `VARIANT_WIDTHS` is an allowlist (`400`, `800`, `1600`). `?w=` comes straight off a URL,
  so an open parameter would let anyone fill the disk with arbitrary sizes
- Served by `GET /images/<file>?w=<width>`. **The bare URL always returns the untouched
  original** - that is what the "open full resolution" links point at
- Uploaded filenames are immutable (timestamped), so derivatives are cached forever
- Backfill existing images with `bun run images:backfill`

**Cover art does not use `next/image`.** The platform image optimizer is a measured
passthrough on the OCF host: a 943 KB PNG requested at `w=640&q=75` with
`Accept: image/webp` returns 943,700 bytes of `image/png` on a fresh cache MISS, while
sharp on that same host produces 33,552 bytes from the same file. It affects `public/`
assets too. `components/ui/CoverImage.tsx` renders a plain `<img srcset>` against these
derivatives instead. Images inside article body text
(`components/article/ArticleHtmlContent.tsx`) still use `next/image` and are unaffected by
this work.

*auth.ts*:
- `verifyAuth(token)` - Verifies JWT token from cookie, returns boolean

*docx-utils.ts*:
- `convertArticleDocx(buffer)` - Converts a single article .docx to HTML, returning `{ content, citations }`
  - `content`: the article body HTML, with footnote reference IDs and onclick handlers added
  - `citations`: HTML for the extracted footnotes/citations (wrapped as clickable footnotes with ID and onclick handler), or `null` if none were found
  - Automatically converts plain text URLs to clickable links
  - Em/en dashes in the source docx are preserved (not downgraded to hyphens)
  - Paragraphs formatted as centered in the source docx emit `<p class="centered">` via mammoth paragraph transform + style map (CSS in globals.css)
  - Inline docx images flow through as base64 data URIs and render centered at natural size (max-width 100%)
  - Floating/text-wrapped images are DROPPED by mammoth — source documents must insert images "in line with text" instead
- `convertPreviewDocx(buffer)` - Extracts plain text preview from .docx
- `generateFileName(title)` - Creates URL-friendly filename (removes common words, uses first 2 words)
- `autolinkUrls(html)` - Converts plain text URLs (http://, https://) to clickable links

*text-utils.ts*:
- `unescapeHtml(text)` - Converts HTML entities (&amp;, &lt;, etc.) to characters
- `truncateText(text, maxLength)` - Truncates text at word boundaries and adds "..." (default: 300 chars)

*author-utils.ts*:
- `generateAuthorSlug(name, id)` - Generates URL-safe slug from author name + 6-char ID prefix (e.g., "john-doe-abc123")
- `extractIdFromSlug(slug)` - Extracts the author ID from a slug string

*date-utils.ts*:
- `getSeasonAndYear()` - Returns current season and year (e.g., "SPRING 2026") based on today's date
- `getCurrentYear()` - Returns the current year as a number
- `formatIssueDate(date)` - Formats a `Date` object or ISO string as uppercase "MONTH YEAR" (e.g., "JANUARY 2026") using UTC to avoid timezone issues
  - The standard formatter for displaying an Issue's `date` field across the site
- `getSeasonFromIssueDate(date)` - Legacy-compatible formatter accepting either a `Date`/ISO string (delegates to `formatIssueDate()`) or a legacy "Month Year" string (e.g., "August 2025"), returning uppercase "MONTH YEAR"
  - Used in page headers to display the month/year of the most recent issue
  - Falls back to the current season/year if a legacy string fails to parse
  - Kept for backwards compatibility; `formatIssueDate()` is preferred for new code

**Article Rendering System**:
- `ArticleTitle.tsx`: Renders article title with optional subtitle underneath
  - Props: `title` (string), `subtitle?` (optional string)
  - Subtitle displayed in smaller font below the main title when present
- `ArticleHtmlContent` component safely converts .docx-generated HTML to React
  - Uses html-react-parser to parse HTML string
  - Converts <img> tags to Next.js Image components for optimization
  - Makes all external links open in new tabs with proper security attributes
  - Preserves footnote functionality via data-footnote-target attributes
- `FootnoteHandler` client component manages interactive footnote navigation
  - Attaches click listeners to footnote links
  - Scrolls to target footnote with 22vh offset for proper viewing
  - Highlights footnotes with yellow background + larger font for 3 seconds
  - Cleans up event listeners on unmount

**Artist Attribution System**:
- Both issue cover images and article images can have optional artist attribution via `imageArtist` field
- Displays "Art by [artist name]" in italic text under images
- **Issue Cover Images** (`components/issue/IssueCover.tsx`):
  - Renders artist attribution below cover image on homepage and issue detail pages
  - Styled with: `font-size: 0.95rem`, italic, gray color (#666)
- **Article Preview Pages** (`components/issue/ArticlePreview.tsx`):
  - Renders artist attribution below image in grid layout
  - Styled with: `font-size: clamp(0.65rem, 1vw, 0.9rem)`, italic, gray color (#666)
- **Article Detail Pages** (`app/issue/[number]/[articleFileName]/page.tsx`):
  - Renders artist attribution immediately below cover image
  - Styled with: `font-size: 0.95rem`, italic, gray color (#666)
- Admin forms allow entering artist name when creating/editing issues and articles

**Author Components and Pages**:
- `ArticleAuthor.tsx`: Renders author name with optional biography underneath
  - Props: `name` (string), `bio?` (optional string), `slug` (string)
  - Author name is a clickable link to `/author/[slug]`
  - Bio displayed in smaller font below the name when present
- `AuthorLink.tsx`: Reusable component that renders a clickable link to author detail page
  - Props: `name` (string), `slug` (string), `className` (optional)
  - Links to `/author/[slug]` where slug format is "name-shortid"
  - Used in `ArticlePreview` and `ArticleAuthor` components
- `app/author/[slug]/page.tsx`: Author detail page showing all articles by author across all issues
  - Displays author name, bio (if present), and grid of all published articles
  - Reuses `ContentsContainer` and `ArticlePreview` components
  - Returns 404 if author not found
  - Shows empty state if author has no articles
- **Author Migration**: `scripts/migrate-authors.ts`
  - One-time script to migrate existing string author values to Author model references
  - Creates Author records for each unique author string
  - Updates Article records to link to new Author records
  - Run with: `bun scripts/migrate-authors.ts`

**Issue List Components** (for archive page and issue browsing):
- `IssueListItem.tsx`: Horizontal card component for displaying issues in a lightweight list
  - Props: `number` (issue number), `title`, `date` (raw date string), `imageUrl`, `articleCount`
  - Layout: Thumbnail image (left ~15vw) + metadata (right: issue number, title, date, article count)
  - Styled with grid layout, responsive typography using `clamp()`
  - Entire card is a clickable link to `/issue/[number]`
  - Hover effect: subtle background change and border highlight
- `IssueListContainer.tsx`: Wrapper component for lists of IssueListItem
  - Props: `children` (list items), `title` (optional section title)
  - Layout: Vertical flex container with consistent spacing (85vw width, 20vh top margin)
  - Used by archive page to display past issues

**FloatingBar Component** (footer navigation):
- `FloatingBar.tsx`: Server component displaying four sticky navigation links at bottom of page
  - Links: "About Us" → `/about`, "Latest" (conditional), "Archive" → `/archive`, "Connect" → `/connect`
  - "Latest" link appears only on past-issue pages (when the current issue number is below the latest published issue, determined by `getLatestIssueNumber()` in utils/issue-utils.ts)
  - "Back to Top" link removed
  - Props: `showLatest` (boolean, passed true only by issue/article pages with older issues)

**UI Component System**:
- All typography is centralized in `components/ui/`
- Components use SCSS modules for styling
- Consistent font families: Playfair Display (headings), Lora (body), Roboto Mono (code)
- Responsive sizing with CSS `clamp()`

**Styling Conventions**:
- Use SCSS modules (`.module.scss`)
- BEM-like naming in class names
- Mobile-first responsive design
- Colors: `#1a1a1a` (text), `#000000` (headings), `white` (background)

**Testing**:
- Bun's built-in test runner (Jest-compatible API, no Jest dependency needed)
- All Prisma calls are mocked (no database access during tests)
- File operations are mocked (no file system access during tests)
- Test files in `tests/` directory (not `__tests__/`)
- 63+ tests with comprehensive coverage
- Run with `bun test` (Bun's native test runner - fully compatible with Jest syntax)
- Imports from `bun:test` (describe, it, expect, spyOn, etc.)
- Uses `spyOn()` for mocking functions, `mockReset()` for cleanup
- No Jest configuration files needed (uses Bun's defaults)

**Error Handling**:
- All API routes return consistent status codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request (missing fields, validation failures)
  - 404: Not Found
  - 409: Conflict (duplicate issue/article numbers)
  - 500: Server Error
- All .docx conversion functions have try-catch error handling
- File validation happens before processing

### ArticleFormatter Workflow

The ArticleFormatter tool converts Word documents to HTML using a template-based system:

1. **Input**: JSON configuration file containing issue metadata and article information
2. **Processing**:
   - Reads article content from `.docx` files and converts to HTML
   - Processes citations/footnotes with interactive linking
   - Generates article preview text
   - Applies HTML templates (`articleTemplate.txt`, `issueTemplate.txt`, etc.)
3. **Output**: Static HTML files in `output/` directory

**Key Classes**:
- `Article`: Stores article metadata (title, author, file paths, etc.) and generates URL-friendly filenames
- `Issue`: Stores issue metadata and contains multiple Article instances

**Template Replacements**: Uses placeholder pattern `{---VARIABLE_NAME---}` in templates:
- Article templates: `{---ARTICLE_TITLE---}`, `{---ARTICLE_AUTHOR---}`, `{---ARTICLE_CONTENT---}`, etc.
- Issue templates: `{---ISSUE_TITLE---}`, `{---ISSUE_DATE---}`, `{---ISSUE_CONTENT_ITEMS---}`, etc.

**Footnote System**: Converts `<sup>` tags to interactive footnotes with bidirectional linking:
- Content footnotes get IDs like `fl1`, `fl2` that link to `f1`, `f2` in citations
- Citation footnotes link back to their references in the article body
- Uses `goToElementWithHighlightModern()` JavaScript function (defined in BeetleInABox_Website/JS/)

### BeetleInABox_Website Structure

Static site with:
- **index.html**: Homepage
- **about.html**: About page
- **issue-X.html**: Issue landing pages with article previews
- **Issue-X/**: Directories containing individual article HTML files
- **CSS/styles.css**: Shared styling
- **JS/**: JavaScript utilities (general.js, devicecheck.js)
- **Images/**: Publication images

All content and code are copyrighted (see templates for copyright notices).

## Relationship Between Projects

**Only `beetle-in-a-box/` is live work.** The Next.js app has replaced the static site and is deployed
(see Deployment below). `BeetleInABox_Website/` and `ArticleFormatter/` are historical reference — do not
clean, refactor, or commit to them. They are separate git repos; changes there are noise, not progress.

**Migration Path**:
1. ArticleFormatter will be adapted to generate data for the Next.js API
2. Content will be stored in PostgreSQL via Prisma
3. Next.js app will serve content dynamically from the database
4. Migration is complete — the Next.js app is live and the static site is retired

## Development Guidelines

1. **Package Manager**: Always use `bun` commands, not `npm` or `yarn`
2. **Database Changes**: Run `bun prisma migrate dev` after schema changes
3. **New Components**: Place in appropriate folder (ui/, article/, issue/, layout/)
4. **Styling**: Use SCSS modules, follow existing naming patterns
5. **Typography**: Use UI components (Title, Text, Link, etc.) for consistency
6. **File Storage**: All uploaded files stored in `/uploads/` directory (preserved across deploys; excluded from the rsync)
   - Images: `/uploads/images/` with timestamped filenames
   - .docx files: `/uploads/articles/` with timestamped filenames
   - URLs in database are like `/images/file.jpg` and `/articles/file.docx` (transparently served via API routes)
7. **Testing**: 
   - Write tests for all new API routes and utilities
   - Use mocked Prisma client from `@/utils/prisma-test`
   - Mock file operations (fs/promises, fs)
   - Tests should never modify database or file system
8. **API Development**:
   - Accept files via FormData
   - Validate all files before processing (validateImageFile, validateDocxFile)
   - Return consistent error status codes
   - Include try-catch error handling
9. **File Validation**:
   - Always validate images before saving
   - Always validate .docx files before processing
   - Return 400 with descriptive error messages
10. **Imports**: Use `@/` alias for imports (e.g., `@/utils/prisma`, `@/components/ui/Title`)
11. **Environment Variables**:
   - **IMPORTANT**: Restart dev server after changing `.env` file
   - Dollar signs (`$`) in `.env` values must be escaped: `\$`
   - Never commit `.env` to git (already in `.gitignore`)
12. **Authentication**:
   - Admin panel and all API routes require authentication
   - Seed scripts accept password as command-line argument (see `scripts/seed-issue-1.ts`)

## Common Tasks

### Adding a New API Endpoint

1. Create route file in `app/api/{resource}/` or `app/api/{resource}/[id]/`
2. Import utilities from `@/utils/`
3. Implement HTTP method handlers (GET, POST, PUT, DELETE)
4. Add validation for required fields
5. Add error handling with try-catch
6. Return appropriate status codes
7. Create test file in `tests/api/`
8. Mock Prisma and file operations
9. Test all success and error cases

### Adding a New Utility Function

1. Create or update file in `utils/`
2. Export function with JSDoc comment
3. Add error handling if needed
4. Create test file in `tests/utils/`
5. Test all edge cases and error scenarios
6. Update this documentation

### Running Tests

```bash
# Run all tests
bun test

# Watch mode for development
bun test:watch

# Generate coverage report
bun test:coverage
```

**Note**: Tests use Bun's test runner, not Jest directly. The command `bun test` runs `bun jest` under the hood.

### Database Migration

```bash
# After changing prisma/schema.prisma:
npx prisma migrate dev --name describe_your_change

# To see database in browser:
npx prisma studio
```

### Seeding the Database

The seed script authenticates with the admin panel before creating content:

```bash
# Locally
bun dev  # in one terminal

# In another terminal
bun scripts/seed-issue-1.ts your-admin-password

# On the OCF host
ssh beetleinabox@vampires.ocf.berkeley.edu
cd ~/myapp/src
bun run db:seed your-admin-password
```

**Prerequisites**:
- Dev server running on http://localhost:3000 (locally) or the `myapp` service running (OCF)
- Admin password (same one used for `ADMIN_PASSWORD_HASH`)
- Article .docx files in `scripts/seed-docx/`
- Article images in `scripts/seed-images/`

**How it works**:
1. Script accepts admin password as command-line argument
2. Calls `/api/auth/login` with the password
3. Receives JWT cookie from response
4. Includes cookie in all subsequent API requests
5. Creates Issue 1 via `/api/issues`
6. Creates 6 articles via `/api/articles`
7. Files are saved to `/uploads/images/` and `/uploads/articles/`

### Clearing the Database

```bash
# Locally
bun run db:clear

# On the OCF host
ssh beetleinabox@vampires.ocf.berkeley.edu
cd ~/myapp/src
bun run db:clear
```

This deletes all articles and issues from the database and removes all uploaded files from `/uploads/`, while preserving the `.gitkeep` files and directory structure.

## Deployment (OCF)

The application deploys to the Berkeley **OCF** app host. Railway is no longer used — ignore any
Railway references elsewhere in older notes.

**Host**: `vampires.ocf.berkeley.edu` (`apphost.ocf.berkeley.edu` is an alias for the same machine —
both resolve to 169.229.226.49). Account: `beetleinabox`. Remote path: `~/myapp/src`.

**Runtime note**: OCF's glibc is too old for Bun, so the deploy installs with `npm`, builds with
`npx next build`, and runs `server.js` under plain Node via `systemctl --user restart myapp`.
`sharp` is an optional dependency for the same reason — if its native binary will not
install there, derivative generation is skipped and originals are served at full size
rather than the build failing. As of 2026-08-04 sharp does load on OCF (libvips 8.18.3).

**Deploying Changes**:
```bash
bash deploy.sh          # from the repo parent directory
```
`deploy.sh` rsyncs the source (excluding `node_modules`, `.next`, `uploads`, `.env`, `.git`, `tests`),
then remotely runs `npm install`, `npx prisma generate`, `npx next build`, and restarts the service.

**Secrets are NOT deployed.** `.env` is deliberately excluded from the rsync, so `SESSION_SECRET`,
`ADMIN_PASSWORD_HASH` and `DATABASE_URL` must be edited in `~/myapp/src/.env` on the host itself.
Changing them locally has no effect on production.

**SSH Access**:
```bash
ssh beetleinabox@vampires.ocf.berkeley.edu
```
The account currently accepts only password auth. Running `ssh-copy-id
beetleinabox@vampires.ocf.berkeley.edu` once authorizes a local key and makes deploys unattended.

**Managing Production Data**:
```bash
ssh beetleinabox@vampires.ocf.berkeley.edu
cd ~/myapp/src
npm run db:clear                    # Clear all data
npx tsx scripts/seed-issue-1.ts <admin-password>
exit
```

**Uploads**: `~/myapp/src/uploads/` holds user-generated content (`images/`, `articles/`, `pdfs/`) and is
excluded from the rsync so deploys never clobber it. Files are served through `/api/static/*` with
immutable caching.

**Live URL** (as of 2026-08-04):

    https://beetleinabox-studentorg-berkeley-edu.apphost.ocf.berkeley.edu

**`beetleinabox.studentorg.berkeley.edu` does NOT resolve** (NXDOMAIN on public resolvers) and is not the
working address, despite being what `deploy.sh` prints on success. OCF's `/etc/ocf/vhost-app.conf` has:

    beetleinabox beetleinabox.studentorg.berkeley.edu - - [dev]

The `[dev]` flag means OCF serves the site only at the long dashed alias above. Getting the short hostname
working needs OCF to drop that flag AND a campus DNS record — neither is doable from this repo.

**How to tell whether the app is actually running** — do NOT judge by the public hostname or by
`localhost:3000`; both will mislead you. The app binds a **unix socket**, not a TCP port:

```bash
ssh beetleinabox@apphost.ocf.berkeley.edu
systemctl --user is-active myapp
curl --unix-socket /srv/apps/beetleinabox/beetleinabox.sock http://localhost/   # expect 200
journalctl --user -u myapp -n 40 --no-pager
```
`~/myapp/run` sets `PORT=/srv/apps/$USER/$USER.sock`, and `server.js` passes a non-numeric PORT straight to
`server.listen()`, which makes it a socket path. Believing "nothing is deployed" because port 3000 is dead
has already caused one wrong call about whether a live vulnerability was exposed.

**SSH is key-authorized** — `ssh beetleinabox@apphost.ocf.berkeley.edu` works without a password, so
deploys and diagnostics can run unattended.

## Troubleshooting

- **Article images not appearing or appearing blank**: Inline images in .docx files are supported and flow through as base64 data URIs. Floating/text-wrapped images (with text wrapping settings in Word) are dropped by mammoth — remove text wrapping and insert images "in line with text" instead
- **Tests failing with mock errors**: Make sure you're using `bun test`, not `jest` directly
- **Database connection issues**: Check DATABASE_URL in .env, ensure PostgreSQL is running
- **Prisma Studio not loading env**: Use `npx prisma studio` instead of `bun prisma studio`
- **Turbopack warnings**: Ignore warnings about package-lock.json, we use bun.lockb
- **Import errors**: Use `@/` alias for all imports from project root
- **File upload issues**: Ensure files are validated before processing
- **Prisma Client errors**: Run `npx prisma generate` to regenerate client
- **Login returns 500 with "Missing ADMIN_PASSWORD_HASH or SESSION_SECRET" (OCF)**:
  The bcrypt hash contains `$` characters, and TWO different parsers read `.env` on the server:
  1. `~/myapp/run` does `source ~/myapp/src/.env` (bash), and
  2. Next.js re-parses `.env` at startup through `dotenv-expand`.
  Store the hash **unquoted and `\$`-escaped** (`ADMIN_PASSWORD_HASH=\$2b\$10\$...`) — that is the only
  form Next's parser preserves; single quotes, double quotes, and raw all yield an empty string.
  Additionally, `run` must `unset ADMIN_PASSWORD_HASH` after sourcing: if the key is already present in
  `process.env`, Next overwrites it with the empty expansion rather than leaving the shell value alone.
  `SESSION_SECRET` is unaffected because it contains no `$`.
  To diagnose, run on the host from `~/myapp/src`:
  ```bash
  node -e 'const{loadEnvConfig}=require("@next/env");loadEnvConfig(process.cwd(),false);
    console.log((process.env.ADMIN_PASSWORD_HASH||"").length)'   # want 60
  ```
- **Login fails with "Invalid password"**:
  - Restart dev server after changing `.env` file
  - Check that `$` in `ADMIN_PASSWORD_HASH` are escaped: `\$2b\$10\$...`
  - Verify hash length is 60 characters
- **API returns 401/403**: Check that you're logged in at `/admin/login`
- **Seed script fails with auth error**: Ensure you're passing the correct admin password as a command-line argument
- **Images 404 on homepage**:
  - Files must be in `/uploads/images/` and `/uploads/articles/`
  - Database URLs must match paths (e.g., `/images/file.jpg`)
  - Ensure `/api/static/[type]/[filename]` route exists
- **Homepage shows no issues even though they exist in database**:
  - Ensure homepage is dynamic: `export const dynamic = 'force-dynamic'` at top of `app/page.tsx`
  - Same for archive page: `app/archive/page.tsx`
  - Check that issues have `published: true` in database

## Security Notes

**Authentication & Authorization**:
- Admin panel protected with password authentication (bcrypt + JWT)
- All `/admin/*` routes require authentication
- All API mutation routes require authentication, via two mechanisms: middleware (`/api/issues/*`) and inline `verifyAuth()` checks in the route handler (`/api/articles/*`, and the `PUT`/`DELETE`/mutation routes under `/api/authors/*`)
- JWT tokens stored in httpOnly cookies (7-day expiration)
- Middleware (`middleware.ts`) enforces authentication on `/admin/*` and `/api/issues/*` only; other protected API routes check auth inline instead
- Auth routes (`/api/auth/*`) and public routes excluded from protection

**File Upload Security**:
- All file uploads are validated (type and size, max 200MB)
- Image types: JPEG, PNG, WebP, GIF
- .docx files validated before processing to prevent crashes
- FormData properly parsed and type-checked
- File paths sanitized when saving

**General Security**:
- SQL injection prevented by Prisma parameterized queries
- XSS protection via React's built-in escaping
- CORS not configured (add if needed for external access)
- Environment variables used for sensitive data (password hash, JWT secret)
