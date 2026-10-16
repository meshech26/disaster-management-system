export const emergencyInstructions = [
  {
    id: 'floods',
    title: 'During Floods',
    icon: 'warning',
    color: '#DC2626',
    background: '#FEE2E2',
    summary: ['Move to higher ground', 'Never walk or drive through floodwater', 'Avoid wet electrical equipment'],
    introduction: 'Act early when water rises. Your first priority is reaching a safe place.',
    steps: [
      { title: 'Move to safety immediately', description: 'Leave low ground for a safe, higher location. If told to evacuate, follow the designated route. Do not delay to collect belongings.' },
      { title: 'Keep out of floodwater', description: 'Do not walk, swim or drive across flooded roads or paths. Water can hide strong currents and damaged surfaces. Choose another safe route.' },
      { title: 'Avoid electrical hazards', description: 'Switch off power only if you can reach the main switch safely from a dry place. Never touch switches or appliances while wet or standing in water.' },
      { title: 'If trapped, get above the water', description: 'Move to the highest accessible level. Avoid enclosed attics where rising water could trap you. Call emergency services and tell them your location.' },
      { title: 'Follow local updates', description: 'Monitor DMC and local authority announcements from your safe location. Follow their shelter and evacuation instructions; conditions may change quickly.' },
      { title: 'Wait before returning', description: 'Return only after officials allow it. Keep away from damaged buildings, fallen power lines and remaining floodwater.' }
    ],
    source: { label: 'Ready.gov flood safety', url: 'https://www.ready.gov/floods' }
  },
  {
    id: 'landslides',
    title: 'During Landslides',
    icon: 'warning',
    color: '#EA580C',
    background: '#FFEDD5',
    summary: ['Move away from unstable slopes', 'Notice cracks, leaning trees or rumbling', 'Wait for official clearance before returning'],
    introduction: 'Leave danger areas early. Do not approach a slope to investigate warning signs.',
    steps: [
      { title: 'Recognize the warning signs', description: 'Look out for new ground cracks, leaning trees or poles, unusual rumbling, and sudden changes in stream flow. These can signal ground movement.' },
      { title: 'Leave the threatened area', description: 'Follow evacuation instructions promptly. If debris is moving, get away from its path toward nearby safe high ground, away from the unstable slope.' },
      { title: 'Take cover if escape is impossible', description: 'If rocks or debris are already approaching and you cannot get clear, seek the nearest shelter and take cover under sturdy furniture if possible.' },
      { title: 'Avoid affected roads', description: 'Do not cross debris or damaged pavement. Slides can block roads or undermine their surface. Follow road closures and official alternative routes.' },
      { title: 'Report people needing help', description: 'From a safe place, tell emergency services where people may be trapped. Do not enter the slide path to attempt a rescue.' },
      { title: 'Stay away after the slide', description: 'More slides or flooding can follow. Remain in a safe location and follow DMC, NBRO and local authority advice before returning.' }
    ],
    source: { label: 'CDC landslide safety', url: 'https://www.cdc.gov/landslides-and-mudslides/index.html' }
  },
  {
    id: 'heavy_rain',
    title: 'During Heavy Rain',
    icon: 'warning',
    color: '#7C3AED',
    background: '#EDE9FE',
    summary: ['Stay in a safe indoor location', 'Prepare for power cuts', 'Avoid unnecessary travel'],
    introduction: 'Rain can bring lightning, flooding and unstable slopes. Choose shelter that is safe from these hazards.',
    steps: [
      { title: 'Get into a safe shelter', description: 'When thunder starts, enter a substantial building or an enclosed hard-top vehicle. Trees, open sheds and bus shelters do not provide reliable lightning protection.' },
      { title: 'Stay away from lightning pathways', description: 'Keep away from windows and doors. During thunderstorms, avoid showers, taps, corded phones and equipment connected to electrical outlets.' },
      { title: 'Keep essentials within reach', description: 'Have a torch, drinking water, necessary medicines and a charged phone or power bank ready. Use battery-powered lighting if the electricity goes out.' },
      { title: 'Postpone unnecessary journeys', description: 'Wait in a safe place instead of travelling in poor visibility. If a road is flooded, turn back; never try to cross the water.' },
      { title: 'Watch for worsening conditions', description: 'Check official weather and DMC alerts. If flooding or landslide danger develops, follow evacuation directions and the relevant guide in this app.' },
      { title: 'Wait until it is safe outside', description: 'Stay sheltered for at least 30 minutes after the last thunder. Before travelling, check local warnings and road closures; flood danger may remain.' }
    ],
    source: { label: 'National Weather Service lightning safety', url: 'https://www.weather.gov/safety/lightning-safety' }
  },
  {
    id: 'general',
    title: 'General Safety Tips',
    icon: 'shield-checkmark',
    color: '#16A34A',
    background: '#DCFCE7',
    summary: ['Keep your phone charged', 'Follow official alerts', 'Plan support for people who need help'],
    introduction: 'Prepare these essentials before an emergency so your household can act quickly.',
    steps: [
      { title: 'Make a household plan', description: 'Agree on a safe meeting place, evacuation routes and someone to contact if separated. Make sure everyone knows the plan and where to find it.' },
      { title: 'Pack an emergency bag', description: 'Include drinking water, non-perishable food, medicines, a first-aid kit, torch, spare batteries, cash and copies of important documents. Keep it easy to carry.' },
      { title: 'Plan for individual needs', description: 'Arrange help for children, older adults and people with disabilities. Include mobility aids, essential medical supplies and pet needs in your evacuation plan.' },
      { title: 'Prepare to communicate', description: 'Keep phones and power banks charged. Store key contacts on paper as well as on your phone in case a battery fails.' },
      { title: 'Check trusted information', description: 'Follow DMC and local authority updates. Check the affected area and instructions before acting or sharing a message. Follow any evacuation order promptly.' },
      { title: 'Practise and refresh your plan', description: 'Review routes and contact details together. Replace expired food and medicines and check your torch and batteries so supplies are ready when needed.' }
    ],
    source: { label: 'Ready.gov emergency supply checklist', url: 'https://www.ready.gov/sites/default/files/2021-02/ready_checklist.pdf' }
  }
];
