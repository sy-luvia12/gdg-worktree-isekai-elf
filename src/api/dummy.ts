// 더미 백엔드. API 초안의 응답 예시 모양 그대로 돌려줌. supabase 붙이면 이 파일은 통째로 삭제.
// ponytail: 저장은 메모리에만 — 앱 끄면 수집·반려식물 기록이 사라짐.
import type {
  Candidate,
  Character,
  CharacterCollection,
  HealthCheck,
  Identification,
  PlantSpecies,
  RegisterPlantResult,
  SaveDiscoveryResult,
  UserPlant,
  UserPlantDetail,
  UserPlantStatus,
} from './index';

const USER = 'dummy-user';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// C-1 characters. 코드는 디자이너 확정본(5번대, 초기 분화군 p55). 진정쌍떡잎·단자엽의 부모는 속씨(p40).
// ponytail: 설명은 임시 문구. image_path 는 지금 쓰는 더미 파일 이름(화면은 id로 로컬 이미지를 찾음).
const p = (id: string, parent_id: string | null, name: string, description: string): Character =>
  ({ id, parent_id, kind: 'parent', name, description, image_path: `familytree/obj_${id}.png` });
const c = (id: string, parent_id: string, name: string, description: string, file: string): Character =>
  ({ id, parent_id, kind: 'child', name, description, image_path: `character/char_${file}.png` });

const CHARACTERS: Character[] = [
  p('p00', null, '육상식물', '물을 떠나 땅 위로 올라온 모든 식물의 뿌리라네.'),
  p('p10', 'p00', '관다발식물', '물과 양분을 나르는 관다발을 얻어 키가 커질 수 있게 되었지.'),
  p('p11', 'p00', '선태식물', '관다발 없이 땅에 낮게 붙어 사는 이끼 무리라네. 축축한 곳을 좋아하지.'),
  p('p20', 'p10', '진엽식물', '잎맥이 갈라진 커다란 잎을 얻은 식물들이네.'),
  p('p21', 'p10', '소엽식물', '잎맥이 하나뿐인 작은 잎을 가진 오래된 무리라네.'),
  p('p30', 'p20', '종자식물', '포자 대신 씨앗으로 번식하게 된 식물들이지.'),
  p('p31', 'p20', '양치식물', '아직 씨앗 없이 포자로 번식하는 무리라네.'),
  p('p40', 'p30', '속씨식물', '밑씨를 씨방으로 감싸 꽃을 피우고 열매를 맺게 되었지.'),
  p('p41', 'p30', '겉씨식물', '밑씨가 겉으로 드러난 채 씨앗을 맺는 식물이네.'),
  p('p51', 'p40', '진정쌍떡잎', '떡잎이 두 장이고 곧은뿌리와 그물맥을 가진 식물이네.'),
  p('p52', 'p40', '단자엽', '떡잎이 한 장이고 수염뿌리와 나란히맥을 가진 식물이지.'),
  p('p55', 'p40', '초기 분화군', '속씨식물 중 일찍 갈라져 나와 옛 꽃의 구조를 간직한 무리라네. 목련이 여기 속하지.'),
  c('c111', 'p11', '이끼류', '줄기와 잎 모양을 갖춘 작은 이끼라네. 그늘지고 촉촉한 곳에 융단처럼 깔리지.', 'c111'),
  c('c112', 'p11', '간류', '납작한 몸으로 땅에 붙어 자라는 이끼야. 우산이끼가 대표적이지.', 'c112'),
  c('c113', 'p11', '뿔이끼류', '뿔처럼 길쭉한 포자체를 세우는 이끼라네.', 'c113'),
  c('c211', 'p21', '석송류', '작은 비늘잎이 줄기를 빽빽이 덮은 아이지. 아주 먼 옛날엔 거대한 나무였다네.', 'c211'),
  c('c311', 'p31', '고사리류', '잎 뒷면의 포자로 번식하네. 밝은 그늘과 높은 습도를 좋아하지.', 'c311'),
  c('c312', 'p31', '쇠뜨기류', '마디마디 끊어지는 줄기를 가진 아이라네. 이른 봄 뱀밥을 내밀지.', 'c312'),
  c('c411', 'p41', '소철류', '야자처럼 생겼지만 겉씨식물이라네. 아주 천천히 자라지.', 'c411'),
  c('c412', 'p41', '은행나무', '살아 있는 화석이라 불리지. 가을이면 부채 모양 잎이 노랗게 물든다네.', 'c412'),
  c('c413', 'p41', '침엽수', '바늘잎과 솔방울을 가진 나무들이지. 소나무, 전나무가 여기 속하네.', 'c413'),
  // 이미지 파일명은 옛 번호라 51x↔52x 가 뒤바뀌어 있음(파일 c52x = 진정쌍떡잎)
  c('c511', 'p51', '장미', '가시 돋친 줄기에 향기로운 꽃을 피우지. 햇빛과 바람을 좋아한다네.', 'c521'),
  c('c512', 'p51', '국화', '가을에 피는 꽃이라네. 작은 꽃이 모여 한 송이처럼 보이지.', 'c522'),
  c('c513', 'p51', '콩', '꼬투리 속에 씨앗을 품는 아이야. 뿌리혹이 땅을 기름지게 한다네.', 'c523'),
  c('c514', 'p51', '참나무', '도토리를 맺는 튼튼한 나무지. 숲의 많은 생명을 먹여 살린다네.', 'c524'),
  c('c515', 'p51', '해바라기', '해를 따라 고개를 돌리는 아이야. 햇빛을 아주 좋아한다네.', 'c525'),
  c('c521', 'p52', '벼', '우리가 먹는 쌀이 열리는 풀이라네. 물을 아주 좋아하지.', 'c511'),
  c('c522', 'p52', '백합', '크고 향기로운 꽃을 피우는 알뿌리 식물이야. 흙이 너무 축축하지 않게 해 주게.', 'c512'),
  c('c523', 'p52', '야자', '따뜻한 곳에서 큰 잎을 펼치는 아이지. 밝은 빛을 좋아한다네.', 'c513'),
  c('c524', 'p52', '난초', '섬세한 꽃을 오래 피우는 아이야. 바람이 잘 통하게, 물은 뿌리가 마르면 주게.', 'c514'),
  c('c555', 'p55', '목련', '이른 봄 크고 탐스러운 꽃을 피우는 아이야. 옛 꽃의 모습을 간직하고 있다네.', 'c555'),
];

