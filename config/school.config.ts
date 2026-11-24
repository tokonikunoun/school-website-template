/**
 * ============================================================================
 *  school.config.ts — THE ONE FILE TO EDIT FOR A NEW SCHOOL
 * ============================================================================
 *
 *  Every school-specific value used by the website, admin dashboard, portals,
 *  report cards and database setup comes from this file.
 *
 *  How to customise:
 *    1. Search this file for "REPLACE" and change each value marked with it.
 *    2. Put your own images in /public/images/ (see "Branding" and "principal").
 *    3. Run `pnpm db:setup` so the database picks up the name, prefixes and grading.
 *
 *  Rules:
 *    - Keep the shape (keys) the same; only change the values.
 *    - Money is written in kobo / the smallest currency unit (₦1 = 100 kobo).
 *    - Keep this file free of imports from the app (scripts/db-setup.mjs reads it too).
 *    - Secrets (API keys, database URLs) go in environment variables, never here.
 *
 *  Full guide: README.md
 * ============================================================================
 */

export type LevelGroup = 'nursery' | 'primary' | 'junior' | 'senior'
export type HomeSection =
  | 'hero'
  | 'welcome'
  | 'stats'
  | 'why'
  | 'programmes'
  | 'news'
  | 'events'
  | 'testimonials'
  | 'gallery'
  | 'admissions'
  | 'map'

