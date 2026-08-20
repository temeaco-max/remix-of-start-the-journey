export type RepairableDomain = 'phone' | 'tablet' | 'laptop' | 'console' | 'tv' | 'smartwatch' | 'earbuds' | 'speaker' | 'appliance' | 'bicycle' | 'motorbike' | 'vehicle';

export interface DeviceFamily {
  domain: RepairableDomain;
  manufacturer: string;
  aliases: string[];
  modelPatterns: string[];
  commonRepairSignals: string[];
}

export const DEVICE_FAMILIES: DeviceFamily[] = [
  { domain:'phone', manufacturer:'Apple', aliases:['iphone','apple phone'], modelPatterns:['iPhone 6','iPhone 7','iPhone 8','iPhone X','iPhone XS','iPhone XR','iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15','iPhone 16','iPhone 17','iPhone SE'], commonRepairSignals:['screen','battery','charging','camera','speaker','water damage','no power'] },
  { domain:'phone', manufacturer:'Samsung', aliases:['galaxy','samsung phone'], modelPatterns:['Galaxy S','Galaxy A','Galaxy Note','Galaxy Z Fold','Galaxy Z Flip','Galaxy M'], commonRepairSignals:['screen','battery','charging','camera','water damage','no power'] },
  { domain:'phone', manufacturer:'Google', aliases:['pixel','google phone'], modelPatterns:['Pixel 6','Pixel 7','Pixel 8','Pixel 9','Pixel 10','Pixel A','Pixel Pro'], commonRepairSignals:['screen','battery','charging','camera','software','no power'] },
  { domain:'phone', manufacturer:'Xiaomi', aliases:['redmi','mi phone','poco','xiaomi'], modelPatterns:['Redmi Note','Mi','Poco'], commonRepairSignals:['screen','battery','charging','software','camera'] },
  { domain:'tablet', manufacturer:'Apple', aliases:['ipad'], modelPatterns:['iPad','iPad Air','iPad Pro','iPad mini'], commonRepairSignals:['screen','battery','charging','touch','camera'] },
  { domain:'tablet', manufacturer:'Samsung', aliases:['galaxy tab'], modelPatterns:['Galaxy Tab S','Galaxy Tab A'], commonRepairSignals:['screen','battery','charging','touch'] },
  { domain:'laptop', manufacturer:'Apple', aliases:['macbook','mac'], modelPatterns:['MacBook Air','MacBook Pro','MacBook'], commonRepairSignals:['screen','battery','keyboard','trackpad','charging','liquid','no power'] },
  { domain:'laptop', manufacturer:'Dell', aliases:['dell'], modelPatterns:['XPS','Inspiron','Latitude','Precision','Vostro'], commonRepairSignals:['screen','battery','keyboard','charging','no power'] },
  { domain:'laptop', manufacturer:'Lenovo', aliases:['thinkpad','ideapad','lenovo'], modelPatterns:['ThinkPad','IdeaPad','Yoga','Legion'], commonRepairSignals:['screen','battery','keyboard','charging','no power'] },
  { domain:'laptop', manufacturer:'HP', aliases:['hewlett packard','hp laptop'], modelPatterns:['Pavilion','Envy','EliteBook','ProBook','Spectre'], commonRepairSignals:['screen','battery','keyboard','charging','no power'] },
  { domain:'laptop', manufacturer:'Microsoft', aliases:['surface'], modelPatterns:['Surface Laptop','Surface Pro','Surface Book'], commonRepairSignals:['screen','battery','keyboard','charging'] },
  { domain:'console', manufacturer:'Sony', aliases:['playstation','ps4','ps5'], modelPatterns:['PS4','PS4 Pro','PS5','PS5 Slim','PS5 Pro'], commonRepairSignals:['hdmi','disc drive','power','overheating','controller'] },
  { domain:'console', manufacturer:'Microsoft', aliases:['xbox'], modelPatterns:['Xbox One','Xbox One S','Xbox One X','Xbox Series S','Xbox Series X'], commonRepairSignals:['hdmi','power','overheating','controller'] },
  { domain:'console', manufacturer:'Nintendo', aliases:['switch','nintendo'], modelPatterns:['Nintendo Switch','Switch Lite','Switch OLED'], commonRepairSignals:['screen','joycon','charging','battery'] },
  { domain:'tv', manufacturer:'Samsung', aliases:['samsung tv'], modelPatterns:['Crystal UHD','QLED','Neo QLED','The Frame'], commonRepairSignals:['screen','backlight','power','sound','network'] },
  { domain:'tv', manufacturer:'LG', aliases:['lg tv'], modelPatterns:['OLED','QNED','NanoCell','UHD'], commonRepairSignals:['screen','backlight','power','sound','network'] },
  { domain:'tv', manufacturer:'Sony', aliases:['sony tv','bravia'], modelPatterns:['BRAVIA','OLED','LED'], commonRepairSignals:['screen','power','sound','network'] },
  { domain:'smartwatch', manufacturer:'Apple', aliases:['apple watch'], modelPatterns:['Apple Watch Series','Apple Watch SE','Apple Watch Ultra'], commonRepairSignals:['battery','screen','charging','water','pairing'] },
  { domain:'smartwatch', manufacturer:'Samsung', aliases:['galaxy watch'], modelPatterns:['Galaxy Watch','Galaxy Watch Classic','Galaxy Watch Ultra'], commonRepairSignals:['battery','screen','charging','pairing'] },
  { domain:'earbuds', manufacturer:'Apple', aliases:['airpods'], modelPatterns:['AirPods','AirPods Pro','AirPods Max'], commonRepairSignals:['left earbud','right earbud','case','charging','pairing','battery'] },
  { domain:'earbuds', manufacturer:'Samsung', aliases:['galaxy buds'], modelPatterns:['Galaxy Buds','Galaxy Buds Pro','Galaxy Buds2'], commonRepairSignals:['earbud','case','charging','pairing','battery'] },
  { domain:'speaker', manufacturer:'JBL', aliases:['jbl'], modelPatterns:['Flip','Charge','Xtreme','Boombox'], commonRepairSignals:['battery','charging','water','audio','bluetooth'] },
  { domain:'speaker', manufacturer:'Bose', aliases:['bose'], modelPatterns:['SoundLink','Home Speaker','Portable Smart Speaker'], commonRepairSignals:['battery','charging','audio','bluetooth'] },
  { domain:'speaker', manufacturer:'Sonos', aliases:['sonos'], modelPatterns:['One','Era','Beam','Arc','Move'], commonRepairSignals:['power','audio','network','bluetooth'] },
  { domain:'appliance', manufacturer:'Samsung', aliases:['samsung appliance'], modelPatterns:['washing machine','fridge','freezer','oven','dishwasher','dryer'], commonRepairSignals:['power','water','heating','cooling','drain','leak'] },
  { domain:'appliance', manufacturer:'LG', aliases:['lg appliance'], modelPatterns:['washing machine','fridge','freezer','oven','dishwasher','dryer'], commonRepairSignals:['power','water','heating','cooling','drain','leak'] },
  { domain:'vehicle', manufacturer:'generic', aliases:['car','vehicle'], modelPatterns:['make/model/year required'], commonRepairSignals:['engine','battery','brakes','tyres','overheating','warning light','accident'] },
  { domain:'motorbike', manufacturer:'generic', aliases:['motorbike','motorcycle'], modelPatterns:['make/model/year required'], commonRepairSignals:['engine','battery','brakes','tyres','chain','overheating'] },
  { domain:'bicycle', manufacturer:'generic', aliases:['bicycle','bike','cycle'], modelPatterns:['road','mountain','e-bike','cargo','city'], commonRepairSignals:['brakes','gears','chain','tyre','battery','motor'] },
];

export function identifyDeviceFamily(text: string, preferredDomain?: RepairableDomain): DeviceFamily | null {
  const q = text.toLowerCase();
  const candidates = DEVICE_FAMILIES.filter(f => !preferredDomain || f.domain === preferredDomain);
  return candidates.find(f => f.aliases.some(a => q.includes(a)) || f.modelPatterns.some(m => q.includes(m.toLowerCase()))) || null;
}

export function getRepairIntakeQuestions(text: string, domain?: RepairableDomain): string[] {
  const family = identifyDeviceFamily(text, domain);
  const questions = ['exact brand and model', 'fault/symptoms', 'location', 'required completion time'];
  if (!family) return questions;
  return ['exact model/variant', ...family.commonRepairSignals.slice(0, 3).map(signal => `whether the problem involves ${signal}`), 'location', 'required completion time'];
}
