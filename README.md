# phantomdrum.com

Website for Phantom Drum's album release "INITIALIZE". Built with Next.js, featuring WebGL animations, interactive 3D scenes, and dynamic content sharing.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **3D Graphics**: Three.js
- **Animations**: GSAP
- **Styling**: Tailwind CSS 4
- **Storage**: Vercel Blob Storage, Upstash Redis
- **TypeScript**: 5

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

Required environment variables:

- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage token for image uploads
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API token
- `NEXT_PUBLIC_SITE_URL` - Public site URL (defaults to https://phantomdrum.com)

Create a `.env.local` file with these variables for local development.

## Scripts

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Asset Generation Scripts

#### `generate-cube-labels.mjs`

Generates Three.js geometry modules from text labels defined in `config/cube-labels.ts`. Converts font glyphs into 3D geometry data for use in cube animations.

**Usage:**

```bash
node scripts/generate-cube-labels.mjs
```

**Outputs:**

- TypeScript geometry modules in `app/generated/labelGeometries/` (one file per label)
- Index file `app/generated/labelGeometries/index.ts` exporting all geometries
- Sentence packs module `config/sentencePacks.generated.ts`

**Configuration:**
Reads from `config/cube-labels.ts`:

- `fontPath` - Path to TTF font file
- `fontSize` - Font size for geometry generation
- `sentencePacks` - Array of sentence pack objects
- `cubeLabels` - Legacy array of label strings

#### `generate-halftone-masks.mjs`

Generates SVG halftone tile patterns for different shapes and dot configurations. Creates reusable tile assets used for halftone effects.

**Usage:**

```bash
node scripts/generate-halftone-masks.mjs
```

**Outputs:**

- SVG files in `public/halftone/` directory
- Files named `halftone-{shape}-r{radius}-s{spacing}.svg`
- Supports shapes: circle, square, octagon, hexagon, triangle
- Generates combinations for radius 1-10 and spacing 1-10 (in 0.5 increments)

**Configuration:**
Uses `HALFTONE_SHAPES` from `app/lib/halftoneAssetKey.js` to determine which shapes to generate.

#### `generate-warped-mask.mjs`

Generates warped halftone pattern images as WebP files. Creates radial warp effects for visual distortion.

**Usage:**

```bash
node scripts/generate-warped-mask.mjs [options]
```

**Options:**

- `width` - Image width (default: 1080)
- `height` - Image height (default: 540)
- `dotRadius` - Dot radius (default: 1)
- `dotSpacing` - Dot spacing (default: 3)
- `warp` - Warp strength, -0.999 to 1 (default: 0.05)
- `crop` - Crop ratio 0-0.45 (default: 0.1)
- `quality` - WebP quality 0-1 (default: 0.2)
- `name` - Output filename prefix (default: "hero")

**Example:**

```bash
node scripts/generate-warped-mask.mjs width=1920 height=1080 dotRadius=2 dotSpacing=5 warp=0.1 name=hero-large
```

**Outputs:**

- WebP file: `public/warped-halftone/halftone-{name}.webp`

#### `generate-warped-vector-mask.mjs`

Generates warped halftone patterns as optimized SVG files. Vector version of the warped mask generator.

**Usage:**

```bash
node scripts/generate-warped-vector-mask.mjs [options]
```

**Options:**

- `width` - SVG width (default: 900)
- `height` - SVG height (default: 600)
- `dotRadius` - Dot radius (default: 2)
- `dotSpacing` - Dot spacing (default: 4)
- `warp` - Warp strength, -0.999 to 1 (default: 0.1)
- `crop` - Crop ratio 0-0.45 (default: 0.2)
- `axis` - Warp axis: "x", "y", or "xy" (default: "xy")
- `name` - Output filename prefix (default: "hero")

**Example:**

```bash
node scripts/generate-warped-vector-mask.mjs width=1200 height=800 axis=xy warp=0.15 name=hero-vector
```

**Outputs:**

- Optimized SVG file: `public/warped-halftone/vector/halftone-{name}.svg`

#### `generate-gradient-mask.mjs`

Generates halftone patterns with gradient transitions from one dot size/spacing to another.

**Usage:**

```bash
node scripts/generate-gradient-mask.mjs [options]
```

**Options:**

- `width` - Image width (default: 1080)
- `height` - Image height (default: 1080)
- `startDotRadius` - Starting dot radius (default: 1)
- `startDotSpacing` - Starting dot spacing (default: 4)
- `endDotRadius` - Ending dot radius (default: 3)
- `endDotSpacing` - Ending dot spacing (default: 8)
- `direction` - Gradient direction: "top-to-bottom", "bottom-to-top", "left-to-right", "right-to-left" (default: "top-to-bottom")
- `crop` - Crop ratio 0-0.45 (default: 0.1)
- `quality` - WebP quality 0-1 (default: 0.35)
- `name` - Output filename prefix (default: "gradient")

**Example:**

```bash
node scripts/generate-gradient-mask.mjs startDotRadius=1 endDotRadius=5 direction=top-to-bottom name=gradient-hero
```

**Outputs:**

- WebP file: `public/warped-halftone/halftone-{name}.webp`

#### `optimize-images.mjs`

Converts PNG and JPG images to optimized WebP format for better performance.

**Usage:**

```bash
node scripts/optimize-images.mjs
```

**Outputs:**

- WebP files in `public/img/optimized/` directory
- Preserves directory structure from `public/img/`
- Reports file size savings for each conversion

**Process:**

- Scans `public/img/` recursively for PNG/JPG files
- Converts to WebP with 85% quality
- Outputs to `public/img/optimized/` maintaining relative paths

#### `convert-font.js`

Converts WOFF2 font files to TTF format for use with opentype.js in geometry generation.

**Usage:**

```bash
node scripts/convert-font.js
```

**Outputs:**

- TTF files in `public/fonts/` directory
- Converts `space-mono-v17-latin-700.woff2` → `space-mono-bold.ttf`
- Converts `space-mono-v17-latin-regular.woff2` → `space-mono-regular.ttf`

**Note:** Requires source WOFF2 files to exist in `public/fonts/` directory.

## Features

- Interactive 3D cube animations with Three.js
- WebGL halftone effects
- Scroll-triggered animations with GSAP
- Dynamic content sharing with image generation
- Release schedule gating
- Responsive design with Tailwind CSS

## Deployment

Deployed on Vercel. The project is configured for automatic deployments from the main branch.
