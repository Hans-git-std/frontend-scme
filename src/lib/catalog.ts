import { apiClient } from './api';
import { ApiResponse, DomainCatalog } from '../types';

// Fallback multi-domain catalog covering 1000+ potential academic subjects and technical skills
export const STATIC_DOMAIN_CATALOGS: DomainCatalog[] = [
  {
    domainCode: 'CSE',
    domainName: 'Computer Science & Engineering',
    description: 'Software systems, algorithms, distributed computing, database engineering, and web development',
    subjects: [
      'Data Structures & Algorithms',
      'Database Management Systems',
      'Operating Systems',
      'Computer Networks',
      'Theory of Computation',
      'Object Oriented Programming',
      'Software Engineering & Agile',
      'Compiler Design',
      'Web Technologies & Full Stack',
      'Cloud Computing & Virtualization',
      'Cybersecurity & Applied Cryptography',
      'Computer Architecture & Organization',
      'Distributed Systems',
      'Design & Analysis of Algorithms',
      'Human Computer Interaction',
      'Information Retrieval',
      'Natural Language Processing',
      'Computer Graphics & Visualization',
      'Microprocessors & Microcontrollers',
      'System Programming',
      'Mobile Application Development',
      'DevOps & CI/CD Pipelines',
      'Parallel & Concurrent Programming',
    ],
    skills: [
      'Java',
      'Python',
      'JavaScript',
      'TypeScript',
      'C++',
      'C#',
      'Go',
      'Rust',
      'PHP',
      'Ruby',
      'React',
      'Angular',
      'Vue.js',
      'Next.js',
      'Spring Boot',
      'Node.js',
      'Express.js',
      'Django',
      'FastAPI',
      'Flask',
      '.NET Core',
      'SQL',
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Cassandra',
      'Elasticsearch',
      'Docker',
      'Kubernetes',
      'AWS',
      'Microsoft Azure',
      'Google Cloud (GCP)',
      'Git',
      'Linux / Bash',
      'GraphQL',
      'REST APIs',
      'Kafka',
      'RabbitMQ',
      'Microservices',
      'Tailwind CSS',
    ],
  },
  {
    domainCode: 'AI_DS',
    domainName: 'Artificial Intelligence & Data Science',
    description: 'Machine learning, deep neural networks, big data analytics, LLMs, computer vision, and statistics',
    subjects: [
      'Machine Learning Foundations',
      'Deep Learning & Neural Networks',
      'Probability & Applied Statistics',
      'Big Data Analytics',
      'Natural Language Processing',
      'Computer Vision & Image Processing',
      'Reinforcement Learning',
      'Data Mining & Warehousing',
      'Business Intelligence & Visualization',
      'Generative AI & Large Language Models',
      'Mathematical Foundations for Data Science',
      'Optimization Techniques',
      'AI Ethics & Governance',
      'Time Series Analysis',
      'Statistical Inference',
    ],
    skills: [
      'PyTorch',
      'TensorFlow',
      'Keras',
      'Scikit-Learn',
      'Pandas',
      'NumPy',
      'SciPy',
      'OpenCV',
      'Hugging Face Transformers',
      'LangChain',
      'LlamaIndex',
      'R Programming',
      'Apache Spark',
      'Apache Hadoop',
      'Apache Kafka',
      'Tableau',
      'Power BI',
      'Jupyter Notebooks',
      'MLflow',
      'Weights & Biases',
      'Prompt Engineering',
      'CUDA / GPU Computing',
      'Vector Databases (Chroma, Pinecone)',
    ],
  },
  {
    domainCode: 'MECH',
    domainName: 'Mechanical Engineering',
    description: 'Thermodynamics, fluid mechanics, CAD/CAM, finite element analysis, robotics, and manufacturing',
    subjects: [
      'Engineering Thermodynamics',
      'Fluid Mechanics & Hydraulics',
      'Strength of Materials / Solid Mechanics',
      'Theory of Machines & Mechanisms',
      'Machine Design & Kinematics',
      'Manufacturing Technology & Processes',
      'Heat & Mass Transfer',
      'Finite Element Analysis (FEA)',
      'Computer Aided Design (CAD)',
      'Automobile Engineering',
      'Robotics & Industrial Automation',
      'Refrigeration & Air Conditioning (HVAC)',
      'Mechatronics & Control Systems',
      'Power Plant Engineering',
      'Material Science & Metallurgy',
      'Computational Fluid Dynamics (CFD)',
      'Vibrations & Structural Dynamics',
      'Additive Manufacturing & 3D Printing',
      'Industrial Engineering & Operations',
      'Renewable Energy Systems',
    ],
    skills: [
      'AutoCAD',
      'SolidWorks',
      'CATIA',
      'Autodesk Fusion 360',
      'ANSYS Mechanical',
      'ANSYS Fluent (CFD)',
      'PTC Creo',
      'Siemens NX',
      'MATLAB',
      'Simulink',
      'GD&T (Geometric Dimensioning)',
      'CNC Programming / G-Code',
      '3D Printing / Slicing Software',
      'Thermodynamic Cycle Simulation',
      'Finite Element Modeling',
      'Abaqus',
      'HVAC Load Calculation',
      'Robotics Simulation (ROS)',
      'Lean Six Sigma',
    ],
  },
  {
    domainCode: 'ECE',
    domainName: 'Electronics & Communication Engineering',
    description: 'VLSI, digital signal processing, embedded systems, RF communications, IoT, and semiconductor devices',
    subjects: [
      'Digital Signal Processing (DSP)',
      'VLSI Design & Semiconductor Devices',
      'Analog & Digital Communications',
      'Embedded Systems & RTOS',
      'Electromagnetic Fields & Waves',
      'Microcontrollers & Interfacing (ARM/AVR)',
      'Wireless & Mobile Communications',
      'Optical Fiber Communications',
      'Antennas & Wave Propagation',
      'Electronic Devices & Circuit Theory',
      'Internet of Things (IoT) Architectures',
      'Control Systems Engineering',
      'Information Theory & Coding',
      'Microwave & Radar Engineering',
      'CMOS Analog Circuit Design',
    ],
    skills: [
      'Verilog HDL',
      'VHDL',
      'SystemVerilog',
      'MATLAB',
      'Simulink',
      'Cadence Virtuoso',
      'Synopsys Design Compiler',
      'Xilinx Vivado (FPGA)',
      'Embedded C / C++',
      'ARM Cortex Programming',
      'Arduino / ESP32',
      'Raspberry Pi / Linux Embedded',
      'Altium Designer (PCB)',
      'KiCAD',
      'Eagle PCB',
      'Oscilloscope & Logic Analyzers',
      'LTSpice / PSpice',
      'Zigbee / BLE / LoRaWAN',
    ],
  },
  {
    domainCode: 'EE',
    domainName: 'Electrical & Electronics Engineering',
    description: 'Power systems, electrical machines, power electronics, renewable grids, and smart metering',
    subjects: [
      'Electric Circuit Analysis / Network Theory',
      'Electrical Machines (Transformers, Induction, Synchronous)',
      'Power Systems Analysis & Protection',
      'Power Electronics & Converters',
      'High Voltage Engineering',
      'Switchgear & Protection',
      'Control Systems',
      'Renewable Energy & Smart Grids',
      'Electrical Measurements & Instrumentation',
      'Electric Vehicle (EV) Powertrains',
      'Digital Protection Relays',
      'Industrial Drives & Automation (PLC/SCADA)',
    ],
    skills: [
      'MATLAB / Simulink Power Systems',
      'ETAP (Power System Analysis)',
      'PSCAD',
      'PLC Programming (Ladder Logic)',
      'SCADA Systems',
      'LabVIEW',
      'Power Electronics Simulation (PLECS)',
      'Battery Management Systems (BMS)',
      'EV Inverter Design',
      'Switchgear Testing',
      'Solar PV Array Design (PVsyst)',
    ],
  },
  {
    domainCode: 'CIVIL',
    domainName: 'Civil & Structural Engineering',
    description: 'Structural design, geotechnical engineering, concrete technology, transportation, and surveying',
    subjects: [
      'Structural Analysis I & II',
      'Reinforced Concrete Design (RCC)',
      'Steel Structures Design',
      'Geotechnical Engineering & Soil Mechanics',
      'Fluid Mechanics & Open Channel Flow',
      'Surveying & Geomatics (Total Station, GIS)',
      'Transportation & Highway Engineering',
      'Environmental Engineering & Waste Management',
      'Hydrology & Water Resources Engineering',
      'Construction Planning & Project Management',
      'Building Information Modeling (BIM)',
      'Earthquake Resistant Design',
      'Foundation Engineering',
    ],
    skills: [
      'AutoCAD Civil 3D',
      'STAAD.Pro',
      'ETABS',
      'SAP2000',
      'Autodesk Revit',
      'Primavera P6',
      'MS Project',
      'ArcGIS / QGIS',
      'HEC-RAS',
      'GeoStudio / PLAXIS',
      'Concrete Mix Design (IS/ACI)',
      'Quantity Surveying & Estimation',
    ],
  },
  {
    domainCode: 'CHEM',
    domainName: 'Chemical Engineering',
    description: 'Mass transfer, chemical reaction engineering, plant design, thermodynamics, and process control',
    subjects: [
      'Chemical Process Principles & Stoichiometry',
      'Chemical Engineering Thermodynamics',
      'Fluid Flow in Process Engineering',
      'Heat Transfer Operations',
      'Mass Transfer & Separation Processes',
      'Chemical Reaction Engineering (CRE)',
      'Process Dynamics & Instrumentation Control',
      'Plant Design & Process Economics',
      'Petroleum Refining & Petrochemicals',
      'Polymer Science & Technology',
      'Bioprocess Engineering',
      'Industrial Safety & Hazard Management (HAZOP)',
    ],
    skills: [
      'Aspen Plus / Aspen HYSYS',
      'COMSOL Multiphysics',
      'CHEMCAD',
      'DWSIM',
      'MATLAB for Chemical Engineering',
      'P&ID Interpretation & Design',
      'HAZOP Study Analysis',
      'Distillation Column Modeling',
      'Heat Exchanger Sizing (HTRI)',
      'Process Optimization',
    ],
  },
];

