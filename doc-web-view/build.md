# Healthcare Document Signing Web App

## Tech Stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4**
- **shadcn/ui** for UI components
- **Motion** (react motion library) for animations
- **react-signature-canvas** for touch-optimized signing

## Project Structure

```
doc-web-view/
├── app/
│   ├── layout.tsx          # Root layout with fonts & providers
│   ├── page.tsx            # Main document viewer page
│   ├── globals.css         # Tailwind + custom styles
│   └── api/
│       └── signature/
│           └── route.ts    # Placeholder POST endpoint
├── components/
│   ├── document-viewer.tsx # FHIR XML to rendered document
│   ├── signature-pad.tsx   # Canvas signature component
│   ├── signature-modal.tsx # Modal wrapper for signing flow
│   └── ui/                 # shadcn components
├── lib/
│   ├── fhir-parser.ts      # XML parsing utilities
│   ├── signature-service.ts # Signature submission logic
│   └── utils.ts            # shadcn utils
├── data/
│   └── sample-document.xml # Sample FHIR document
└── types/
    └── fhir.ts             # TypeScript types for FHIR data
```

## Key Implementation Details

### 1. FHIR Document Rendering

- Parse FHIR XML (Composition resource type) using DOMParser
- Extract patient info, practitioner, sections, and narrative content
- Render as a styled healthcare document with proper hierarchy

### 2. Signature Canvas Component

- Use `react-signature-canvas` for smooth touch drawing
- Optimize for finger/stylus input with appropriate stroke width
- Include clear, undo, and confirm actions
- Export signature as base64 PNG data URL

### 3. Mobile/Tablet Optimization

- Responsive design with mobile-first approach
- Touch-friendly button sizes (min 44px tap targets)
- Full-screen signature modal on smaller devices
- Landscape orientation support for wider signing area

### 4. Signature Submission

- Placeholder service pointing to configurable backend URL
- Payload includes: signature image (base64), document ID, timestamp
- Loading states and error handling UI

### 5. UI/UX with Motion

- Page load animations with staggered reveals
- Smooth modal transitions
- Button hover/tap feedback
- Document scroll animations

## Sample FHIR Document

Will include a sample Composition resource with:

- Patient demographics header
- Clinical sections (Chief Complaint, History, Assessment)
- Signature requirement section