// Missing approved destinations render an unavailable state rather than a fake link.
export const guideLinks = {
  website: "https://homeoffer365.com",
  team: "/photographers/team",
  stories: "/photographers/homeowner-stories",
  reviews: null as string | null,
  walkthrough: "/videos/ai-pennsylvania-property-tour.mp4",
  upload: "/photographers/upload",
  support: null as string | null,
};

export const walkthroughSample = {
  src: guideLinks.walkthrough,
  poster: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png",
  description: "A complete property walkthrough example showing the pacing, camera movement, and room-to-room coverage expected for a Home Offer 365 visit.",
};

export const exteriorExamples = [
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png",
    label: "Front elevation",
    alt: "Front elevation of a single-story home showing the entrance, windows, roofline, and front yard",
    note: "Start with a centered view showing the full front elevation, entrance, roofline, and surrounding yard.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-side-yard.png",
    label: "Side elevation",
    alt: "Side elevation of the home showing exterior walls, windows, foundation edge, and yard",
    note: "Capture each side separately and keep the complete elevation visible, including the roofline, foundation edge, and access area.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear-side.png",
    label: "Front and side angle",
    alt: "Wide front and side angle showing the brick bungalow entrance, windows, roofline, utilities, and surrounding lawn",
    note: "Use a wide front and side view to show the entrance, complete side elevation, utilities, foundation, and how the home sits on the lot.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear.png",
    label: "Rear / property edge",
    alt: "Rear elevation and property edge showing exterior walls, windows, fence, trees, and yard",
    note: "Include the rear elevation, yard boundaries, fencing, and nearby features so the property condition is visible in context.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png",
    label: "Front / driveway angle",
    alt: "Angled front view of a small brick bungalow showing its driveway, entry, landscaping, and detached shed",
    note: "Include an angled front view that shows access, parking, landscaping, and any outbuildings in relation to the home.",
  },
] as const;

export const interiorExamples = [
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-living-room.png",
    label: "Living room",
    alt: "Wide living-room view showing seating, windows, flooring, and connected doorways",
    note: "Stand in a corner and show the complete room, including windows, flooring, ceiling, and how it connects to adjacent spaces.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-kitchen.png",
    label: "Kitchen",
    alt: "Wide kitchen view showing cabinets, counters, sink, appliances, window, and doorway",
    note: "Capture the full kitchen layout and all visible cabinets, counters, appliances, plumbing fixtures, and access points.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bedroom.png",
    label: "Bedroom",
    alt: "Furnished bedroom showing the bed, walls, window, carpet, dresser, and ceiling light",
    note: "Use a wide corner view that shows every wall, the window, closet, flooring, ceiling, and overall room condition.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom.png",
    label: "Bathroom",
    alt: "Bathroom view showing the vanity, toilet, shower edge, mirror, window, and flooring",
    note: "Show the full bathroom and follow with detail photos of fixtures, plumbing, cabinets, and visible moisture or damage.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-laundry.png",
    label: "Laundry room",
    alt: "Laundry room showing washer, dryer, storage cabinets, window, floor, and exterior door",
    note: "Include laundry appliances, utility connections, storage, flooring, windows, and exterior access in a clear wide view.",
  },
] as const;

export const mechanicalExamples = [
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-ductwork.png",
    label: "Furnace and ductwork",
    alt: "Basement furnace with supply and return ductwork, gas piping, venting, and condensate line visible",
    note: "Show the furnace in context with its ductwork, venting, fuel connection, condensate routing, and surrounding access.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electric-meter-close.jpg",
    label: "Exterior electrical meter",
    alt: "Close exterior view of the electrical meter, service conduit, disconnect, and wall penetrations",
    note: "Photograph the exterior service equipment and its connections without opening covers or touching the installation.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-electrical-service-context.png",
    label: "Electrical service context",
    alt: "Wide side view of a brick bungalow showing the electrical meter location and surrounding wall",
    note: "Add a wider view so reviewers can see where the electrical service is located on the home.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-under-sink-plumbing.png",
    label: "Under-sink plumbing",
    alt: "Open kitchen sink cabinet showing supply lines, shutoff valves, drains, trap, and cabinet floor",
    note: "Open accessible sink cabinets and clearly show supply lines, shutoffs, drain piping, and visible cabinet condition.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-basement-overview.png",
    label: "Basement utility overview",
    alt: "Wide basement utility view showing the furnace, water heater, ductwork, plumbing, support columns, storage, and access stairs",
    note: "Start with a wide utility-area view so each system's location, access, and relationship to the basement are clear.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-modern.png",
    label: "Modern furnace",
    alt: "Basement gas furnace showing its cabinet, supply and return ductwork, venting, gas piping, and condensate line",
    note: "Capture the full furnace installation, including ductwork, venting, fuel connection, condensate routing, and accessible data labels.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-heater.png",
    label: "Water heater",
    alt: "Basement tank water heater showing venting, gas connection, copper supply lines, shutoffs, and adjacent ductwork",
    note: "Show the water heater from top to bottom with venting, fuel connection, supply piping, shutoffs, drain, and visible labels.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-water-softener.png",
    label: "Water softener",
    alt: "Basement water softener system showing mineral and brine tanks, filter housing, bypass valves, and supply piping",
    note: "Photograph treatment equipment in context, including tanks, filters, bypass valves, supply lines, and visible controls.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-well-pump.png",
    label: "Well pump system",
    alt: "Basement well system showing pressure tank, pump, pressure gauge, controls, filter, shutoffs, and connected piping",
    note: "Include the complete well-water system with pressure tank, pump, controls, gauge, filtration, shutoffs, and piping.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-ac-condenser.png",
    label: "Exterior AC condenser",
    alt: "Exterior air-conditioning condenser on a concrete pad beside the brick home with refrigerant lines and disconnect visible",
    note: "Show the outdoor condenser in context with its pad, wall clearance, refrigerant lines, electrical disconnect, and surrounding grade.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-breaker-panel.png",
    label: "Breaker panel",
    alt: "Open basement electrical breaker panel showing breakers, branch circuits, service conduit, panel schedule, and surrounding wall",
    note: "Photograph electrical panels only when already safely accessible; never remove covers or touch breakers, wiring, or equipment.",
  },
] as const;