export const schoolConfig = {
  // ---------------------------------------------------------------------------
  // 1. Identity  — REPLACE all values in this section
  // ---------------------------------------------------------------------------
  name: 'Your School Name', // REPLACE: full name, shown in titles, footer, report cards
  shortName: 'Your School', // REPLACE: short name used in headings ("What makes ___ different")
  initials: 'YS', // REPLACE: 2–4 letters, used as a fallback logo mark
  motto: 'Your school motto', // REPLACE
  foundedYear: 2000, // REPLACE: drives the "Years since …" stat
  description:
    'REPLACE: one or two sentences describing your school. This is used for search engines and link previews.',
  /** Language/region tag used for dates and the <html lang> attribute, e.g. 'en-NG', 'en-GB', 'en-GH'. */
  locale: 'en-NG',
  /** Shown exactly as written. Leave a field as '' to skip it. */
  address: {
    street: '123 School Road', // REPLACE
    city: 'Your City', // REPLACE
    lga: 'Your LGA', // REPLACE: local government area / district, e.g. 'Ikeja LGA'
    state: 'Your State', // REPLACE: e.g. 'Lagos State'
    country: 'Nigeria', // REPLACE
  },
  phones: ['+234 800 000 0000', '+234 800 000 0001'], // REPLACE: first number is the main line
  whatsapp: '2348000000000', // REPLACE: international format, digits only (no + or spaces)
  emails: {
    general: 'info@yourschool.example', // REPLACE
    admissions: 'admissions@yourschool.example', // REPLACE
    accounts: 'accounts@yourschool.example', // REPLACE
  },
  /** REPLACE with your pages. Set a link to '' to hide that icon. */
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    x: 'https://x.com/',
    youtube: 'https://youtube.com/',
  },
  /**
   * REPLACE: Google Maps → Share → Embed a map → copy the src="…" URL.
   * A quick alternative: https://www.google.com/maps?q=<your+address>&output=embed
   */
  mapEmbedUrl: 'https://www.google.com/maps?q=Lagos+Nigeria&output=embed',
  officeHours: 'Monday – Friday, 8:00am – 4:00pm', // REPLACE

  // ---------------------------------------------------------------------------
  // 2. Branding  — REPLACE the images and colours
  // ---------------------------------------------------------------------------
  branding: {
    /** REPLACE: square PNG or SVG, at least 256×256, transparent background works best. */
    logo: '/images/logo.png',
    /** REPLACE: usually the same file as the logo. */
    favicon: '/images/logo.png',
    /** REPLACE: wide landscape photo of your campus, at least 1920×1080. */
    heroImage: '/images/hero.png',
    /** REPLACE: image shown when the site is shared on social media (1200×630 is ideal). */
    ogImage: '/images/hero.png',
    /**
     * REPLACE with your school colours (hex).
     *   primary   – buttons, links, headings accents
     *   secondary – dark "ink" colour for the header, footer and admin sidebar
     *   accent    – highlights such as the hero badge and call-to-action buttons
     * Keep good contrast: primary should be dark enough for white text on top.
     */
    colors: {
      primary: '#1d4e89',
      secondary: '#14213d',
      accent: '#f2b134',
    },
    /** 'classic' = serif headings + sans body, 'modern' = sans throughout */
    fontPreset: 'classic' as 'classic' | 'modern',
  },

  schoolType: 'both' as 'day' | 'boarding' | 'both', // REPLACE
  genderType: 'mixed' as 'boys' | 'girls' | 'mixed', // REPLACE

  // ---------------------------------------------------------------------------
  // 3. Academic structure
  //    Classes and terms are synced into the database by `pnpm db:setup`.
  // ---------------------------------------------------------------------------
  academics: {
    levels: [
      { name: 'JSS 1', group: 'junior' },
      { name: 'JSS 2', group: 'junior' },
      { name: 'JSS 3', group: 'junior' },
      { name: 'SS 1', group: 'senior' },
      { name: 'SS 2', group: 'senior' },
      { name: 'SS 3', group: 'senior' },
    ] as { name: string; group: LevelGroup }[],
    includePrimary: false,
    includeNursery: false,
    termNames: ['First Term', 'Second Term', 'Third Term'],
    sessionFormat: 'YYYY/YYYY',
    curricula: ['NERDC', 'WAEC', 'NECO', 'JAMB'],
    offersCambridge: false,
    departments: [
      { name: 'Science', description: 'Physics, Chemistry, Biology, Further Mathematics and Agricultural Science.' },
      { name: 'Arts', description: 'Literature, Government, History and Religious Studies.' },
      { name: 'Commercial', description: 'Economics, Commerce, Accounting and Marketing.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // 4. Assessment and grading (default: WAEC-style). Components must total 100.
  // ---------------------------------------------------------------------------
  assessment: {
    components: [
      { key: 'ca1', name: 'CA 1', maxScore: 20, isExam: false },
      { key: 'ca2', name: 'CA 2', maxScore: 20, isExam: false },
      { key: 'exam', name: 'Exam', maxScore: 60, isExam: true },
    ],
    passMark: 40,
    promotion: {
      minimumAverage: 45,
      mustPassSubjects: ['English Language', 'Mathematics'],
      minimumSubjectsPassed: 5,
    },
    skills: ['Punctuality', 'Neatness', 'Honesty', 'Leadership', 'Sports', 'Handwriting'],
  },
  gradingScale: [
    { grade: 'A1', min: 75, max: 100, remark: 'Excellent', pass: true },
    { grade: 'B2', min: 70, max: 74, remark: 'Very Good', pass: true },
    { grade: 'B3', min: 65, max: 69, remark: 'Good', pass: true },
    { grade: 'C4', min: 60, max: 64, remark: 'Credit', pass: true },
    { grade: 'C5', min: 55, max: 59, remark: 'Credit', pass: true },
    { grade: 'C6', min: 50, max: 54, remark: 'Credit', pass: true },
    { grade: 'D7', min: 45, max: 49, remark: 'Pass', pass: true },
    { grade: 'E8', min: 40, max: 44, remark: 'Pass', pass: true },
    { grade: 'F9', min: 0, max: 39, remark: 'Fail', pass: false },
  ],

  // ---------------------------------------------------------------------------
  // 5. Money and numbering
  // ---------------------------------------------------------------------------
  currency: { code: 'NGN', symbol: '₦', locale: 'en-NG' },
  /** REPLACE the prefixes with your initials. Changing them later only affects new records. */
  numbering: {
    admissionPrefix: 'SCH', // → SCH/2026/0001
    receiptPrefix: 'SCH-RCP', // → SCH-RCP/2026/000001
    invoicePrefix: 'SCH-INV',
    applicationPrefix: 'SCH-APP', // → SCH-APP-2026-00001
  },
  payments: {
    gateway: 'paystack' as 'paystack' | 'flutterwave',
    bankTransfer: {
      enabled: true,
      // REPLACE with your real account(s). Shown to parents on invoices.
      accounts: [{ bank: 'Your Bank', accountName: 'Your School Name', accountNumber: '0000000000' }],
    },
    withholdResultsAboveKobo: 0, // 0 = do not withhold results for debt
  },

  // ---------------------------------------------------------------------------
  // 6. Feature flags — turn whole modules on or off
  // ---------------------------------------------------------------------------
  features: {
    onlinePayments: true,
    boarding: true,
    parentPortal: true,
    studentPortal: true,
    blog: true,
    gallery: true,
    onlineAdmissions: true,
    smsNotifications: false,
    resultChecker: true,
    careers: true,
    aiRemarks: true,
  },

  reportCard: {
    headerLayout: 'centered' as 'centered' | 'left-logo',
    showStudentPhoto: true,
    showPosition: true,
    signatures: ['Form Teacher', 'Principal'],
    principalName: 'Principal Name', // REPLACE
    principalSignature: '', // optional: path to a signature image in /public
  },

  // ---------------------------------------------------------------------------
  // 7. Public website content — REPLACE the text to tell your school's story
  // ---------------------------------------------------------------------------
  website: {
    navigation: [
      { label: 'About', href: '/about' },
      { label: 'Academics', href: '/academics' },
      { label: 'Admissions', href: '/admissions' },
      { label: 'Student Life', href: '/student-life' },
      { label: 'News', href: '/news' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Contact', href: '/contact' },
    ],
    /** Home page sections, top to bottom. Remove or reorder entries to change the home page. */
    homeSections: [
      'hero',
      'stats',
      'welcome',
      'why',
      'programmes',
      'news',
      'events',
      'testimonials',
      'gallery',
      'admissions',
      'map',
    ] as HomeSection[],
    hero: {
      eyebrow: 'Admissions now open', // REPLACE
      title: 'REPLACE: a short, confident headline about your school.',
      subtitle:
        'REPLACE: one or two sentences on who you teach, where you are and what makes you different.',
    },
    stats: {
      yearsOfExcellence: true,
      /** REPLACE with a real, verifiable figure, or set passRate to false to hide it. */
      passRate: { value: '00%', label: 'REPLACE: e.g. WASSCE 5 credits incl. English & Maths' } as
        | { value: string; label: string }
        | false,
    },
    principal: {
      name: 'Principal Name', // REPLACE
      title: 'Principal',
      photo: '/images/principal.png', // REPLACE: portrait photo, 4:5 ratio, at least 800×1000
      message:
        'REPLACE: a short welcome message from the head of school (60–90 words works best). Introduce the school, what it values and invite families to visit.',
    },
    history:
      'REPLACE: a short paragraph about when and why the school was founded and how it has grown.',
    vision: 'REPLACE: your vision statement.',
    mission: 'REPLACE: your mission statement.',
    coreValues: ['Integrity', 'Excellence', 'Discipline', 'Respect', 'Service'], // REPLACE
    /** REPLACE: six short reasons families choose your school. */
    whyChooseUs: [
      { title: 'Strong results', body: 'REPLACE: describe your academic results and exam preparation.' },
      { title: 'Qualified teachers', body: 'REPLACE: describe your teachers and class sizes.' },
      { title: 'Safe campus', body: 'REPLACE: describe security, health care and welfare.' },
      { title: 'Modern facilities', body: 'REPLACE: describe laboratories, library, ICT and sports.' },
      { title: 'Character first', body: 'REPLACE: describe mentoring, clubs and leadership.' },
      { title: 'Parents in the loop', body: 'Results, fees and attendance on your phone through the parent portal.' },
    ],
    /** REPLACE: shown on the home page "Academics" section. */
    programmes: {
      title: 'Junior and senior secondary',
      junior: {
        title: 'Junior Secondary',
        body: 'REPLACE: describe the junior curriculum, core subjects and the exam it leads to (e.g. BECE).',
      },
      senior: {
        title: 'Senior Secondary',
        body: 'REPLACE: describe subject specialisation and the exams students sit (e.g. WASSCE, NECO, JAMB).',
      },
    },
    /** REPLACE: banner images for inner pages (wide landscape photos). */
    pageImages: {
      studentLife: '/images/news-sports.png',
    },
    facilities: [
      'REPLACE: Science laboratories',
      'REPLACE: ICT centre',
      'REPLACE: Library',
      'REPLACE: Sports field',
    ],
    rules: [
      'REPLACE: Students must be punctual.',
      'REPLACE: Full school uniform must be worn neatly at all times.',
      'REPLACE: Mobile phones are not allowed in class.',
    ],
    uniform: 'REPLACE: describe the school and sports uniforms.',
    /** REPLACE with real quotes, used with permission. Remove 'testimonials' from homeSections to hide. */
    testimonials: [
      { quote: 'REPLACE: a short quote from a parent.', name: 'Parent Name', role: 'Parent' },
      { quote: 'REPLACE: a short quote from a former student.', name: 'Alumnus Name', role: 'Class of 2025' },
      { quote: 'REPLACE: another short quote.', name: 'Parent Name', role: 'Parent' },
    ],
    studentLife: {
      clubs: ['Debate Society', 'Press Club', 'Coding Club', 'Drama Club', 'Music & Choir'], // REPLACE
      sports: ['Football', 'Basketball', 'Athletics', 'Table tennis'], // REPLACE
      boarding: 'REPLACE: describe boarding houses, supervision, meals and exeat.',
      health: 'REPLACE: describe the sick bay, nurse and health records.',
      transport: 'REPLACE: describe bus routes and fares.',
    },
    admissions: {
      requirements: [
        'Last two termly reports or a school leaving certificate',
        'Birth certificate or age declaration',
        'Two recent passport photographs',
        'Pass in the entrance examination and interview',
      ],
      process: [
        'Complete the online application form',
        'Pay the application fee',
        'Sit the entrance examination',
        'Attend an interview with a parent',
        'Receive an admission letter and accept the offer',
      ],
      applicationFeeKobo: 1000000, // REPLACE: ₦10,000
      entranceExamDates: ['2027-01-16', '2027-03-13'], // REPLACE: YYYY-MM-DD
      forms: [{ label: 'Admission form (PDF)', href: '#' }, { label: 'Medical form (PDF)', href: '#' }], // REPLACE href with file paths in /public
    },
    /** REPLACE: indicative fees per term, in kobo. */
    feesOverview: [
      { level: 'Junior Secondary (Day)', perTermKobo: 15000000 },
      { level: 'Senior Secondary (Day)', perTermKobo: 18000000 },
      { level: 'Boarding (additional)', perTermKobo: 20000000 },
    ],
    /** TERM DATES — REPLACE each session. Shown on the home page and the events page. */
    calendar: [
      { term: 'First Term', dates: '14 Sept – 18 Dec 2026' },
      { term: 'Second Term', dates: '11 Jan – 9 Apr 2027' },
      { term: 'Third Term', dates: '26 Apr – 23 Jul 2027' },
    ],
    announcementBanner: true,
    cookieNotice: true,
  },
} as const

export type SchoolConfig = typeof schoolConfig
export default schoolConfig
