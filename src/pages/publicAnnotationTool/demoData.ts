import { t } from '../../i18n';
import type { PublicAnnotationInput } from '../../annotation/schema';
import i18next from 'i18next';
import { v4 as uuid } from 'uuid';

export interface DemoScene {
  id: string;
  name: string;
  input?: PublicAnnotationInput | string;
  onlyChinese?: boolean;
}
export interface DemoCategory {
  id: string;
  name: string;
  sub: DemoScene[];
  onlyChinese?: boolean;
}

// Keep translation keys in the catalog. The SDK initializes i18next after this
// module can be imported, so translated labels must be resolved when displayed.
const demoData: DemoCategory[] = [
  {
    id: uuid(),
    name: 'Auto labeling',
    sub: [
      {
        id: uuid(),
        name: 'OCR / PDF to Markdown',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/441772794830143488.json',
      },
      {
        id: uuid(),
        name: 'QA pair extraction',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/441789461077307392.json',
      },
      {
        id: uuid(),
        name: 'Multilingual ASR',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/423665371392905216.json',
      },
      {
        id: uuid(),
        name: 'Interactive object detection and segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/423681505882554368.json',
      },
      {
        id: uuid(),
        name: 'Image captioning',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/423681467173322752.json',
      },
      {
        id: uuid(),
        name: 'Interactive 3D detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/246741262940639232.json',
      },
      {
        id: uuid(),
        name: '4D lane annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/380981267438637056.json',
      },
      {
        id: uuid(),
        name: 'SAM segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/520920512965386240.json',
      },
      {
        id: uuid(),
        name: 'Portrait segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/445843239917203456.json',
      },
      {
        id: uuid(),
        name: 'Small object detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Auto Labeling/302384951205442531.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Autonomous driving',
    sub: [
      {
        id: uuid(),
        name: '4D lanes, curbs, road markings, traffic lights, and topology',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/421963395660005376.json',
      },
      {
        id: uuid(),
        name: 'BEV lane and curb annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/335372057519071232.json',
      },
      {
        id: uuid(),
        name: 'OCC-4D semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/412096689311326208.json',
      },
      {
        id: uuid(),
        name: 'OCC-3D consecutive and merged frame semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/466062174972940288.json',
      },
      {
        id: uuid(),
        name: '2D lane and curb segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/423682412397477888.json',
      },
      {
        id: uuid(),
        name: 'Joint 3D and 2D object tracking (driving)',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/240959512364847104.json',
      },
      {
        id: uuid(),
        name: '2D obstacle, traffic light, road sign, and road marking tracking',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/388312402649034752.json',
      },
      {
        id: uuid(),
        name: '3D panoramic semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/326976501180809216.json',
      },
      {
        id: uuid(),
        name: '4D BEV parking road marking annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/350539503544438784.json',
      },
      {
        id: uuid(),
        name: '4D drivable area annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/396132842201161728.json',
      },
      {
        id: uuid(),
        name: 'BEV drivable area segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/387787431250112512.json',
      },
      {
        id: uuid(),
        name: '4D BEV parking space and obstacle tracking',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/390382764446593024.json',
      },
      {
        id: uuid(),
        name: 'Joint 3D and 2D object tracking (parking)',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/386055494840107008.json',
      },
      {
        id: uuid(),
        name: 'BEV object semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/227688885336020879.json',
      },
      {
        id: uuid(),
        name: 'Joint BEV and surround-view fisheye object tracking',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/260597269458470768.json',
      },
      {
        id: uuid(),
        name: 'Surround-view fisheye object detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/339666629678350336.json',
      },
      {
        id: uuid(),
        name: 'Multimodal large model annotation for data mining',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/370452242593091584.json',
      },
      {
        id: uuid(),
        name: 'End-to-end decision and control: behavior description and prediction',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/393700385200029696.json',
      },
      {
        id: uuid(),
        name: 'DMS behavior detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/213265129406599168.json',
      },
      {
        id: uuid(),
        name: 'LiDAR and millimeter-wave radar fusion annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/融合点云.json',
      },
      {
        id: uuid(),
        name: '5R1V fusion annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/5R1V.json',
      },
      {
        id: uuid(),
        name: 'Ultrasonic radar annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/247289142541697840.json',
      },
      {
        id: uuid(),
        name: 'Joint 3D and 2D object tracking (human feedback)',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/355540836202848256.json',
      },
      {
        id: uuid(),
        name: '3D object detection (vehicles, traffic lights, and road signs)',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/552757465171759104.json',
      },
      {
        id: uuid(),
        name: 'New 4D annotation mode',
        input:
          'oss://stardust-public/rosetta/standalone/json/Autonomous Driving/595445096791678976.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart retail',
    sub: [
      {
        id: uuid(),
        name: 'Beverage SKU annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Retail/307361105347483650.json',
      },
      {
        id: uuid(),
        name: 'Clothing image segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Retail/422938301251993600.json',
      },
      {
        id: uuid(),
        name: 'Instant noodle SKU annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Retail/22030311002432150908.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Intelligent security',
    sub: [
      {
        id: uuid(),
        name: 'Facial keypoint detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Security/289707807878955049.json',
      },
      {
        id: uuid(),
        name: 'Person re-identification (ReID)',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Security/368690343870607360.json',
      },
      {
        id: uuid(),
        name: 'Human pose estimation and keypoint detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Security/428813781008003072.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart cities',
    sub: [
      {
        id: uuid(),
        name: 'Remote sensing image semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart City/236400144021602894.json',
      },
      {
        id: uuid(),
        name: 'Tower-mounted smart camera object detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart City/302311939214943018.json',
      },
      {
        id: uuid(),
        name: 'Port object segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart City/529600156358942720.json',
      },
      {
        id: uuid(),
        name: 'Transmission tower detection and keypoint annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart City/561821009867845632.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart healthcare',
    sub: [
      {
        id: uuid(),
        name: 'Medical point cloud semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/235305624219557390.json',
      },
      {
        id: uuid(),
        name: 'Medical image semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/245965144457351168.json',
      },
      {
        id: uuid(),
        name: 'Ultrasound or angiography image annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/438291539639410688.json',
      },
      {
        id: uuid(),
        name: 'Medical gigapixel image semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/340120548451291136.json',
      },
      {
        id: uuid(),
        name: 'Medical receipt OCR',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/122278631.json',
      },
      {
        id: uuid(),
        name: 'Outpatient medical record OCR',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/266215881474097152.json',
      },
      {
        id: uuid(),
        name: 'Medical multi-turn dialogue annotation',
        onlyChinese: true,
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Healthcare/511732051297443840.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Embodied intelligence',
    sub: [
      {
        id: uuid(),
        name: '4D campus point cloud semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/228491114083131392.json',
      },
      {
        id: uuid(),
        name: 'Indoor semantic segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/253410824448788376.json',
      },
      {
        id: uuid(),
        name: 'Power switch detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/6970133015919830007_120.json',
      },
      {
        id: uuid(),
        name: 'Gesture recognition and palm segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/T163163520020IR_zswL_036_C.json',
      },

      {
        id: uuid(),
        name: 'Robot arm segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/533524248254623744.json',
      },
      {
        id: uuid(),
        name: 'Robot dog semantic segmentation and object detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Embodied Intelligence/563963569973104640.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart logistics',
    sub: [
      {
        id: uuid(),
        name: 'Logistics sorting shipping label detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Logistics/224972691793383424.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart transportation',
    sub: [
      {
        id: uuid(),
        name: 'Airport point cloud object detection',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Transportation/550209894343913472.json',
      },
      {
        id: uuid(),
        name: '2D airport detection, segmentation, and aircraft keypoints',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Transportation/545150957873807360.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart industry',
    sub: [],
  },
  {
    id: uuid(),
    name: 'Large language models',
    onlyChinese: true,
    sub: [
      {
        id: uuid(),
        name: 'PDF to Markdown',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/380160134552358912.json',
      },
      {
        id: uuid(),
        name: 'QA pair extraction',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/412874940136824832.json',
      },
      {
        id: uuid(),
        name: 'Instruction Following',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/293412966827829577.json',
      },
      {
        id: uuid(),
        name: 'RLHF ranking and scoring',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/386340511143047168.json',
      },
      {
        id: uuid(),
        name: 'Image description',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/423681505261797376.json',
      },
      {
        id: uuid(),
        name: 'Math problem decomposition into LaTeX',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/429888434186883072.json',
      },
      {
        id: uuid(),
        name: 'Physics problem decomposition',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/482841645457612800.json',
      },
      {
        id: uuid(),
        name: 'Arabic menu annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/435624393918922752.json',
      },
      {
        id: uuid(),
        name: 'Handwritten chemistry exam OCR',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/530679851343294464.json',
      },
      {
        id: uuid(),
        name: 'Excel spreadsheet annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/5306798513432944649.json',
      },
      {
        id: uuid(),
        name: 'GUI instruction execution',
        input:
          'oss://stardust-public/rosetta/standalone/json/LLM/533105031978037248.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Low-altitude economy',
    sub: [
      {
        id: uuid(),
        name: 'Drone obstacle avoidance and braking annotation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Low-altitude Economy/562576461794648064.json',
      },
      {
        id: uuid(),
        name: 'Infrared object recognition',
        input:
          'oss://stardust-public/rosetta/standalone/json/Low-altitude Economy/562486870584598528.json',
      },
      {
        id: uuid(),
        name: 'Large base-map point cloud',
        input:
          'oss://stardust-public/rosetta/standalone/json/Low-altitude Economy/561393493604843520.json',
      },
    ],
  },
  {
    id: uuid(),
    name: 'Smart converged media',
    sub: [
      {
        id: uuid(),
        name: 'Stylized text segmentation',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Converged Media/487137533252616192.json',
      },
      {
        id: uuid(),
        name: 'Video quality analysis',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Converged Media/502411505003151360.json',
      },
      {
        id: uuid(),
        name: 'Image aesthetic scoring',
        input:
          'oss://stardust-public/rosetta/standalone/json/Smart Converged Media/561811589905387520.json',
      },
    ],
  },
];

function displayName(key: string) {
  const value = t(key);
  return typeof value === 'string' && value.trim() ? value : key;
}

export function getDemoData(): DemoCategory[] {
  const chinese = (
    i18next.resolvedLanguage ||
    i18next.language ||
    'en-US'
  ).startsWith('zh');
  return demoData
    .filter((category) => !category.onlyChinese || chinese)
    .map((category) => ({
      ...category,
      name: displayName(category.name),
      sub: category.sub
        .filter((scene) => !scene.onlyChinese || chinese)
        .map((scene) => ({
          ...scene,
          name: displayName(scene.name),
        })),
    }));
}
