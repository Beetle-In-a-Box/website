# Beetle in a Box - Next.js Application

A modern web application for UC Berkeley's undergraduate philosophy review publication.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Runtime**: Bun
- **UI Library**: React 19
- **Styling**: SCSS Modules
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Build Tool**: Turbopack

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

## Project Structure

```
beetle-in-a-box/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Homepage (Issue 1 listing)
│   ├── about/               # About page
│   ├── issue-1/             # Issue 1 article pages
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
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration history
│
├── public/
│   └── Issue-1/            # Static assets for Issue 1
│       └── Images/
│
└── package.json
```

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
