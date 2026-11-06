export const teamFounder = {
  name: "Michael Pid",
  initials: "MP",
  photo: "/images/team/michael-pid.jpg",
  role: "Founder & CEO",
  note: "Helping homeowners through life's transitions with trusted guidance and real solutions.",
  introduction: "Hi, I'm Michael!",
  signature: "Michael",
  paragraphs: [
    "I know selling a home isn't always easy. Life can take unexpected turns, and sometimes all you need is someone who will listen, understand, and genuinely care.",
    "That's why I started HomeOffer365: to create a place where homeowners are treated like family, not just another transaction.",
    "Whether you're facing financial challenges, handling an inherited property, or ready for a fresh start, you do not have to figure it out alone.",
    "My team and I are here to listen, understand your needs, and help you find the best path forward with honesty, kindness, and respect.",
    "No pressure. No judgment. Just real people who genuinely care.",
  ],
};

type TeamMember = { name: string; initials: string; photo: string; role: string; bio: string; note?: string };
type TeamDepartment = { id: string; title: string; description: string; members: TeamMember[] };

export const teamDepartments: TeamDepartment[] = [
  {
    id: "leadership", title: "Leadership & experience", description: "Guiding the work, supporting the team, and keeping people at the center.",
    members: [
      { name: "Mike", initials: "M", photo: "/images/team/mike.jpg", role: "Co-Founder", bio: "Brings more than ten years of real estate experience to helping homeowners understand their options and find a practical, pressure-free solution.", note: "My goal is to make selling your home simple and low-stress through honest advice and personal support." },
      { name: "Eric", initials: "E", photo: "/images/team/eric.png", role: "CFO / COO", bio: "Oversees finance and operations while helping ensure every homeowner receives fair treatment, clear communication, and dependable support.", note: "Taking care of our customers is a responsibility I take personally." },
      { name: "Ashley Sellers", initials: "AS", photo: "/images/team/ashley-sellers.jpg", role: "Experience Director", bio: "Leads the homeowner experience and sets the standard for patient, honest communication from the first conversation through closing." },
      { name: "Mathew", initials: "M", photo: "/images/team/mathew.png", role: "Client Experience Manager", bio: "Serves as a consistent point of contact who answers questions, provides updates, and helps homeowners feel supported throughout the sale.", note: "You are never just another homeowner to us." },
      { name: "Asha", initials: "AS", photo: "/images/team/asha.jpg", role: "Operations Coordinator", bio: "Uses her background in executive support and operations to build clear workflows, coordinate communication, and keep the team aligned." },
      { name: "Tricia", initials: "T", photo: "/images/team/tricia.jpg", role: "Investor Advisor", bio: "Works with homebuyers, agents, and investors to connect each property with the right next owner through a smooth, transparent process." },
      { name: "George", initials: "GF", photo: "/images/team/george.jpg", role: "Agent Relations Advisor", bio: "Builds trusted relationships with real estate agents and partners, providing timely answers and dependable support throughout each collaboration." },
    ],
  },
  {
    id: "home-buying", title: "Home buying consultants", description: "Helping homeowners understand their options and next steps.",
    members: [
      { name: "Luis", initials: "L", photo: "/images/team/luis.jpg", role: "Home Solutions Specialist", bio: "Listens carefully to each family's circumstances and offers honest, no-pressure guidance toward the solution that fits their needs." },
      { name: "JJ", initials: "JJ", photo: "/images/team/jj.jpg", role: "Home Solutions Specialist", bio: "Tracks the details from first call through closing, keeps homeowners informed, and works to prevent surprises or unexplained delays." },
    ],
  },
  {
    id: "property-analysis", title: "Property analysis & underwriting", description: "Turning clear property information into an informed review.",
    members: [
      { name: "Jen", initials: "J", photo: "/images/team/jen.jpg", role: "Senior Underwriter", bio: "Brings more than twelve years of real estate finance and property-analysis experience to preparing fair, accurate, well-supported offers." },
      { name: "Darryl", initials: "D", photo: "/images/team/darryl.png", role: "Market Analyst", bio: "Researches local trends, property values, and market conditions so homeowners can receive accurate information and competitive solutions." },
    ],
  },
  {
    id: "transactions", title: "Transactions", description: "Keeping documents, deadlines, and communication connected.",
    members: [
      { name: "Hannah", initials: "HL", photo: "/images/team/hannah.jpg", role: "Client Experience Coordinator", bio: "Draws on more than ten years in real estate to provide clear updates, careful coordination, and a well-organized path from contract to closing." },
      { name: "Irish", initials: "I", photo: "/images/team/irish.jpg", role: "Closing Assistant", bio: "Manages documentation, tracks deadlines, and keeps communication moving among team members, title companies, and clients." },
    ],
  },
  {
    id: "property-management", title: "Property management", description: "Supporting the next chapter for people and properties.",
    members: [
      { name: "Mara", initials: "MA", photo: "/images/team/mara.jpg", role: "Relocation Specialist", bio: "Helps homeowners and families plan their next chapter, answering questions and connecting them with useful resources throughout the move." },
      { name: "Emily", initials: "E", photo: "/images/team/emily.jpg", role: "Project Coordinator", bio: "Coordinates renovation work and property improvements, managing contractors, schedules, and budgets from small repairs to full projects." },
    ],
  },
  {
    id: "operations", title: "Operations", description: "The practical support behind a well-coordinated team.",
    members: [{ name: "Jenny", initials: "JE", photo: "/images/team/jenny.png", role: "Admin Assistant", bio: "Brings five years of administrative experience to scheduling, documentation, office coordination, and internal communication." }],
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