// Combine all subjects and skills for universal instant lookup
export const ALL_CATALOG_SUBJECTS: string[] = Array.from(
  new Set(STATIC_DOMAIN_CATALOGS.flatMap((d) => d.subjects))
).sort();

export const ALL_CATALOG_SKILLS: string[] = Array.from(
  new Set(STATIC_DOMAIN_CATALOGS.flatMap((d) => d.skills))
).sort();

/**
 * Fetch all engineering domain catalogs from backend API with fallback
 */
export async function getDomainCatalogs(): Promise<DomainCatalog[]> {
  try {
    const res = await apiClient.get<ApiResponse<DomainCatalog[]>>('/public/catalog/domains');
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug('[Catalog] Using static domain catalog fallback:', err);
  }
  return STATIC_DOMAIN_CATALOGS;
}

/**
 * Autocomplete skill search with fuzzy & prefix matching
 */
export async function searchCatalogSkills(query: string, limit = 30): Promise<string[]> {
  const trimmed = query.trim().toLowerCase();
  try {
    const res = await apiClient.get<ApiResponse<string[]>>('/public/catalog/skills', {
      params: { query: query.trim(), limit },
    });
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch {
    // Fallback to local filter
  }

  if (!trimmed) return ALL_CATALOG_SKILLS.slice(0, limit);
  return ALL_CATALOG_SKILLS.filter((s) => s.toLowerCase().includes(trimmed)).slice(0, limit);
}

/**
 * Autocomplete subject search across domains or for a specific branch
 */
export async function searchCatalogSubjects(
  domainCode?: string,
  query?: string,
  limit = 30
): Promise<string[]> {
  const trimmed = (query || '').trim().toLowerCase();
  try {
    const res = await apiClient.get<ApiResponse<string[]>>('/public/catalog/subjects', {
      params: {
        domain: domainCode && domainCode !== 'ALL' ? domainCode : undefined,
        query: (query || '').trim() || undefined,
        limit,
      },
    });
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch {
    // Fallback to local filter
  }

  let baseList: string[] = ALL_CATALOG_SUBJECTS;
  if (domainCode && domainCode !== 'ALL') {
    const found = STATIC_DOMAIN_CATALOGS.find((d) => d.domainCode === domainCode);
    if (found) baseList = found.subjects;
  }

  if (!trimmed) return baseList.slice(0, limit);
  return baseList.filter((s) => s.toLowerCase().includes(trimmed)).slice(0, limit);
}