// plant_species 더미: 식물류마다 종 하나. ponytail: 학명·과는 가짜 값. 시드 데이터 나오면 그걸로.
const SPECIES: PlantSpecies[] = CHARACTERS.filter((ch) => ch.kind === 'child').map((ch) => ({
  id: `sp-${ch.id}`,
  scientific_name: `Dummy ${ch.id}`,
  korean_name: ch.name,
  genus: 'Dummy',
  family: 'Dummyaceae',
  family_ko: '더미과',
  description: ch.description,
  light: '반그늘을 좋아해요',
  water_interval_days: 7,
  nutrient_interval_days: 30,
  repot_interval_days: 365,
  character_id: ch.id,
  info_source: 'seed',
}));
const species = (id: string) => SPECIES.find((s) => s.id === id)!;

// 사용자 데이터(원래는 DB 테이블)
const discoveries: { species_id: string; discovered_at: string; photo_path: string }[] = [];
const plants: UserPlant[] = [];
const checks: { user_plant_id: string; status: HealthCheck['status']; summary: string }[] = [];

const hasSpecies = (id: string) => discoveries.some((d) => d.species_id === id);
const hasCharacter = (id: string) => discoveries.some((d) => species(d.species_id).character_id === id);
const characterRef = (id: string | null) => {
  const ch = CHARACTERS.find((x) => x.id === id);
  return ch ? { id: ch.id, name: ch.name, image_path: ch.image_path } : null;
};

// discoveries 에 넣고 I-2·U-1 공통 꼬리(is_new_*, character)를 돌려줌
const addDiscovery = (species_id: string, photo_path: string) => {
  const cid = species(species_id).character_id;
  const flags = {
    is_new_species: !hasSpecies(species_id),
    is_new_character: cid !== null && !hasCharacter(cid),
    character: characterRef(cid),
  };
  const d = { species_id, photo_path, discovered_at: now() };
  discoveries.push(d);
  return { ...flags, discovery: { id: uid(), species_id, discovered_at: d.discovered_at } };
};

export async function uploadPhoto(_uri?: string) {
  await wait(200);
  return { path: `${USER}/${uid()}.jpg` };
}

export async function identify(_photo_path: string): Promise<Identification> {
  await wait(2500); // 식별 기다리는 시간 흉내
  const top = pick(SPECIES);
  const others = SPECIES.filter((s) => s !== top).sort(() => Math.random() - 0.5).slice(0, 2);
  const toCandidate = (s: PlantSpecies, confidence: number): Candidate => ({
    species_id: s.id,
    scientific_name: s.scientific_name,
    korean_name: s.korean_name,
    confidence,
    character_id: s.character_id,
    is_collected: hasSpecies(s.id),
    is_character_collected: s.character_id ? hasCharacter(s.character_id) : null,
  });
  return {
    identification_id: uid(),
    candidates: [toCandidate(top, 0.91), toCandidate(others[0], 0.05), toCandidate(others[1], 0.02)],
  };
}

