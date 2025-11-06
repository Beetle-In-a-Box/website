# Beetle in a Box

Website for UC Berkeley's undergraduate philosophy review publication.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Runtime**: Bun
- **UI Library**: React 19
- **Styling**: SCSS Modules
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Build Tool**: Turbopack
- **Testing**: Jest with Bun

## Prerequisites

- **Bun** - JavaScript runtime and package manager ([Installation Guide](#installing-bun))
- **PostgreSQL** - Relational database ([Installation Guide](#installing-postgresql))

## Getting Started

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
# Create .env file with your database connection
echo 'DATABASE_URL="postgresql://yourusername@localhost:5432/beetle_in_a_box"' > .env

# Create the database
psql -U yourusername -c "CREATE DATABASE beetle_in_a_box;"

# Initialize database with Prisma
bun prisma migrate dev

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

### Application

```bash
bun dev          # Start development server with Turbopack
bun build        # Build for production
bun start        # Start production server
bun run lint     # Run ESLint
```

### Database

```bash
bun prisma studio        # Open Prisma Studio (database GUI)
bun prisma migrate dev   # Create and apply new migration
bun prisma db push       # Push schema changes without migration (prototyping)
bun prisma generate      # Regenerate Prisma Client
bun prisma migrate reset # Reset database and rerun all migrations
```

### Testing

```bash
bun test              # Run all tests
bun test:watch        # Run tests in watch mode
bun test:coverage     # Run tests with coverage report
```

## Project Structure

```
beetle-in-a-box/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Homepage (Issue 1 listing)
│   ├── about/               # About page
│   ├── issue-1/             # Issue 1 article pages
│   ├── api/                 # API routes
│   │   ├── issues/          # Issue CRUD endpoints
│   │   │   ├── route.ts         # POST /api/issues, GET /api/issues
│   │   │   └── [id]/route.ts    # GET/PUT/DELETE /api/issues/:id
│   │   └── articles/        # Article CRUD endpoints
│   │       ├── route.ts         # POST /api/articles, GET /api/articles
│   │       └── [id]/route.ts    # GET/PUT/DELETE /api/articles/:id
│   ├── layout.tsx           # Root layout with metadata
│   └── globals.css          # Global styles and fonts
│
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   │   ├── Title.tsx        # Large headings (Playfair Display)
│   │   ├── Subheader.tsx    # Section headings
│   │   ├── Text.tsx         # Body text (Lora)
│   │   └── Link.tsx         # Styled links with variants
│   │
│   ├── article/             # Article-specific components
│   │   ├── ArticleContainer.tsx    # Article page wrapper
│   │   ├── ArticleTitle.tsx        # Article title
│   │   ├── ArticleAuthor.tsx       # Author attribution
│   │   ├── ArticleContent.tsx      # Article body
│   │   ├── Footnote.tsx            # Citation/footnote
│   │   └── FootnoteLink.tsx        # In-text footnote links
│   │
│   ├── issue/               # Issue listing components
│   │   ├── ContentsContainer.tsx   # Issue page wrapper
│   │   ├── IssueCover.tsx          # Cover image + TOC
│   │   └── ArticlePreview.tsx      # Article preview card
│   │
│   └── layout/              # Layout components
│       ├── NavBar.tsx              # Top navigation bar
│       ├── Footer.tsx              # Footer with copyright
│       ├── FloatingBar.tsx         # Floating action bar
│       └── MainContainer.tsx       # Page container
│
├── utils/                   # Utility functions
│   ├── prisma.ts           # Prisma client singleton
│   ├── prisma-test.ts      # Mocked Prisma for testing
│   ├── file-upload.ts      # Image & .docx validation, file saving
│   ├── docx-utils.ts       # .docx to HTML conversion
│   └── text-utils.ts       # HTML entity unescaping
│
├── tests/                   # Test files
│   ├── api/                # API endpoint tests
│   │   ├── issues.test.ts      # Issues API tests (14 tests)
│   │   └── articles.test.ts    # Articles API tests (18 tests)
│   └── utils/              # Utility function tests
│       ├── file-upload.test.ts  # File validation tests (13 tests)
│       ├── docx-utils.test.ts   # Filename generation tests (11 tests)
│       └── text-utils.test.ts   # HTML unescape tests (7 tests)
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
│
├── public/
│   └── Issue-{n}/          # Static assets per issue
│       └── Images/         # Article images and covers
│
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Jest setup file
└── package.json
```

## API Routes

### Issues API

**POST /api/issues** - Create a new issue
- Body: FormData with `title`, `number`, `date`, `published`, optional `image`
- Returns: Created issue object (201) or error (400/409/500)

**GET /api/issues** - Get all issues
- Query: `?published=true|false` (optional)
- Returns: Array of issues with articles

**GET /api/issues/:id** - Get single issue
- Returns: Issue with articles (200) or error (404)

**PUT /api/issues/:id** - Update issue
- Body: FormData with fields to update
- Returns: Updated issue (200) or error (400/404/500)

**DELETE /api/issues/:id** - Delete issue
- Returns: Success message (200) or error (404/500)

### Articles API

**POST /api/articles** - Create a new article
- Body: FormData with `issueId`, `title`, `author`, `number`, `content` (.docx), `preview` (.docx), optional `citations` (.docx), `shortTitle`, `image`, `published`
- Returns: Created article object (201) or error (400/404/409/500)

**GET /api/articles** - Get all articles
- Query: `?issueId=<id>` and/or `?published=true|false` (optional)
- Returns: Array of articles with issue data

**GET /api/articles/:id** - Get single article
- Returns: Article with issue (200) or error (404)

**PUT /api/articles/:id** - Update article
- Body: FormData with fields to update (files optional, keeps existing if not provided)
- Returns: Updated article (200) or error (400/404/500)

**DELETE /api/articles/:id** - Delete article
- Returns: Success message (200) or error (404/500)

## Database Schema

### Issue Model
- `id` - Unique identifier (cuid)
- `title` - Issue title (e.g., "Issue 1")
- `number` - Issue number (unique)
- `date` - Publication date
- `imageUrl` - Cover image URL/path
- `published` - Publication status
- `articles` - Related articles
- `createdAt` / `updatedAt` - Timestamps

### Article Model
- `id` - Unique identifier (cuid)
- `title` - Article title
- `shortTitle` - Optional shortened title
- `number` - Article number within issue
- `author` - Author name
- `imageUrl` - Cover image URL/path
- `content` - Article HTML content
- `citations` - Footnotes/citations HTML
- `previewText` - Preview for issue page
- `fileName` - URL-friendly filename
- `published` - Publication status
- `issueId` - Reference to Issue
- `createdAt` / `updatedAt` - Timestamps

## Utility Functions

### file-upload.ts
- `validateImageFile(file)` - Validates image files (JPEG, PNG, WebP, GIF, max 10MB)
- `validateDocxFile(file)` - Validates .docx files (max 10MB)
- `saveImage(file, issueNumber, prefix)` - Saves uploaded images to public directory

### docx-utils.ts
- `convertArticleDocx(buffer)` - Converts .docx to HTML with footnote links
- `convertCitationsDocx(buffer)` - Converts citations .docx to clickable footnotes
- `convertPreviewDocx(buffer)` - Extracts plain text preview from .docx
- `generateFileName(title)` - Generates URL-friendly filename from title

### text-utils.ts
- `unescapeHtml(text)` - Converts HTML entities to characters

## UI Component System

All typography uses centralized UI components for consistency:

### Title
```tsx
import Title from '@/components/ui/Title';
<Title>My Title</Title>
```

### Text
```tsx
import Text from '@/components/ui/Text';
<Text indent>Body text with indent</Text>
<Text as="p">Paragraph text</Text>
```

### Link
```tsx
import Link from '@/components/ui/Link';
<Link href="/about" variant="bold">Bold Link</Link>
<Link onClick={handleClick}>Clickable Link</Link>
```

### Subheader
```tsx
import Subheader from '@/components/ui/Subheader';
<Subheader onClick={handleClick}>Section Header</Subheader>
```

## Testing

The project includes comprehensive test coverage (63 tests, 147 assertions):

### API Tests
- **Issues API** (14 tests): CRUD operations, validation, error handling
- **Articles API** (18 tests): CRUD operations, .docx processing, validation

### Utility Tests
- **file-upload** (13 tests): Image/docx validation, file saving
- **docx-utils** (11 tests): Filename generation
- **text-utils** (7 tests): HTML entity unescaping

All tests use mocked Prisma client and file operations - **no database or file system changes occur during testing**.

## Styling Conventions

- **SCSS Modules**: Each component has a corresponding `.module.scss` file
- **Naming**: Use descriptive class names (e.g., `.articleContainer`, `.previewTitle`)
- **Typography**:
  - Headings: Playfair Display
  - Body: Lora
  - Code/Mono: Roboto Mono
- **Colors**:
  - Text: `#1a1a1a`
  - Headings: `#000000`
  - Background: `white`
- **Responsive**: Use `clamp()` for fluid typography

## Environment Variables

Required in `.env`:

```bash
DATABASE_URL="postgresql://username@localhost:5432/beetle_in_a_box"
```

Replace `username` with your PostgreSQL username (often your system username on macOS/Linux).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Bun Documentation](https://bun.sh/docs)
- [SCSS Documentation](https://sass-lang.com/documentation)

---

## Installation Guides

### Installing Bun

#### macOS/Linux
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart your terminal or source your shell config
source ~/.bashrc  # or ~/.zshrc

# Verify installation
bun --version
```

#### Windows
Bun works best on Windows with WSL (Windows Subsystem for Linux).

1. Install WSL: `wsl --install`
2. Open WSL terminal
3. Run the Linux installation command above

Visit [bun.sh](https://bun.sh) for more installation options.

### Installing PostgreSQL

#### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Access PostgreSQL CLI
psql postgres

# Create database (in psql CLI)
CREATE DATABASE beetle_in_a_box;

# Exit psql
\q
```

#### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Access PostgreSQL CLI
sudo -u postgres psql

# Create database (in psql CLI)
CREATE DATABASE beetle_in_a_box;

# Exit psql
\q
```

#### Windows
1. Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Remember the password you set for the `postgres` user

After installation:
```bash
# Open Command Prompt or PowerShell
# Access PostgreSQL CLI
psql -U postgres

# Create database (in psql CLI)
CREATE DATABASE beetle_in_a_box;

# Exit psql
\q
```

**Note**: On macOS/Linux, your default PostgreSQL user is usually your system username. On Windows, it's typically `postgres`.

---

## License

Copyright © 2025 Beetle in a Box. All Rights Reserved.
