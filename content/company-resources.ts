// Fictional profile names for the local template; role/copy structure follows the supplied reference.
export const teamFounder = {
  name: "Daniel Bennett",
  initials: "DB",
  role: "Founder & CEO",
  note: "Helping homeowners through life's transitions with trusted guidance and real solutions.",
  introduction: "Hi, I'm Daniel!",
  signature: "Daniel",
  paragraphs: [
    "I know selling a home isn't always easy. Life can take unexpected turns, and sometimes all you need is someone who will listen, understand, and genuinely care.",
    "My team and I are here to listen, understand your needs, and help you find the best way forward, with honesty, kindness, and respect.",
  ],
};

type TeamMember = { name: string; initials: string; role: string; bio: string; note?: string };
type TeamDepartment = { id: string; title: string; description: string; members: TeamMember[] };

export const teamDepartments: TeamDepartment[] = [
  {
    id: "leadership", title: "Leadership & experience", description: "Guiding the work, supporting the team, and keeping people at the center.",
    members: [
      { name: "Nathan Brooks", initials: "NB", role: "Co-Founder", bio: "Brings experience across the real estate process to help the team understand homeowners' needs and find a clear path forward.", note: "This experience has helped me understand the challenges homeowners face and how we can best help them find the right solution." },
      { name: "Oliver Grant", initials: "OG", role: "CFO / COO", bio: "Connects financial oversight with day-to-day operations, with a focus on a fair and well-supported homeowner experience.", note: "I have an obligation to make sure our customers are treated fairly, cared for, and supported throughout the home-selling process." },
      { name: "Sophie Mitchell", initials: "SM", role: "Experience Director", bio: "Focuses on patient communication, clear updates, and personal support throughout the homeowner's experience." },
      { name: "Ethan Parker", initials: "EP", role: "Client Experience Manager", bio: "Helps homeowners navigate questions and uncertainty with clear answers and consistent communication." },
      { name: "Amelia Reed", initials: "AR", role: "Operations Coordinator", bio: "Keeps workflows, communications, and team priorities organized so day-to-day work runs smoothly." },
      { name: "Grace Collins", initials: "GC", role: "Investor Advisor", bio: "Connects properties with buyers, agents, and investors through an organized and transparent process." },
      { name: "Benjamin Hayes", initials: "BH", role: "Agent Relations Advisor", bio: "Supports real estate agents and partners with timely answers, clear communication, and dependable collaboration." },
    ],
  },
  {
    id: "outreach", title: "Outreach", description: "Starting conversations by listening first.",
    members: [{ name: "Lucas Morgan", initials: "LM", role: "Cold Caller", bio: "Introduces the home-selling process, listens to homeowners' needs, and connects them with the right team member." }],
  },
  {
    id: "home-buying", title: "Home buying consultants", description: "Helping homeowners understand their options and next steps.",
    members: [
      { name: "Adrian Cruz", initials: "AC", role: "Home Solutions Specialist", bio: "Listens to each homeowner's situation and provides straightforward guidance without pressure." },
      { name: "Caleb Foster", initials: "CF", role: "Home Solutions Specialist", bio: "Keeps homeowners informed and follows the details that help a sale move forward without guesswork." },
    ],
  },
  {
    id: "property-analysis", title: "Property analysis & underwriting", description: "Turning clear property information into an informed review.",
    members: [
      { name: "Natalie Ward", initials: "NW", role: "Senior Underwriter", bio: "Reviews property and financial details to support careful, well-informed evaluations." },
      { name: "Marcus Ellis", initials: "ME", role: "Market Analyst", bio: "Studies local market information and property values to support the team's decisions." },
    ],
  },
  {
    id: "transactions", title: "Transactions", description: "Keeping documents, deadlines, and communication connected.",
    members: [
      { name: "Chloe Sullivan", initials: "CS", role: "Client Experience Coordinator", bio: "Supports homeowners with clear updates and attention to detail from agreement through closing." },
      { name: "Isabel Turner", initials: "IT", role: "Closing Assistant", bio: "Organizes documentation, tracks deadlines, and helps communication flow between everyone involved." },
    ],
  },
  {
    id: "property-management", title: "Property management", description: "Supporting the next chapter for people and properties.",
    members: [
      { name: "Elena Carter", initials: "EC", role: "Relocation Specialist", bio: "Helps homeowners plan their transition and connect with useful moving resources." },
      { name: "Zoe Russell", initials: "ZR", role: "Project Coordinator", bio: "Coordinates property improvements, timelines, and project details to keep work organized." },
    ],
  },
  {
    id: "operations", title: "Operations", description: "The practical support behind a well-coordinated team.",
    members: [{ name: "Owen Blake", initials: "OB", role: "Admin Assistant", bio: "Supports scheduling, records, and internal communication so the team can focus on homeowners." }],
  },
];

export const homeownerExperience = [
  {
    stage: "01 / BEFORE THE VISIT",
    title: "Clarity from the start.",
    description: "A homeowner should know what to expect. Confirm appointment details and ask your assigned team member about access instructions before arriving.",
    takeaway: "Start with clear communication.",
  },
  {
    stage: "02 / AT THE PROPERTY",
    title: "Respect in every room.",
    description: "A property visit is a visit to someone's home. Work with care, stay in accessible areas, and document the condition clearly and accurately.",
    takeaway: "Make care part of every photo.",
  },
  {
    stage: "03 / AFTER THE VISIT",
    title: "Details that move things forward.",
    description: "Well-organized photos, a steady walkthrough, and notes about missing areas help the team make informed decisions and reduce unnecessary follow-up visits.",
    takeaway: "Leave a clear picture for the team.",
  },
] as const;