export async function saveDiscovery(args: { species_id: string; photo_path: string }): Promise<SaveDiscoveryResult> {
  return addDiscovery(args.species_id, args.photo_path);
}

export async function getCharacters() {
  return CHARACTERS;
}

export async function getMyCharacterCollection(): Promise<CharacterCollection[]> {
  const byChar = new Map<string, typeof discoveries>();
  for (const d of discoveries) {
    const cid = species(d.species_id).character_id;
    if (cid) byChar.set(cid, [...(byChar.get(cid) ?? []), d]);
  }
  return [...byChar].map(([character_id, ds]) => ({
    character_id,
    species_count: new Set(ds.map((d) => d.species_id)).size,
    discovery_count: ds.length,
    first_discovered_at: ds[0].discovered_at,
    latest_photo_path: ds[ds.length - 1].photo_path,
  }));
}

export async function registerPlant(args: {
  nickname: string;
  photo_path: string;
  species_id: string | null;
  adopted_on?: string;
}): Promise<RegisterPlantResult> {
  const sp = args.species_id ? species(args.species_id) : null;
  const user_plant: UserPlant = {
    id: uid(),
    user_id: USER,
    species_id: args.species_id,
    nickname: args.nickname,
    photo_path: args.photo_path,
    adopted_on: args.adopted_on ?? null,
    water_interval_days: sp?.water_interval_days ?? 7,
    nutrient_interval_days: sp?.nutrient_interval_days ?? null,
    repot_interval_days: sp?.repot_interval_days ?? null,
    created_at: now(),
  };
  plants.unshift(user_plant);
  // 식별 실패(species_id null)면 수집 기록 없음
  const flags = args.species_id
    ? addDiscovery(args.species_id, args.photo_path)
    : { is_new_species: false, is_new_character: false, character: null };
  return { user_plant, is_new_species: flags.is_new_species, is_new_character: flags.is_new_character, character: flags.character };
}

export async function getMyPlants(): Promise<UserPlantStatus[]> {
  return plants.map((pl) => {
    const last = checks.filter((h) => h.user_plant_id === pl.id).at(-1);
    return {
      user_plant_id: pl.id,
      nickname: pl.nickname,
      // ponytail: 돌봄 기록(L-1)을 아직 안 써서 날짜는 전부 null
      last_watered_at: null,
      next_water_on: null,
      last_nutrient_at: null,
      next_nutrient_on: null,
      last_repot_at: null,
      next_repot_on: null,
      latest_health_status: last?.status ?? null,
      latest_health_summary: last?.summary ?? null,
    };
  });
}

export async function getPlant(id: string): Promise<UserPlantDetail> {
  const pl = plants.find((x) => x.id === id)!;
  return { ...pl, plant_species: pl.species_id ? species(pl.species_id) : null };
}

const CHECK_SAMPLES: Pick<HealthCheck, 'status' | 'summary' | 'mimir_message' | 'causes' | 'actions' | 'confidence'>[] = [
  {
    status: 'green',
    summary: '건강해요',
    mimir_message: '잎 색이 고르고 탄탄하군. 지금처럼만 돌봐 주게.',
    causes: [{ code: 'healthy', confidence: 0.8 }],
    actions: ['지금처럼 돌봐 주기'],
    confidence: 0.8,
  },
  {
    status: 'yellow',
    summary: '물을 조금 적게 주세요',
    mimir_message: '흙이 너무 축축하네. 아래 잎이 노랗게 변한 건 과습 때문일 가능성이 크다네.',
    causes: [{ code: 'overwatering', confidence: 0.7 }, { code: 'natural_aging', confidence: 0.2 }],
    actions: ['겉흙 2cm가 마르면 물 주기', '통풍 잘 되는 곳으로 옮기기'],
    confidence: 0.7,
  },
  {
    status: 'yellow',
    summary: '빛이 부족해요',
    mimir_message: '줄기가 가늘게 웃자랐군. 빛이 부족해 보이네.',
    causes: [{ code: 'light_too_little', confidence: 0.5 }],
    actions: ['창가 쪽으로 옮기기'],
    confidence: 0.5,
  },
];

export async function healthCheck(args: { user_plant_id: string; photo_path: string }): Promise<HealthCheck> {
  await wait(2500);
  const sample = pick(CHECK_SAMPLES);
  const first = !checks.some((h) => h.user_plant_id === args.user_plant_id);
  checks.push({ user_plant_id: args.user_plant_id, status: sample.status, summary: sample.summary });
  return {
    id: uid(),
    ...sample,
    trend: first ? 'first' : 'same',
    observed_symptoms: [],
    needs_more_info: sample.confidence < 0.6 ? '잎 뒷면과 흙 표면이 보이게 한 장 더 찍어 주게.' : '',
    created_at: now(),
  };
}
