/**
 * school.config.ts — the ONLY file a new school needs to edit.
 * Everything school-specific (identity, branding, academics, grading, fees, features,
 * website content and navigation) lives here. Secrets live in environment variables.
 *
 * Keep this file free of imports from the app (it is also read by scripts/db-setup.mjs).
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
  // Identity
  // ---------------------------------------------------------------------------
  name: 'Brightfield College',
  shortName: 'Brightfield',
  initials: 'BFC',
  motto: 'Knowledge, Character, Service',
  foundedYear: 2004,
  description:
    'Brightfield College is a co-educational day and boarding secondary school in Lekki, Lagos, offering the Nigerian curriculum from JSS 1 to SS 3 with strong results in WAEC, NECO and JAMB.',
  address: {
    street: '12 Admiralty Way, Lekki Phase 1',
    city: 'Lekki',
    lga: 'Eti-Osa',
    state: 'Lagos',
    country: 'Nigeria',
  },
  phones: ['+234 803 123 4500', '+234 809 876 5400'],
  whatsapp: '2348031234500', // international format, digits only
  emails: {
    general: 'info@brightfield.edu.ng',
    admissions: 'admissions@brightfield.edu.ng',
    accounts: 'accounts@brightfield.edu.ng',
  },
  social: {
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    x: 'https://x.com/',
    youtube: 'https://youtube.com/',
  },
  mapEmbedUrl:
    'https://www.google.com/maps?q=Admiralty+Way+Lekki+Phase+1+Lagos&output=embed',
  officeHours: 'Monday – Friday, 7:30am – 4:00pm',

  // ---------------------------------------------------------------------------
  // Branding
  // ---------------------------------------------------------------------------
  branding: {
    logo: '/images/logo.png',
    favicon: '/images/logo.png',
    heroImage: '/images/hero.png',
    ogImage: '/images/hero.png',
    colors: {
      primary: '#0f4c3a', // deep school green
      secondary: '#12261f', // ink
      accent: '#e0a526', // crest gold
    },
    /** 'classic' = serif headings + sans body, 'modern' = sans throughout */
    fontPreset: 'classic' as 'classic' | 'modern',
  },

  schoolType: 'both' as 'day' | 'boarding' | 'both',
  genderType: 'mixed' as 'boys' | 'girls' | 'mixed',

  // ---------------------------------------------------------------------------
  // Academic structure
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
      { name: 'Science', description: 'Physics, Chemistry, Biology, Further Mathematics and Agricultural Science for future engineers, doctors and scientists.' },
      { name: 'Arts', description: 'Literature, Government, History and CRS/IRS for future lawyers, writers and public servants.' },
      { name: 'Commercial', description: 'Economics, Commerce, Accounting and Marketing for future entrepreneurs and finance professionals.' },
    ],
  },

  // ---------------------------------------------------------------------------
  // Assessment and grading (default WAEC-style)
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
  // Money and numbering
  // ---------------------------------------------------------------------------
  currency: { code: 'NGN', symbol: '₦', locale: 'en-NG' },
  numbering: {
    admissionPrefix: 'BFC', // → BFC/2026/0001
    receiptPrefix: 'BFC-RCP', // → BFC-RCP/2026/000001
    invoicePrefix: 'BFC-INV',
    applicationPrefix: 'BFC-APP',
  },
  payments: {
    gateway: 'paystack' as 'paystack' | 'flutterwave',
    bankTransfer: {
      enabled: true,
      accounts: [{ bank: 'Access Bank', accountName: 'Brightfield College', accountNumber: '0123456789' }],
    },
    withholdResultsAboveKobo: 0, // 0 = do not withhold results for debt
  },

  // ---------------------------------------------------------------------------
  // Feature flags
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
    principalName: 'Dr. Olufemi Adekunle',
    principalSignature: '',
  },

  // ---------------------------------------------------------------------------
  // Public website
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
      eyebrow: 'Admissions open for 2027/2028',
      title: 'A school that shapes scholars and builds character.',
      subtitle:
        'JSS 1 to SS 3, day and boarding, in the heart of Lekki. Strong WAEC, NECO and JAMB results, caring teachers and a campus where every child is known by name.',
    },
    stats: {
      yearsOfExcellence: true,
      passRate: { value: '94%', label: 'WASSCE 5 credits incl. English & Maths' },
    },
    principal: {
      name: 'Dr. Olufemi Adekunle',
      title: 'Principal',
      photo: '/images/principal.png',
      message:
        'Welcome to Brightfield College. For over two decades we have partnered with parents to raise young people who are academically excellent, morally upright and ready to serve. Our teachers know every student by name, and our doors are always open to families. I invite you to visit us and see the difference for yourself.',
    },
    history:
      'Brightfield College was founded in 2004 by a group of educators with a simple goal: a school in Lagos that combines rigorous academics with strong values. From 46 students in a rented building, we have grown into a full secondary school with modern laboratories, a library, an ICT centre and boarding houses.',
    vision: 'To be a leading secondary school in Nigeria, raising leaders of character for Africa and the world.',
    mission:
      'To provide a safe, disciplined and inspiring environment where every student achieves academic excellence and grows in character, creativity and service.',
    coreValues: ['Integrity', 'Excellence', 'Discipline', 'Respect', 'Service'],
    whyChooseUs: [
      { title: 'Proven results', body: 'Consistent top results in WASSCE, NECO and JAMB, with dedicated exam preparation from SS 1.' },
      { title: 'Qualified teachers', body: 'TRCN-registered teachers with small class sizes so no child is left behind.' },
      { title: 'Safe campus', body: 'Gated campus, CCTV, trained security and a full-time nurse in the sick bay.' },
      { title: 'Modern facilities', body: 'Science laboratories, ICT centre with CBT practice, library, sports field and steady power.' },
      { title: 'Character first', body: 'Mentoring, clubs and leadership roles that build integrity, confidence and service.' },
      { title: 'Parents in the loop', body: 'Results, fees and attendance on your phone through the parent portal.' },
    ],
    facilities: [
      'Physics, Chemistry and Biology laboratories',
      'ICT centre with 40 workstations and CBT practice',
      'Library with over 6,000 titles',
      'Standard football field and basketball court',
      'Separate boys and girls boarding houses',
      'Sick bay with a full-time registered nurse',
      'School buses on major Lekki and Ajah routes',
      '24-hour power supply',
    ],
    rules: [
      'Students must be punctual; the gate closes at 7:30am.',
      'Full school uniform must be worn neatly at all times.',
      'Mobile phones are not allowed in class.',
      'Respect for teachers, staff and fellow students is required.',
      'Bullying of any kind leads to suspension.',
    ],
    uniform:
      'Green blazer with school crest, white shirt, green and gold striped tie, green trousers or skirt, black shoes and white socks. Sportswear: house T-shirt and green shorts.',
    testimonials: [
      { quote: 'My two children have grown so much in confidence. The teachers really care and the parent portal keeps me informed.', name: 'Mrs. Adaeze Okafor', role: 'Parent, JSS 2 and SS 1' },
      { quote: 'Brightfield prepared me well for WAEC and JAMB. I scored 312 and got admission to study Medicine.', name: 'Tobi Adebayo', role: 'Class of 2025' },
      { quote: 'The boarding house is safe and well run. My daughter settled in within weeks.', name: 'Alhaji Musa Bello', role: 'Parent, SS 2' },
    ],
    studentLife: {
      clubs: ['JETS Club', 'Debate & Literary Society', 'Press Club', 'Red Cross', 'Coding Club', 'Drama Club', 'Music & Choir', 'Junior Achievement'],
      sports: ['Football', 'Basketball', 'Athletics', 'Table tennis', 'Volleyball', 'Chess'],
      boarding:
        'Separate boys and girls hostels with house parents, supervised prep, three balanced meals a day and weekend activities. Exeat is granted on approved weekends.',
      health:
        'Our sick bay is run by a registered nurse with a visiting doctor. We keep health records, allergies and immunisation details for every student.',
      transport: 'School buses cover Lekki, Ajah, Ikoyi, Victoria Island and Sangotedo. Routes and fares are published each term.',
    },
    admissions: {
      requirements: [
        'Primary school leaving certificate or last two termly reports',
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
      applicationFeeKobo: 1000000,
      entranceExamDates: ['2027-01-16', '2027-03-13'],
      forms: [{ label: 'Admission form (PDF)', href: '#' }, { label: 'Medical form (PDF)', href: '#' }],
    },
    feesOverview: [
      { level: 'JSS 1 – JSS 3 (Day)', perTermKobo: 18500000 },
      { level: 'SS 1 – SS 3 (Day)', perTermKobo: 21000000 },
      { level: 'Boarding (additional)', perTermKobo: 25000000 },
    ],
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