export const conditionExamples = [
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png",
    label: "Overall exterior",
    alt: "Wide property view showing the home, front yard, walkway, trees, and surrounding site",
    note: "Begin with a wide property view that shows the structure, site, access, and overall exterior condition in context.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bedroom.png",
    label: "Interior surfaces",
    alt: "Furnished bedroom showing walls, window, carpet, baseboards, furniture, and ceiling light",
    note: "Use clear room views to document walls, ceilings, flooring, trim, windows, and any visible damage or unfinished work.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/interior-bathroom.png",
    label: "Bathroom condition",
    alt: "Bathroom showing fixtures, walls, window, vanity, mirror, and flooring",
    note: "Document fixture and surface condition, then add close-ups of visible staining, leaks, damage, or needed repairs.",
  },
  {
    src: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-rear.png",
    label: "Rear site condition",
    alt: "Rear property view showing the home, yard, trees, grading, and nearby structures",
    note: "Show the rear structure and site together so grading, vegetation, access, and visible exterior condition can be reviewed.",
  },
] as const;

export const photoCategories = [
  {
    id: "exterior", title: "Exterior Photos", number: "01", icon: "house",
    image: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front.png",
    alt: "Front elevation of a single-story home showing the entrance, windows, roofline, and front yard",
    highlights: ["Front, rear & both sides", "Yard, driveway & outbuildings"],
    shots: ["Front of house", "Rear of house", "Both sides", "Roof and gutters", "Driveway, yard, and outbuildings", "Visible exterior damage"],
    tip: "Take a wide view first, then closer photos of visible damage. Photograph the roof from a safe, accessible location.",
    exampleNote: "Show the building and surrounding features in context, then capture the rear and both sides separately.",
  },
  {
    id: "interior", title: "Interior Photos", number: "02", icon: "sofa",
    image: "/images/photo-examples/pennsylvania-brick-bungalow/interior-living-room.png",
    alt: "Wide living-room view showing seating, windows, flooring, and connected doorways",
    highlights: ["Every accessible room", "Layout, condition & key details"],
    shots: ["Living room", "Kitchen and appliances", "All bedrooms", "All bathrooms", "Basement and attic where accessible", "Floors, ceilings, and walls", "Visible damage or needed repairs"],
    tip: "Use well-lit views showing how rooms connect. Include both an overall view and details of visible issues.",
    exampleNote: "Show how rooms connect, then photograph each room individually. Include floors, ceilings, walls, appliances, and visible repairs.",
  },
  {
    id: "mechanical", title: "Mechanical Systems", number: "03", icon: "settings", image: "/images/photo-examples/pennsylvania-brick-bungalow/mechanical-furnace-ductwork.png", alt: "Basement furnace with ductwork, piping, venting, and condensate line visible",
    highlights: ["HVAC, electrical & plumbing", "Equipment context & condition"],
    shots: ["HVAC equipment", "Furnace and air conditioning", "Water heater", "Electrical panel and meter where safely accessible", "Visible plumbing and shutoffs", "Equipment labels and visible condition"],
    tip: "Include readable labels when accessible. Do not open electrical equipment or remove covers to obtain a photo.",
    exampleNote: "Capture an overview of each system and separate readable label photos where safely accessible. Do not open electrical equipment or remove covers.",
  },
  {
    id: "condition", title: "Property Condition", number: "04", icon: "scan", image: "/images/photo-examples/pennsylvania-brick-bungalow/exterior-front-driveway.png", alt: "Wide property view showing a brick bungalow, driveway, front yard, landscaping, trees, and detached shed",
    highlights: ["Overall property condition", "Damage, moisture & repairs"],
    shots: ["Water damage", "Foundation cracks", "Roof leaks", "Mold-like staining", "Fire damage", "Structural concerns", "Unfinished renovations"],
    tip: "Show the issue in context, then capture a closer view. Describe what is visible rather than diagnosing its cause.",
    exampleNote: "Start with a wide property view, then document visible cracks, staining, damage, or unfinished work with a closer detail. Report what you see without diagnosing the cause.",
  },
] as const;

export const checklistGroups = [
  { title: "Exterior", items: ["Front, rear, and both sides photographed", "Roof, yard, driveway, and outbuildings documented", "Exterior damage photographed"] },
  { title: "Interior", items: ["Every accessible room photographed", "Kitchen and bathrooms documented", "Basement, attic, and garage photographed where accessible", "Interior damage documented"] },
  { title: "Mechanical", items: ["HVAC system photographed", "Water heater photographed", "Electrical panel photographed where safely accessible", "Visible plumbing and mechanical issues documented"] },
  { title: "Video", items: ["Full walkthrough recorded", "All accessible rooms included", "Major condition issues shown"] },
  { title: "Final submission", items: ["Photos are clear and properly lit", "Property address confirmed", "All required files uploaded", "Missing or inaccessible areas reported", "Assignment ready for submission"] },
] as const;
