// 화면이 쓰는 API를 모은 곳. 함수 위 번호(C-1 등)는 노션 API 초안 번호.
// 지금은 ./dummy 가 API 초안의 응답 예시 모양 그대로 더미를 돌려줌.
// supabase 붙일 때: 각 함수 몸통을 주석의 supabase-js 호출로 바꾸고 ./dummy 를 지우면 됨. 화면 코드는 안 바뀜.
import * as dummy from './dummy';

// ---- 응답 타입 (API 초안 2장·3장) ----

export type Character = {
  id: string; // p00, c111 ...
  parent_id: string | null;
  kind: 'parent' | 'child';
  name: string;
  description: string;
  image_path: string;
};
export type CharacterRef = Pick<Character, 'id' | 'name' | 'image_path'>;

export type CharacterCollection = {
  character_id: string;
  species_count: number;
  discovery_count: number;
  first_discovered_at: string;
  latest_photo_path: string;
};

export type PlantSpecies = {
  id: string;
  scientific_name: string;
  korean_name: string;
  genus: string;
  family: string;
  family_ko: string;
  description: string;
  light: string;
  water_interval_days: number;
  nutrient_interval_days: number | null;
  repot_interval_days: number | null;
  character_id: string | null;
  info_source: 'seed' | 'llm';
};

export type Candidate = {
  species_id: string;
  scientific_name: string;
  korean_name: string;
  confidence: number;
  character_id: string | null;
  is_collected: boolean;
  is_character_collected: boolean | null;
};
export type Identification = { identification_id: string; candidates: Candidate[] };

export type Discovery = {
  id: string;
  user_id: string;
  species_id: string;
  identification_id: string | null;
  photo_path: string;
  confidence: number;
  memo: string | null;
  discovered_at: string;
};

export type UserPlant = {
  id: string;
  user_id: string;
  species_id: string | null;
  nickname: string;
  photo_path: string;
  adopted_on: string | null;
  water_interval_days: number;
  nutrient_interval_days: number | null;
  repot_interval_days: number | null;
  created_at: string;
};

// I-2, U-1 공통 꼬리
type NewFlags = { is_new_species: boolean; is_new_character: boolean; character: CharacterRef | null };
export type SaveDiscoveryResult = NewFlags & { discovery: Pick<Discovery, 'id' | 'species_id' | 'discovered_at'> };
export type RegisterPlantResult = NewFlags & { user_plant: UserPlant };

export type HealthStatus = 'green' | 'yellow' | 'red';
export type UserPlantStatus = {
  user_plant_id: string;
  nickname: string;
  last_watered_at: string | null;
  next_water_on: string | null;
  last_nutrient_at: string | null;
  next_nutrient_on: string | null;
  last_repot_at: string | null;
  next_repot_on: string | null;
  latest_health_status: HealthStatus | null;
  latest_health_summary: string | null;
};
export type UserPlantDetail = UserPlant & { plant_species: PlantSpecies | null };

export type HealthCheck = {
  id: string;
  status: HealthStatus;
  summary: string;
  mimir_message: string;
  causes: { code: string; confidence: number }[];
  actions: string[];
  confidence: number;
  trend: 'first' | 'improving' | 'same' | 'worse';
  observed_symptoms: string[];
  needs_more_info: string;
  created_at: string;
};

// ---- 호출 ----
// supabase 버전은 { data, error } 를 받아 error 면 throw 하게 바꿈.
// Edge Function 에러는 { error: { code, message } } 이고 message 가 화면 문구라 그대로 Error 메시지로 던지면 화면이 보여줌.

/** P-1 사진 업로드. supabase: storage.from('photos').upload(`${uid}/${uuid}.jpg`, file) → { path }
 *  ponytail: 긴 변 1280px 줄이기는 아직 없음(촬영 품질 0.7만). expo-image-manipulator 붙일 때 여기서. */
export const uploadPhoto = (uri?: string): Promise<{ path: string }> => dummy.uploadPhoto(uri);

/** I-1 식물 식별. supabase: functions.invoke('identify', { body: { photo_path } }) */
export const identify = (photo_path: string): Promise<Identification> => dummy.identify(photo_path);

/** I-2 수집 저장. supabase: rpc('save_discovery', args) */
export const saveDiscovery = (args: {
  identification_id: string | null;
  species_id: string;
  photo_path: string;
  memo?: string;
}): Promise<SaveDiscoveryResult> => dummy.saveDiscovery(args);

/** C-1 캐릭터 전체(가계도 틀). supabase: from('characters').select('*').order('id') */
export const getCharacters = (): Promise<Character[]> => dummy.getCharacters();

/** C-2a 내 도감(식물류). 모은 식물류만 옴. supabase: from('my_character_collection').select('*') */
export const getMyCharacterCollection = (): Promise<CharacterCollection[]> => dummy.getMyCharacterCollection();

/** U-1 반려식물 등록(도감 수집도 같이 됨). supabase: rpc('register_plant', args) */
export const registerPlant = (args: {
  nickname: string;
  photo_path: string;
  species_id: string | null;
  identification_id?: string;
  adopted_on?: string;
}): Promise<RegisterPlantResult> => dummy.registerPlant(args);

/** U-2 식물함 목록. supabase: from('user_plant_status').select('*') */
export const getMyPlants = (): Promise<UserPlantStatus[]> => dummy.getMyPlants();

/** U-3 반려식물 상세. supabase: from('user_plants').select('*, plant_species(*)').eq('id', id).single() */
export const getPlant = (id: string): Promise<UserPlantDetail> => dummy.getPlant(id);

/** H-1 건강 검진. supabase: functions.invoke('health-check', { body: { user_plant_id, photo_path, note } }) */
export const healthCheck = (args: { user_plant_id: string; photo_path: string; note?: string }): Promise<HealthCheck> =>
  dummy.healthCheck(args);
