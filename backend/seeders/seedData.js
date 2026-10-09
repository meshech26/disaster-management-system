const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const User = require('../models/User');
const Incident = require('../models/Incident');
const SosAlert = require('../models/SosAlert');
const Shelter = require('../models/Shelter');
const Resource = require('../models/Resource');
const AlertBroadcast = require('../models/AlertBroadcast');
const RescueTeam = require('../models/RescueTeam');
const RescueMission = require('../models/RescueMission');

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] Connected.');

    // Clear existing collections
    await User.deleteMany({});
    await Incident.deleteMany({});
    await SosAlert.deleteMany({});
    await Shelter.deleteMany({});
    await Resource.deleteMany({});
    await AlertBroadcast.deleteMany({});
    await RescueTeam.deleteMany({});
    await RescueMission.deleteMany({});
    console.log('[Seeder] Cleared previous database records.');

    // 1. Create Users
    const dutyOfficer = await User.create({
      name: 'Duty Officer Kamal Perera',
      username: 'duty_officer',
      email: 'dutyofficer@dmc.gov.lk',
      password: 'password123',
      phone: '+94 11 213 6136',
      district: 'Colombo',
      role: 'duty_officer',
      agency: 'DMC National Emergency Operations Centre',
      emergencyContacts: [{ name: 'DMC HQ Command', phone: '+94 11 213 6135', relation: 'Agency' }]
    });

    const volunteerJohn = await User.create({
      name: 'John Perera',
      username: 'volunteer',
      email: 'john@example.com',
      password: 'password123',
      phone: '+94 77 123 4567',
      district: 'Colombo',
      role: 'volunteer',
      agency: 'Community Volunteer Force',
      lastKnownLocation: {
        type: 'Point',
        coordinates: [79.8821, 6.9452],
        address: 'Kelanimulla, Colombo'
      }
    });

    const citizenNimal = await User.create({
      name: 'Nimal Silva',
      username: 'nimal_silva',
      email: 'nimal@example.com',
      password: 'password123',
      phone: '+94 71 889 1234',
      district: 'Colombo',
      role: 'citizen',
      lastKnownLocation: {
        type: 'Point',
        coordinates: [79.912, 6.931],
        address: 'Mulleriyawa, Colombo'
      }
    });

    const volunteerRuwan = await User.create({
      name: 'Ruwan Fernando',
      username: 'ruwan_f',
      email: 'ruwan@example.com',
      password: 'password123',
      phone: '+94 72 445 6789',
      district: 'Colombo',
      role: 'volunteer'
    });

    const volunteerKavinda = await User.create({
      name: 'Kavinda Perera',
      username: 'kavinda_p',
      email: 'kavinda@example.com',
      password: 'password123',
      phone: '+94 70 334 5566',
      district: 'Gampaha',
      role: 'volunteer'
    });

    const volunteerSahan = await User.create({
      name: 'Sahan Kumara',
      username: 'sahan_k',
      email: 'sahan@example.com',
      password: 'password123',
      phone: '+94 76 998 1122',
      district: 'Colombo',
      role: 'volunteer'
    });

    const dmcOfficer = await User.create({
      name: 'Chaminda Pathirana',
      username: 'dmc_officer',
      email: 'dmcofficer@dmc.gov.lk',
      password: 'password123',
      phone: '+94 11 213 6136',
      district: 'Colombo',
      role: 'dmc_officer',
      agency: 'Disaster Management Centre (DMC) National Command HQ'
    });

    const adminUser = await User.create({
      name: 'Major Sarah Jenkins',
      username: 'admin',
      email: 'admin@disaster.org',
      password: 'password123',
      phone: '+1-800-555-0101',
      role: 'admin',
      agency: 'National Disaster Management Authority'
    });

    const responder1 = await User.create({
      name: 'Captain Alex Rivera',
      username: 'responder',
      email: 'responder@disaster.org',
      password: 'password123',
      phone: '+1-800-555-0102',
      role: 'responder',
      agency: 'Disaster Rapid Response Force'
    });

    const districtOfficer = await User.create({
      name: 'Sunil Jayawardena',
      username: 'district_officer',
      email: 'districtofficer@dmc.gov.lk',
      password: 'password123',
      phone: '+94 91 224 4380',
      district: 'Galle',
      role: 'district_officer',
      agency: 'DMC Galle District Secretariat Command'
    });

    // Seed 4 Rescue Team Accounts (Matching 4 Specializations)
    const rescueTeamUser = await User.create({
      name: 'Commander Rohan Senanayake',
      username: 'rescue_team',
      email: 'rescueteam@dmc.gov.lk',
      password: 'password123',
      phone: '+94 77 987 6543',
      district: 'Galle',
      role: 'rescue_team',
      agency: 'DMC Water Rescue Unit - 01'
    });

    const waterRescueUser = await User.create({
      name: 'Commander Rohan Senanayake',
      username: 'water_rescue',
      email: 'waterrescue@dmc.gov.lk',
      password: 'password123',
      phone: '+94 77 987 6544',
      district: 'Galle',
      role: 'rescue_team',
      agency: 'DMC Water Rescue Unit - 01'
    });

    const medicalRescueUser = await User.create({
      name: 'Dr. Priyantha Silva',
      username: 'medical_rescue',
      email: 'medicalrescue@dmc.gov.lk',
      password: 'password123',
      phone: '+94 71 334 5566',
      district: 'Galle',
      role: 'rescue_team',
      agency: 'DMC Medical Response Unit - 01'
    });

    const fireRescueUser = await User.create({
      name: 'Captain S. Jayatilleke',
      username: 'fire_rescue',
      email: 'firerescue@dmc.gov.lk',
      password: 'password123',
      phone: '+94 72 112 2334',
      district: 'Galle',
      role: 'rescue_team',
      agency: 'DMC Fire & Rescue Unit - 01'
    });

    const evacuationRescueUser = await User.create({
      name: 'Inspector K. Wickramasinghe',
      username: 'evacuation_rescue',
      email: 'evacuationrescue@dmc.gov.lk',
      password: 'password123',
      phone: '+94 76 112 3456',
      district: 'Galle',
      role: 'rescue_team',
      agency: 'DMC Evacuation Support Unit - 01'
    });

    console.log('[Seeder] Users created successfully (including 4 Rescue Team units).');

    // 2. Create Shelters
    // 2. Create Shelters (matching Screen 4 for Colombo District)
    const shelter1 = await Shelter.create({
      name: 'Sugathadasa Indoor Complex',
      district: 'Colombo',
      location: {
        type: 'Point',
        coordinates: [79.865, 6.927],
        address: 'Mulleriyawa, Colombo'
      },
      totalCapacity: 4000,
      currentOccupancy: 2300,
      facilities: ['Medical Station', 'Clean Potable Water', 'Backup Power Generators', 'Child Care', 'Pet Friendly'],
      contactPerson: 'Director Marcus Vance',
      contactPhone: '+94 11 245 4001',
      status: 'open'
    });

    const shelter2 = await Shelter.create({
      name: 'Kolonnawa Central Vidyalaya',
      district: 'Colombo',
      location: {
        type: 'Point',
        coordinates: [79.885, 6.932],
        address: 'Kelanimulla, Colombo'
      },
      totalCapacity: 2000,
      currentOccupancy: 1200,
      facilities: ['Clean Water', 'Food Rations', 'First Aid'],
      contactPerson: 'Principal Eleanor Hall',
      contactPhone: '+94 11 245 4002',
      status: 'open'
    });

    const shelter3 = await Shelter.create({
      name: 'Sedawatta Rajamaha Vihara',
      district: 'Colombo',
      location: {
        type: 'Point',
        coordinates: [79.877, 6.953],
        address: 'Sedawatta, Colombo'
      },
      totalCapacity: 1200,
      currentOccupancy: 110,
      facilities: ['Clean Water', 'Emergency Mats', 'First Aid'],
      contactPerson: 'Chief Monk Ven. Ananda',
      contactPhone: '+94 11 245 4003',
      status: 'open'
    });

    // Galle District Shelters (matching Panel 3)
    const galleShelter1 = await Shelter.create({
      name: 'Galle Central College (Temporary Shelter)',
      district: 'Galle',
      location: {
        type: 'Point',
        coordinates: [80.218, 6.037],
        address: 'Galle Central College, Galle'
      },
      totalCapacity: 150,
      currentOccupancy: 120,
      facilities: ['Medical Station', 'Clean Water', 'Food Rations', 'First Aid'],
      contactPerson: 'Director K. Gunawardena',
      contactPhone: '+94 91 224 4001',
      status: 'open'
    });

    const galleShelter2 = await Shelter.create({
      name: 'Hikkaduwa School',
      district: 'Galle',
      location: {
        type: 'Point',
        coordinates: [80.101, 6.139],
        address: 'Hikkaduwa Road Safe Zone, Hikkaduwa'
      },
      totalCapacity: 100,
      currentOccupancy: 100,
      facilities: ['Clean Water', 'Food Rations', 'First Aid'],
      contactPerson: 'Principal Eleanor Hall',
      contactPhone: '+94 91 224 4002',
      status: 'full'
    });

    const galleShelter3 = await Shelter.create({
      name: 'Unawatuna Community Hall',
      district: 'Galle',
      location: {
        type: 'Point',
        coordinates: [80.248, 6.012],
        address: 'Main Beach Road Safe Center, Unawatuna'
      },
      totalCapacity: 80,
      currentOccupancy: 45,
      facilities: ['Clean Water', 'Emergency Beds', 'Child Care'],
      contactPerson: 'Council Officer M. Silva',
      contactPhone: '+94 91 224 4003',
      status: 'open'
    });

    const galleShelter4 = await Shelter.create({
      name: 'Baddegama Maha Vidyalaya',
      district: 'Galle',
      location: {
        type: 'Point',
        coordinates: [80.185, 6.189],
        address: 'Baddegama Main Junction, Baddegama'
      },
      totalCapacity: 120,
      currentOccupancy: 30,
      facilities: ['Emergency Power', 'Clean Water', 'Dry Rations'],
      contactPerson: 'Officer J. Perera',
      contactPhone: '+94 91 224 4004',
      status: 'open'
    });

    // 3. Create Resources
    await Resource.create([
      {
        name: 'Ready-to-Eat Meal Packs (MRE)',
        category: 'food_rations',
        quantity: 2500,
        unit: 'meals',
        shelterId: shelter1._id,
        status: 'in_stock'
      },
      {
        name: '500ml Bottled Clean Drinking Water',
        category: 'clean_water',
        quantity: 8000,
        unit: 'bottles',
        shelterId: shelter1._id,
        status: 'in_stock'
      },
      {
        name: 'Inflatable Flood Rescue Rafts',
        category: 'rescue_boats',
        quantity: 12,
        unit: 'rafts',
        shelterId: shelter2._id,
        status: 'in_stock'
      }
    ]);

    // 4. Create Incidents (20 total: 5 pending, 12 verified, 3 rejected)
    // Photos for realistic display
    const floodPhoto1 = 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1000&q=80';
    const floodPhoto2 = 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1000&q=80';
    const landslidePhoto = 'https://images.unsplash.com/photo-1602980085566-48358499c72e?auto=format&fit=crop&w=1000&q=80';
    const fallenTreePhoto = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1000&q=80';
    const roadDamagePhoto = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80';

    const incidentsData = [
      // --- 5 PENDING REPORTS ---
      {
        title: 'Flooding on Nagalagam Street',
        description: 'Heavy rain has caused flooding on Nagalagam Street. Water level is rising rapidly and blocking the road. Several vehicles are stuck and houses are affected. Residents are requesting immediate assistance.',
        disasterType: 'flood',
        severity: 'high',
        status: 'under_review',
        reportNumber: '#DR-20261010-001',
        reportedBy: volunteerJohn._id,
        location: { type: 'Point', coordinates: [79.8821, 6.9452], address: 'Kelanimulla, Colombo' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }, { url: floodPhoto2, resourceType: 'image' }],
        createdAt: new Date('2026-10-10T08:15:00Z')
      },
      {
        title: 'Flash flood near low bridge',
        description: 'Water level rising quickly around the low-lying bridge area. Pedestrian walkway is completely submerged.',
        disasterType: 'flood',
        severity: 'medium',
        status: 'under_review',
        reportNumber: '#DR-20261010-006',
        reportedBy: citizenNimal._id,
        location: { type: 'Point', coordinates: [79.8950, 6.9380], address: 'Kotikawatta, Colombo' },
        mediaUrls: [{ url: floodPhoto2, resourceType: 'image' }],
        createdAt: new Date('2026-10-10T07:45:00Z')
      },
      {
        title: 'Blocked drainage culvert causing road inundation',
        description: 'Massive accumulation of debris has clogged the canal gates, spilling muddy storm run-off into roadway.',
        disasterType: 'flood',
        severity: 'medium',
        status: 'under_review',
        reportNumber: '#DR-20261010-007',
        reportedBy: volunteerRuwan._id,
        location: { type: 'Point', coordinates: [79.8810, 6.9312], address: 'Kolonnawa, Colombo' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }],
        createdAt: new Date('2026-10-10T06:50:00Z')
      },
      {
        title: 'Mudslide risk on steep residential slope',
        description: 'Continuous heavy precipitation has caused preliminary mud slips on hillside slope behind 3 houses.',
        disasterType: 'landslide',
        severity: 'high',
        status: 'under_review',
        reportNumber: '#DR-20261010-008',
        reportedBy: volunteerKavinda._id,
        location: { type: 'Point', coordinates: [79.9830, 6.9328], address: 'Kaduwela, Colombo' },
        mediaUrls: [{ url: landslidePhoto, resourceType: 'image' }],
        createdAt: new Date('2026-10-10T06:10:00Z')
      },
      {
        title: 'Damaged culvert bridge warning',
        description: 'Flood currents have weakened the side foundation pillars of the bypass culvert. Vehicles risk falling through.',
        disasterType: 'other',
        severity: 'critical',
        status: 'under_review',
        reportNumber: '#DR-20261010-009',
        reportedBy: volunteerSahan._id,
        location: { type: 'Point', coordinates: [79.9548, 6.9042], address: 'Malabe, Colombo' },
        mediaUrls: [{ url: roadDamagePhoto, resourceType: 'image' }],
        createdAt: new Date('2026-10-10T05:25:00Z')
      },

      // --- 12 VERIFIED REPORTS ---
      {
        title: 'Flooding on Nugegoda Street',
        description: 'Heavy rainfall has caused flooding on Nugegoda Street. Water levels are rising and blocking the road. Several vehicles are affected, and access to nearby areas is restricted. More rainfall is expected.',
        disasterType: 'flood',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261010-003',
        reportedBy: volunteerJohn._id,
        location: { type: 'Point', coordinates: [79.8980, 6.8720], address: 'Kottawana, Colombo' },
        mediaUrls: [
          { url: floodPhoto1, resourceType: 'image' },
          { url: floodPhoto2, resourceType: 'image' },
          { url: roadDamagePhoto, resourceType: 'image' }
        ],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Ground patrol confirmed water depth reaching 2.5 ft. Police barricaded section and rescue teams alerted.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-10T09:15:00Z'),
        createdAt: new Date('2026-10-10T08:50:00Z')
      },
      {
        title: 'Small landslide near school',
        description: 'Soil and rock has fallen onto the road near the secondary school. Traffic is blocked and debris requires earthmover clearance.',
        disasterType: 'landslide',
        severity: 'medium',
        status: 'verified',
        reportNumber: '#DR-20261010-002',
        reportedBy: citizenNimal._id,
        location: { type: 'Point', coordinates: [79.9120, 6.9310], address: 'Watawala, Colombo' },
        mediaUrls: [{ url: landslidePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Verified with Grama Niladhari. Road clearance crew and backhoe dispatched to clear rocks.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-10T09:20:00Z'),
        createdAt: new Date('2026-10-10T07:30:00Z')
      },
      {
        title: 'Tree fallen on main road',
        description: 'Large banyan tree fallen across both lanes following strong wind squalls. High voltage electricity lines pulled down.',
        disasterType: 'heavy_rain',
        severity: 'medium',
        status: 'verified',
        reportNumber: '#DR-20261010-011',
        reportedBy: volunteerRuwan._id,
        location: { type: 'Point', coordinates: [79.8620, 6.8740], address: 'Wellawatta, Colombo' },
        mediaUrls: [{ url: fallenTreePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Municipal council tree-cutting crew deployed. CEB de-energized line.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-10T11:55:00Z'),
        createdAt: new Date('2026-10-10T11:20:00Z')
      },
      {
        title: 'Road collapsed due to heavy rain',
        description: 'Part of the road has collapsed due to embankment washaway. The section is impassable for two-way transit.',
        disasterType: 'other',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261009-004',
        reportedBy: volunteerKavinda._id,
        location: { type: 'Point', coordinates: [79.9180, 7.0250], address: 'Ragama, Gampaha' },
        mediaUrls: [{ url: roadDamagePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Police barricades deployed. RDA engineers notified for immediate shoring.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T15:30:00Z'),
        createdAt: new Date('2026-10-09T15:10:00Z')
      },
      {
        title: 'Flooding in residential area',
        description: 'Flood water depth has reached knee height in residential lanes. Several families moved to community center.',
        disasterType: 'flood',
        severity: 'medium',
        status: 'verified',
        reportNumber: '#DR-20261009-005',
        reportedBy: volunteerSahan._id,
        location: { type: 'Point', coordinates: [79.8880, 6.8920], address: 'Nawala, Colombo' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Relief camp opened at Nawala Community Hall. Dry rations provided.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T12:00:00Z'),
        createdAt: new Date('2026-10-09T11:45:00Z')
      },
      {
        title: 'Severe bank erosion along Kelani River',
        description: 'Heavy river volume eroding bund near residential boundary. Sandbags needed urgently.',
        disasterType: 'flood',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261009-010',
        reportedBy: volunteerJohn._id,
        location: { type: 'Point', coordinates: [79.8770, 6.9530], address: 'Sedawatta, Colombo' },
        mediaUrls: [{ url: floodPhoto2, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Navy disaster relief unit notified for sandbag reinforcement.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T10:15:00Z'),
        createdAt: new Date('2026-10-09T09:40:00Z')
      },
      {
        title: 'Electric pole fallen across road',
        description: 'Live power lines snapped after high winds uprooted pole. Road closed to avert electrocution hazard.',
        disasterType: 'other',
        severity: 'critical',
        status: 'verified',
        reportNumber: '#DR-20261009-011',
        reportedBy: volunteerRuwan._id,
        location: { type: 'Point', coordinates: [79.9560, 6.8450], address: 'Pannipitiya, Colombo' },
        mediaUrls: [{ url: fallenTreePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'CEB emergency line disconnected grid power. Repair crew on scene.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T08:30:00Z'),
        createdAt: new Date('2026-10-09T08:00:00Z')
      },
      {
        title: 'Canal overflow near hospital road',
        description: 'Spillover water obstructing outpatient access road. Ambulances rerouted through outer gate.',
        disasterType: 'flood',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261009-012',
        reportedBy: citizenNimal._id,
        location: { type: 'Point', coordinates: [79.8860, 6.9680], address: 'Peliyagoda, Gampaha' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'High-capacity water pumps installed to divert runoff.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T07:10:00Z'),
        createdAt: new Date('2026-10-09T06:30:00Z')
      },
      {
        title: 'Earth slip blocking rural bus route',
        description: 'Loose soil slipped onto bend on Avissawella highway. Heavy vehicle transit halted.',
        disasterType: 'landslide',
        severity: 'medium',
        status: 'verified',
        reportNumber: '#DR-20261009-013',
        reportedBy: volunteerKavinda._id,
        location: { type: 'Point', coordinates: [80.0820, 6.8910], address: 'Hanwella, Colombo' },
        mediaUrls: [{ url: landslidePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'NBRO geotechnical clearance received. Road cleared for single-lane flow.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-09T05:00:00Z'),
        createdAt: new Date('2026-10-09T04:20:00Z')
      },
      {
        title: 'Submerged railway crossing',
        description: 'Main coastal/northern rail corridor crossing flooded under 2 feet of backwater.',
        disasterType: 'flood',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261008-014',
        reportedBy: volunteerSahan._id,
        location: { type: 'Point', coordinates: [79.8920, 6.9910], address: 'Wattala, Gampaha' },
        mediaUrls: [{ url: floodPhoto2, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Sri Lanka Railways control room alerted. Train speeds restricted to 15km/h.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-08T16:00:00Z'),
        createdAt: new Date('2026-10-08T15:20:00Z')
      },
      {
        title: 'Roof torn by gale-force winds',
        description: 'Coastal gusts tore tin sheeting off 4 residential dwellings. Inhabitants evacuated to parish hall.',
        disasterType: 'cyclone',
        severity: 'medium',
        status: 'verified',
        reportNumber: '#DR-20261008-015',
        reportedBy: citizenNimal._id,
        location: { type: 'Point', coordinates: [79.8810, 6.7730], address: 'Moratuwa, Colombo' },
        mediaUrls: [{ url: roadDamagePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Tarpaulin kits and emergency shelter provisions dispatched.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-08T14:15:00Z'),
        createdAt: new Date('2026-10-08T13:45:00Z')
      },
      {
        title: 'Retaining wall crack post-heavy shower',
        description: '15-foot high masonry retaining wall exhibiting bulging structural fissures near lower roadway.',
        disasterType: 'landslide',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261008-016',
        reportedBy: volunteerJohn._id,
        location: { type: 'Point', coordinates: [79.9210, 6.8980], address: 'Battaramulla, Colombo' },
        mediaUrls: [{ url: landslidePhoto, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Danger tape cordoned. Residents in downhill path temporarily evacuated.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-08T11:30:00Z'),
        createdAt: new Date('2026-10-08T10:50:00Z')
      },
      {
        title: 'Industrial drain overflow contaminated water',
        description: 'Oily and chemical-laden runoff spilling into paddy fields after culvert flood overflow.',
        disasterType: 'industrial',
        severity: 'high',
        status: 'verified',
        reportNumber: '#DR-20261007-017',
        reportedBy: volunteerKavinda._id,
        location: { type: 'Point', coordinates: [79.9450, 6.9740], address: 'Sapugaskanda, Gampaha' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'Central Environmental Authority (CEA) inspection team notified.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-07T16:00:00Z'),
        createdAt: new Date('2026-10-07T15:10:00Z')
      },
      {
        title: 'Emergency evacuation required for stranded elderly',
        description: 'Rising flood waters trapped two senior citizens inside house on 4th Lane. Boat rescue required.',
        disasterType: 'flood',
        severity: 'critical',
        status: 'verified',
        reportNumber: '#DR-20261007-018',
        reportedBy: volunteerJohn._id,
        location: { type: 'Point', coordinates: [79.9210, 6.9340], address: 'Angoda, Colombo' },
        mediaUrls: [{ url: floodPhoto2, resourceType: 'image' }],
        verifiedBy: dutyOfficer._id,
        verificationNote: 'DMC rescue boat successfully evacuated individuals to Angoda hospital station.',
        forwardedToDmc: true,
        forwardedAt: new Date('2026-10-07T12:30:00Z'),
        createdAt: new Date('2026-10-07T11:30:00Z')
      },

      // --- 3 REJECTED REPORTS ---
      {
        title: 'Tree fallen on main road',
        description: 'Large tree fallen blocking the main road. Vehicles cannot pass.',
        disasterType: 'other',
        severity: 'medium',
        status: 'rejected',
        reportNumber: '#DR-20261009-003',
        reportedBy: volunteerRuwan._id,
        location: { type: 'Point', coordinates: [79.8610, 6.8740], address: 'Wellawatta, Colombo' },
        mediaUrls: [{ url: fallenTreePhoto, resourceType: 'image' }],
        rejectionNote: 'Duplicate report. Municipality disaster unit already removed the tree and road is clear.',
        createdAt: new Date('2026-10-09T17:20:00Z')
      },
      {
        title: 'Normal rainwater puddle reported as flood',
        description: 'Small pool of rainwater near shop pavement following brief shower.',
        disasterType: 'flood',
        severity: 'low',
        status: 'rejected',
        reportNumber: '#DR-20261008-019',
        reportedBy: citizenNimal._id,
        location: { type: 'Point', coordinates: [79.8660, 6.8510], address: 'Dehiwala, Colombo' },
        mediaUrls: [{ url: floodPhoto1, resourceType: 'image' }],
        rejectionNote: 'Puddle cleared within 15 minutes. No danger or disruption to traffic or residences.',
        createdAt: new Date('2026-10-08T18:00:00Z')
      },
      {
        title: 'Prank report / non-incident image',
        description: 'Outdated stock image uploaded with vague claim of road blockage.',
        disasterType: 'other',
        severity: 'low',
        status: 'rejected',
        reportNumber: '#DR-20261007-020',
        reportedBy: volunteerSahan._id,
        location: { type: 'Point', coordinates: [79.8970, 6.8650], address: 'Nugegoda, Colombo' },
        mediaUrls: [{ url: roadDamagePhoto, resourceType: 'image' }],
        rejectionNote: 'Image unrelated to current incident location. Identified as invalid duplicate.',
        createdAt: new Date('2026-10-07T19:30:00Z')
      }
    ];

    for (const inc of incidentsData) {
      await Incident.create(inc);
    }

    console.log('[Seeder] 20 Incidents created (5 pending, 12 verified, 3 rejected).');

    // 5. Create Active SOS Beacon
    await SosAlert.create({
      userId: citizenNimal._id,
      location: {
        type: 'Point',
        coordinates: [79.8821, 6.9452],
        address: 'Kelanimulla, Colombo'
      },
      batteryLevel: 42,
      emergencyType: 'flood_surround',
      peopleCount: 2,
      notes: 'Water level rising quickly in basement apartment, power is out. Two senior citizens.',
      status: 'ACTIVE'
    });

    console.log('[Seeder] Emergency SOS alert created.');

    // 6. Create Broadcast Warnings (4 Active, 2 Draft, 8 Completed)
    // Active Warnings (matching Panel 2 for District Officer and Citizen App)
    const activeBroadcasts = await AlertBroadcast.create([
      {
        title: 'Severe Flooding - Galle District',
        message: 'Severe flooding across multiple DS divisions in Galle District. Water levels along the Gin Ganga basin have reached dangerous levels. Low lying areas, arterial roads and residences are submerged. Evacuation operations underway.',
        disasterType: 'flood',
        severity: 'high',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Galle',
        affectedArea: { address: 'Multiple DS Divisions, Galle District', coordinates: [80.218, 6.037], radiusKm: 25 },
        actionInstructions: [
          'Evacuate immediately from Gin Ganga flood plain to designated shelters',
          'Avoid wading or driving through flood currents',
          'Disconnect electricity mains in affected buildings'
        ],
        emergencyHotlines: [{ name: 'Galle District DMC Command', phone: '+94 91 224 4380' }, { name: 'Emergency Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T08:30:00Z')
      },
      {
        title: 'Heavy Rainfall - Matara District',
        message: 'Persistent torrential rain exceeding 150mm recorded in southern coastal belt. Localized flash floods and road inundation reported.',
        disasterType: 'heavy_rain',
        severity: 'medium',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Matara',
        affectedArea: { address: 'Coastal Areas, Matara District', coordinates: [80.54, 5.95], radiusKm: 20 },
        actionInstructions: [
          'Stay indoors unless advised to evacuate',
          'Secure loose roof fixtures and lightweight outdoor belongings'
        ],
        emergencyHotlines: [{ name: 'Matara Disaster Desk', phone: '+94 41 222 2235' }, { name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T06:15:00Z')
      },
      {
        title: 'Landslide Risk - Ratnapura District',
        message: 'Level 2 Amber warning issued by NBRO for multiple slope cuts and tea estate communities in Ratnapura. Unstable soil conditions detected.',
        disasterType: 'landslide',
        severity: 'high',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Ratnapura',
        affectedArea: { address: 'Hillside Areas, Ratnapura District', coordinates: [80.40, 6.68], radiusKm: 30 },
        actionInstructions: [
          'Evacuate early if you observe slope cracks, leaning trees or muddy water seepage',
          'Do not linger near unstable mountain cuts or retaining walls'
        ],
        emergencyHotlines: [{ name: 'NBRO Emergency Desk', phone: '011 258 8946' }, { name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T05:40:00Z')
      },
      {
        title: 'Flooding on Nagalagam Street',
        message: 'Avoid the area and stay indoors. Water levels are rising fast on Nagalagam Street, blocking main transit routes.',
        disasterType: 'flood',
        severity: 'critical',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Colombo',
        affectedArea: { address: 'Kelanimulla, Colombo', coordinates: [79.8821, 6.9452], radiusKm: 10 },
        actionInstructions: [
          'Avoid the area and stay indoors.',
          'Shut off main electricity breaker if ground floor is inundated.',
          'Do not drive through standing flood waters.'
        ],
        emergencyHotlines: [{ name: 'DMC Hotline', phone: '117' }, { name: 'Suwa Seriya', phone: '1990' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T10:30:00Z')
      },
      {
        title: 'Landslide Risk',
        message: 'Slope instability warning near Mulleriyawa ridge following continuous rainfall.',
        disasterType: 'landslide',
        severity: 'high',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Colombo',
        affectedArea: { address: 'Mulleriyawa, Colombo', coordinates: [79.912, 6.931], radiusKm: 8 },
        actionInstructions: [
          'Residents on steep inclines should relocate to community shelters',
          'Stay alert for continuous rain and ground cracks.'
        ],
        emergencyHotlines: [{ name: 'NBRO Landslide Unit', phone: '011 258 8946' }, { name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T16:15:00Z')
      },
      {
        title: 'Heavy Rain Expected',
        message: 'Persistent squalls with precipitation exceeding 120mm expected in coastal and river plains.',
        disasterType: 'heavy_rain',
        severity: 'low',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Colombo',
        affectedArea: { address: 'Colombo District', coordinates: [79.865, 6.927], radiusKm: 25 },
        actionInstructions: [
          'Keep emergency packs ready.',
          'Fishermen advised not to venture out to deep sea.'
        ],
        emergencyHotlines: [{ name: 'DMC Command', phone: '011 213 6136' }, { name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2026-10-09T20:00:00Z')
      },
      {
        title: 'Coastal Flood Risk',
        message: 'High tidal swells combined with storm run-off causing sea surges near beach road and estuary.',
        disasterType: 'flood',
        severity: 'medium',
        status: 'active',
        isActive: true,
        affectedDistrict: 'Kalutara',
        affectedArea: { address: 'Kalutara coastal belt', coordinates: [79.96, 6.58], radiusKm: 18 },
        actionInstructions: [
          'Stay clear of exposed shoreline and sea-defense structures.',
          'Small craft remain in port.'
        ],
        emergencyHotlines: [{ name: 'Kalutara DMC Command', phone: '034 222 2588' }, { name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id,
        createdAt: new Date('2024-10-10T11:20:00Z')
      }
    ]);

    // 2 Draft Warnings
    await AlertBroadcast.create([
      {
        title: 'Monsoon Squall Advisory – Gampaha District',
        message: 'Draft advisory for anticipated gusty winds and tree falls along major highways in Gampaha.',
        disasterType: 'extreme_wind',
        severity: 'medium',
        status: 'draft',
        isActive: false,
        affectedDistrict: 'Gampaha',
        actionInstructions: ['Trim hazardous tree limbs near houses', 'Check roofing sheets'],
        emergencyHotlines: [{ name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id
      },
      {
        title: 'Reservoir Spillway Discharge Notice – Kelani Valley',
        message: 'Draft warning: Water release from upstream spillways may elevate river stage by 1.2 meters over 12 hours.',
        disasterType: 'flood',
        severity: 'high',
        status: 'draft',
        isActive: false,
        affectedDistrict: 'Colombo',
        actionInstructions: ['Avoid washing or bathing near river banks'],
        emergencyHotlines: [{ name: 'DMC Hotline', phone: '117' }],
        issuedBy: dmcOfficer._id
      }
    ]);

    // 8 Completed Warnings (matching Panel 6 with postEventAnalysis)
    await AlertBroadcast.create([
      {
        title: 'Flooding – Nugegoda Street',
        message: 'Flood waters have receded completely. Roadway cleared and open to general vehicular movement.',
        disasterType: 'flood',
        severity: 'critical',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Colombo',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-11T10:30:00Z'),
        createdAt: new Date('2024-10-10T09:15:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 12450,
          peopleReached: 432850,
          reportsReceived: 326,
          impactSummary: 'Several roads flooded, 2 houses affected.',
          remarks: 'Early warning system helped in local rescue efforts.'
        }
      },
      {
        title: 'Landslide Risk – Mahawela School',
        message: 'Slope stabilization completed by NBRO engineering corps. Safe for return.',
        disasterType: 'landslide',
        severity: 'high',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Nuwara Eliya',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-11T11:45:00Z'),
        createdAt: new Date('2024-10-10T09:20:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 4200,
          peopleReached: 85200,
          reportsReceived: 78,
          impactSummary: 'Debris blocked secondary access road. School was evacuated in advance.',
          remarks: 'NBRO geological survey cleared premises for normal operations.'
        }
      },
      {
        title: 'Heavy Rain Warning – Galle District',
        message: 'Precipitation fallen below warning threshold. River gauges stabilized at normal levels.',
        disasterType: 'heavy_rain',
        severity: 'high',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Galle',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-11T09:30:00Z'),
        createdAt: new Date('2024-10-10T10:30:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 8900,
          peopleReached: 198000,
          reportsReceived: 142,
          impactSummary: 'Minor localized ponding on coastal highways. No casualties.',
          remarks: 'All irrigation culvert gates cleared ahead of storm surge.'
        }
      },
      {
        title: 'Urban Flash Flood – Kelani Basin',
        message: 'Kelani river discharge returned below minor flood stage.',
        disasterType: 'flood',
        severity: 'high',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Colombo',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-09T18:00:00Z'),
        createdAt: new Date('2024-10-08T07:00:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 15600,
          peopleReached: 510000,
          reportsReceived: 410,
          impactSummary: 'Submerged paddy fields and 5 perimeter access lanes.',
          remarks: 'Navy inflatable boats provided prompt transit to shelter.'
        }
      },
      {
        title: 'High Wind Warning – Kalutara Coast',
        message: 'Coastal gale subsided. Marine vessels safe to operate.',
        disasterType: 'extreme_wind',
        severity: 'medium',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Kalutara',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-08T15:00:00Z'),
        createdAt: new Date('2024-10-07T12:00:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 6300,
          peopleReached: 142000,
          reportsReceived: 54,
          impactSummary: 'Roofing tile damage to 4 beachside structures.',
          remarks: 'Harbour master warning complied with 100% adherence.'
        }
      },
      {
        title: 'Lightning Strike Advisory – Ratnapura',
        message: 'Convective storm system dissipated over Sabaragamuwa hills.',
        disasterType: 'heavy_rain_lightning',
        severity: 'medium',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Ratnapura',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-07T21:00:00Z'),
        createdAt: new Date('2024-10-07T14:00:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 5400,
          peopleReached: 98000,
          reportsReceived: 39,
          impactSummary: 'Transformer trip restored within 45 minutes.',
          remarks: 'CEB emergency line responded rapidly.'
        }
      },
      {
        title: 'River Level Surge – Kalu Ganga',
        message: 'Kalu Ganga river level dropped 1.5m below warning mark.',
        disasterType: 'flood',
        severity: 'high',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Kalutara',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-06T16:00:00Z'),
        createdAt: new Date('2024-10-05T08:00:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 11200,
          peopleReached: 310000,
          reportsReceived: 188,
          impactSummary: 'Millaniya road flooded for 6 hours before receding.',
          remarks: 'Sandbag barriers protected critical low-level pump station.'
        }
      },
      {
        title: 'Severe Weather Advisory – Southern Province',
        message: 'Weather disturbance cleared Sri Lankan airspace.',
        disasterType: 'extreme_wind',
        severity: 'low',
        status: 'completed',
        isActive: false,
        affectedDistrict: 'Matara',
        issuedBy: dmcOfficer._id,
        completedBy: dmcOfficer._id,
        completedAt: new Date('2024-10-05T12:00:00Z'),
        createdAt: new Date('2024-10-04T10:00:00Z'),
        postEventAnalysis: {
          totalAlertsSent: 7800,
          peopleReached: 180000,
          reportsReceived: 42,
          impactSummary: 'Light vegetation fallen on coastal rail track.',
          remarks: 'Railway inspection crew completed track clearance.'
        }
      }
    ]);

    console.log('[Seeder] Disaster Broadcast Alert created.');

    // 7. Create Rescue Teams (4 Seeded Categories for Galle & Southern Region)
    // Water Rescue Teams (3 total)
    const waterTeam1 = await RescueTeam.create({
      name: 'Water Rescue Team - 01',
      type: 'water_rescue',
      typeName: 'Water Rescue Team',
      district: 'Galle',
      membersCount: 6,
      vehicle: 'Inflatable Boat WB-04 (Twin 40HP Outboard)',
      leaderName: 'Commander Rohan Senanayake',
      contactPhone: '+94 77 987 6543',
      status: 'en_route',
      currentLocation: {
        latitude: 6.046,
        longitude: 80.216,
        address: 'En route near Nagoda Junction, Galle'
      }
    });

    const waterTeam2 = await RescueTeam.create({
      name: 'Water Rescue Team - 02',
      type: 'water_rescue',
      typeName: 'Water Rescue Team',
      district: 'Galle',
      membersCount: 5,
      vehicle: 'Rigid Inflatable Craft WB-07',
      leaderName: 'Lt. N. Fernando',
      contactPhone: '+94 77 223 3445',
      status: 'available',
      currentLocation: { latitude: 6.037, longitude: 80.218, address: 'Galle Harbour Rescue Jetty' }
    });

    const waterTeam3 = await RescueTeam.create({
      name: 'Water Rescue Team - 03',
      type: 'water_rescue',
      typeName: 'Water Rescue Team',
      district: 'Galle',
      membersCount: 6,
      vehicle: 'Aluminium Flat-Bottom Boat WB-09',
      leaderName: 'Officer P. Bandara',
      contactPhone: '+94 77 445 5667',
      status: 'available',
      currentLocation: { latitude: 6.138, longitude: 80.125, address: 'Hikkaduwa Command Depot' }
    });

    // Medical Response Teams (4 total)
    const medicalTeams = await RescueTeam.create([
      {
        name: 'Medical Response Team - 01',
        type: 'medical_response',
        typeName: 'Medical Response Team',
        district: 'Galle',
        membersCount: 4,
        vehicle: 'Advanced Trauma Ambulance MED-01',
        leaderName: 'Dr. Priyantha Silva',
        contactPhone: '+94 71 334 5566',
        status: 'available',
        currentLocation: { latitude: 6.035, longitude: 80.225, address: 'Karapitiya Hospital Staging Post' }
      },
      {
        name: 'Medical Response Team - 02',
        type: 'medical_response',
        typeName: 'Medical Response Team',
        district: 'Galle',
        membersCount: 4,
        vehicle: 'Rapid Emergency Ambulance MED-02',
        leaderName: 'Dr. Anusha Wickrama',
        contactPhone: '+94 71 556 7788',
        status: 'available',
        currentLocation: { latitude: 6.037, longitude: 80.218, address: 'Galle Municipal Dispensary' }
      },
      {
        name: 'Medical Response Team - 03',
        type: 'medical_response',
        typeName: 'Medical Response Team',
        district: 'Galle',
        membersCount: 3,
        vehicle: 'First Response Van MED-03',
        leaderName: 'Nurse Supun Kaviratne',
        contactPhone: '+94 71 889 9900',
        status: 'available',
        currentLocation: { latitude: 6.138, longitude: 80.125, address: 'Hikkaduwa Health Center' }
      },
      {
        name: 'Medical Response Team - 04',
        type: 'medical_response',
        typeName: 'Medical Response Team',
        district: 'Galle',
        membersCount: 4,
        vehicle: 'Mobile Clinic MC-01',
        leaderName: 'Officer M. Jayasinghe',
        contactPhone: '+94 71 443 2211',
        status: 'available',
        currentLocation: { latitude: 6.189, longitude: 80.185, address: 'Baddegama Field Hospital' }
      }
    ]);

    // Fire & Rescue Teams (2 total)
    const fireTeams = await RescueTeam.create([
      {
        name: 'Fire & Rescue Team - 01',
        type: 'fire_rescue',
        typeName: 'Fire & Rescue Team',
        district: 'Galle',
        membersCount: 8,
        vehicle: 'Heavy Water Tender & Rescue FT-05',
        leaderName: 'Captain S. Jayatilleke',
        contactPhone: '+94 72 112 2334',
        status: 'available',
        currentLocation: { latitude: 6.038, longitude: 80.215, address: 'Galle City Fire Brigade Station' }
      },
      {
        name: 'Fire & Rescue Team - 02',
        type: 'fire_rescue',
        typeName: 'Fire & Rescue Team',
        district: 'Galle',
        membersCount: 6,
        vehicle: 'Technical Rescue Truck FT-08',
        leaderName: 'Lt. K. Dias',
        contactPhone: '+94 72 334 4556',
        status: 'available',
        currentLocation: { latitude: 6.101, longitude: 80.139, address: 'Ambalangoda Sub-Station' }
      }
    ]);

    // Evacuation Support Teams (5 total)
    const evacTeams = await RescueTeam.create([
      {
        name: 'Evacuation Support Team - 01',
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        district: 'Galle',
        membersCount: 10,
        vehicle: '32-Seater Evacuation Bus EV-01',
        leaderName: 'Inspector K. Wickramasinghe',
        contactPhone: '+94 76 112 3456',
        status: 'available',
        currentLocation: { latitude: 6.037, longitude: 80.218, address: 'Galle District Secretariat Base' }
      },
      {
        name: 'Evacuation Support Team - 02',
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        district: 'Galle',
        membersCount: 8,
        vehicle: 'All-Terrain Transport Bus EV-02',
        leaderName: 'Officer H. Mendis',
        contactPhone: '+94 76 223 4567',
        status: 'available',
        currentLocation: { latitude: 6.138, longitude: 80.125, address: 'Hikkaduwa Depo' }
      },
      {
        name: 'Evacuation Support Team - 03',
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        district: 'Galle',
        membersCount: 8,
        vehicle: 'High-Clearance Transport Truck EV-03',
        leaderName: 'Officer T. Ranatunga',
        contactPhone: '+94 76 334 5678',
        status: 'available',
        currentLocation: { latitude: 6.189, longitude: 80.185, address: 'Baddegama Staging Ground' }
      },
      {
        name: 'Evacuation Support Team - 04',
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        district: 'Galle',
        membersCount: 6,
        vehicle: 'Rapid Response People Van EV-04',
        leaderName: 'Officer R. Karunaratne',
        contactPhone: '+94 76 445 6789',
        status: 'available',
        currentLocation: { latitude: 6.012, longitude: 80.248, address: 'Unawatuna Safe Center' }
      },
      {
        name: 'Evacuation Support Team - 05',
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        district: 'Galle',
        membersCount: 6,
        vehicle: 'Emergency Transit Van EV-05',
        leaderName: 'Officer D. Samaraweera',
        contactPhone: '+94 76 556 7890',
        status: 'available',
        currentLocation: { latitude: 6.037, longitude: 80.218, address: 'Galle Fort Staging Unit' }
      }
    ]);

    console.log('[Seeder] 14 Rescue Teams created across 4 categories.');

    // 8. Create Active Rescue Missions for all 4 categories (matching mobile app screens)
    const severeFloodAlert = activeBroadcasts[0]; // Severe Flooding

    // 1. Water Rescue Mission (Matches Screens 2-6 exactly)
    const waterMission = await RescueMission.create({
      title: 'Flood Rescue Operation',
      disasterEventId: severeFloodAlert._id,
      district: 'Kandy District',
      severity: 'high',
      destination: {
        address: 'Rambukkana - Ginigathena Road (near Alawathugoda Bridge)',
        latitude: 7.2906,
        longitude: 80.6337
      },
      startLocation: {
        address: 'Hikkaduwa Command Depot, Galle',
        latitude: 6.138,
        longitude: 80.125
      },
      teamId: waterTeam1._id,
      teamName: 'Water Rescue Team - 01',
      teamType: 'water_rescue',
      dispatchedBy: districtOfficer._id,
      status: 'assigned',
      instructions: [
        'Rescue stranded civilians (priority: children, elderly).',
        'Coordinate with local authorities.',
        'Ensure team safety (fast flowing water).',
        'Report situation updates regularly.'
      ],
      description: 'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe location.',
      timeline: {
        assignedAt: new Date(Date.now() - 3600000)
      },
      latestUpdate: {
        message: 'Arrived at destination – beginning rescue operations.',
        timestamp: new Date(Date.now() - 600000)
      },
      trackingActive: true
    });
    waterTeam1.activeMissionId = waterMission._id;
    await waterTeam1.save();

    // 2. Medical Response Mission
    const medicalMission = await RescueMission.create({
      title: 'Flood Rescue - Emergency Medical Triage',
      disasterEventId: severeFloodAlert._id,
      district: 'Kandy District',
      severity: 'high',
      destination: {
        address: 'Alawathugoda Bridge Emergency Medical Triage Post',
        latitude: 7.2915,
        longitude: 80.635
      },
      startLocation: {
        address: 'Karapitiya Field Hospital Staging Post',
        latitude: 6.035,
        longitude: 80.225
      },
      teamId: medicalTeams[0]._id,
      teamName: 'Medical Response Team - 01',
      teamType: 'medical_response',
      dispatchedBy: districtOfficer._id,
      status: 'assigned',
      instructions: [
        'Provide emergency medical care and first aid to survivors.',
        'Stabilize hypothermia and trauma victims.'
      ],
      description: 'Medical field unit assigned to triage and treat flash flood victims at Alawathugoda Bridge.',
      timeline: { assignedAt: new Date(Date.now() - 3000000) },
      trackingActive: true
    });
    medicalTeams[0].activeMissionId = medicalMission._id;
    await medicalTeams[0].save();

    // 3. Fire & Rescue Mission
    const fireMission = await RescueMission.create({
      title: 'Debris Clearance & Technical Rescue',
      disasterEventId: severeFloodAlert._id,
      district: 'Kandy District',
      severity: 'high',
      destination: {
        address: 'Ginigathena Road Landslide Sector 3',
        latitude: 7.288,
        longitude: 80.628
      },
      startLocation: {
        address: 'Galle City Fire Station',
        latitude: 6.038,
        longitude: 80.215
      },
      teamId: fireTeams[0]._id,
      teamName: 'Fire & Rescue Team - 01',
      teamType: 'fire_rescue',
      dispatchedBy: districtOfficer._id,
      status: 'assigned',
      instructions: [
        'Clear fallen timber and mudslides blocking emergency evacuation routes.'
      ],
      description: 'Technical rescue and route clearance to ensure access for relief convoys.',
      timeline: { assignedAt: new Date(Date.now() - 2500000) },
      trackingActive: true
    });
    fireTeams[0].activeMissionId = fireMission._id;
    await fireTeams[0].save();

    // 4. Evacuation Support Mission
    const evacMission = await RescueMission.create({
      title: 'Flood Evacuation & Transit Assistance',
      disasterEventId: severeFloodAlert._id,
      district: 'Kandy District',
      severity: 'high',
      destination: {
        address: 'Rambukkana Safe Corridor & Shelter Pickup Point',
        latitude: 7.294,
        longitude: 80.639
      },
      startLocation: {
        address: 'Galle District Secretariat Base',
        latitude: 6.037,
        longitude: 80.218
      },
      teamId: evacTeams[0]._id,
      teamName: 'Evacuation Support Team - 01',
      teamType: 'evacuation_support',
      dispatchedBy: districtOfficer._id,
      status: 'assigned',
      instructions: [
        'Transport evacuees from flood perimeter to designated community shelters.'
      ],
      description: 'Mass transit of stranded citizens to emergency shelters.',
      timeline: { assignedAt: new Date(Date.now() - 2000000) },
      trackingActive: true
    });
    evacTeams[0].activeMissionId = evacMission._id;
    await evacTeams[0].save();

    console.log('[Seeder] 4 Active Rescue Missions created across all specializations.');

    console.log('----------------------------------------------------');
    console.log('DATABASE SEEDING COMPLETE!');
    console.log('Seeded Accounts:');
    console.log('  District Officer: districtofficer@dmc.gov.lk (or district_officer) / password123');
    console.log('  Rescue Team:      rescueteam@dmc.gov.lk (or rescue_team) / password123');
    console.log('  DMC Officer:      dmcofficer@dmc.gov.lk (or dmc_officer) / password123');
    console.log('  Duty Officer:     dutyofficer@dmc.gov.lk (or duty_officer) / password123');
    console.log('  Volunteer:        john@example.com (or volunteer) / password123');
    console.log('  Admin:            admin@disaster.org (or admin) / password123');
    console.log('  Citizen:          nimal@example.com (or citizen) / password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
