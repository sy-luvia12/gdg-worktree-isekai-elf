import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { Stack } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, type PressableStateCallbackType, type StyleProp, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import * as api from '@/api';
import type { Character } from '@/api';

// 모든 좌표는 디자인 기준(가로 360, 섹션 하나 세로 800) 픽셀. 화면 폭에 맞춰 scale 곱함.
const W = 360;
const H = 800;

const img = {
  bgMaster: require('@/assets/images/dummy/background/bg_master.png'), // 7섹션(800씩)을 세로로 이은 한 장
  bgCamera: require('@/assets/images/dummy/background/bg_camera.png'),
  mapFlag: require('@/assets/images/dummy/object/obj_mapflag.png'),
  addFlag: require('@/assets/images/dummy/object/obj_addflag.png'),
  odin: require('@/assets/images/dummy/object/obj_odin.png'),
  textBox: require('@/assets/images/dummy/object/obj_textbox.png'),
  backBtn: require('@/assets/images/dummy/object/obj_backbtn.png'),
  shutter: require('@/assets/images/dummy/object/obj_camshutter.png'),
  mimir: require('@/assets/images/dummy/character/char_mimir.png'),
};

// bg_master 위에서 아래로: 상층부, 전환, 홈, 전환, 비석, 전환, 샘. 화면(역)만 Y에 두고 전환 구간은 스크롤로 지나감.
const MASTER_H = H * 7;
const Y = { top: 0, home: H * 2, stone: H * 4, mimir: H * 6 };
const STOPS = [Y.top, Y.home, Y.stone, Y.mimir];
// 슬라이드 속도 조절 knob. 길수록 느림.
const SLIDE_MS = 800; // 코드로 역 이동(샘→비석 등)
const SETTLE_MS = 550; // 손 뗀 뒤 역까지 미끄러지는 시간
// 이 중 하나만 넘으면 옆 역으로 넘어감. 작을수록 살짝만 튕겨도 넘어감.
const FLICK_V = 250; // 손 뗄 때 속도(px/s)
const FLICK_D = 50; // 끈 거리(디자인 px)

// ---- 비석 그림·위치 (화면 전용 디자인). 이름·설명·부모 관계는 C-1(api.getCharacters)에서 옴. ----
// id 는 디자이너 확정 코드(5번대, 초기 분화군 p55).
// 주의: 진정쌍떡잎/단자엽 이미지 파일명은 옛 6번대를 5로만 낮춘 것이라 코드와 반대 —
//   파일 p52·c52x = 진정쌍떡잎(p51·c51x), 파일 p51·c51x = 단자엽(p52·c52x).
// 빨간 원(식물류 묶음) 중심 좌표, 크기 48
const PARENT_ICONS = [
  { id: 'p00', x: 180, y: 616, src: require('@/assets/images/dummy/familytree/parent icon/obj_p00.png') },
  { id: 'p10', x: 180, y: 560, src: require('@/assets/images/dummy/familytree/parent icon/obj_p10.png') },
  { id: 'p11', x: 108, y: 557, src: require('@/assets/images/dummy/familytree/parent icon/obj_p11.png') },
  { id: 'p20', x: 179, y: 501, src: require('@/assets/images/dummy/familytree/parent icon/obj_p20.png') },
  { id: 'p21', x: 251, y: 524, src: require('@/assets/images/dummy/familytree/parent icon/obj_p21.png') },
  { id: 'p30', x: 178, y: 448, src: require('@/assets/images/dummy/familytree/parent icon/obj_p30.png') },
  { id: 'p31', x: 111, y: 453, src: require('@/assets/images/dummy/familytree/parent icon/obj_p31.png') },
  { id: 'p40', x: 179, y: 393, src: require('@/assets/images/dummy/familytree/parent icon/obj_p40.png') },
  { id: 'p41', x: 261, y: 368, src: require('@/assets/images/dummy/familytree/parent icon/obj_p41.png') },
  { id: 'p55', x: 179, y: 345, src: require('@/assets/images/dummy/familytree/parent icon/obj_p55.png') },
  { id: 'p51', x: 180, y: 253, src: require('@/assets/images/dummy/familytree/parent icon/obj_p52.png') },
  { id: 'p52', x: 101, y: 303, src: require('@/assets/images/dummy/familytree/parent icon/obj_p51.png') },
];
// 숫자 배지(식물류) 중심 좌표, 지름 30. 목련(c555)은 배지 없음 — 초기 분화군(p55) 원을 누르면 함께 보여줌.
const CHILD_ICONS = [
  { id: 'c111', x: 74, y: 525, src: require('@/assets/images/dummy/familytree/child icon/obj_c111.png') },
  { id: 'c112', x: 104, y: 510, src: require('@/assets/images/dummy/familytree/child icon/obj_c112.png') },
  { id: 'c113', x: 133, y: 521, src: require('@/assets/images/dummy/familytree/child icon/obj_c113.png') },
  { id: 'c211', x: 258, y: 483, src: require('@/assets/images/dummy/familytree/child icon/obj_c211.png') },
  { id: 'c311', x: 91, y: 413, src: require('@/assets/images/dummy/familytree/child icon/obj_c311.png') },
  { id: 'c312', x: 126, y: 413, src: require('@/assets/images/dummy/familytree/child icon/obj_c312.png') },
  { id: 'c411', x: 218, y: 336, src: require('@/assets/images/dummy/familytree/child icon/obj_c411.png') },
  { id: 'c412', x: 241, y: 320, src: require('@/assets/images/dummy/familytree/child icon/obj_c412.png') },
  { id: 'c413', x: 272, y: 316, src: require('@/assets/images/dummy/familytree/child icon/obj_c413.png') },
  { id: 'c511', x: 124, y: 224, src: require('@/assets/images/dummy/familytree/child icon/obj_c521.png') },
  { id: 'c512', x: 150, y: 204, src: require('@/assets/images/dummy/familytree/child icon/obj_c522.png') },
  { id: 'c513', x: 180, y: 196, src: require('@/assets/images/dummy/familytree/child icon/obj_c523.png') },
  { id: 'c514', x: 208, y: 202, src: require('@/assets/images/dummy/familytree/child icon/obj_c524.png') },
  { id: 'c515', x: 234, y: 221, src: require('@/assets/images/dummy/familytree/child icon/obj_c525.png') },
  { id: 'c521', x: 70, y: 276, src: require('@/assets/images/dummy/familytree/child icon/obj_c511.png') },
  { id: 'c522', x: 95, y: 258, src: require('@/assets/images/dummy/familytree/child icon/obj_c512.png') },
  { id: 'c523', x: 125, y: 266, src: require('@/assets/images/dummy/familytree/child icon/obj_c513.png') },
  { id: 'c524', x: 145, y: 284, src: require('@/assets/images/dummy/familytree/child icon/obj_c514.png') },
];
// 엘프 그림(식물류 id → 파일). ponytail: 서버 image_path 대신 로컬 파일. 그림을 Storage로 옮기면 image_path 사용.
const CHAR_IMG: Record<string, number> = {
  c111: require('@/assets/images/dummy/character/char_c111.png'),
  c112: require('@/assets/images/dummy/character/char_c112.png'),
  c113: require('@/assets/images/dummy/character/char_c113.png'),
  c211: require('@/assets/images/dummy/character/char_c211.png'),
  c311: require('@/assets/images/dummy/character/char_c311.png'),
  c312: require('@/assets/images/dummy/character/char_c312.png'),
  c411: require('@/assets/images/dummy/character/char_c411.png'),
  c412: require('@/assets/images/dummy/character/char_c412.png'),
  c413: require('@/assets/images/dummy/character/char_c413.png'),
  c511: require('@/assets/images/dummy/character/char_c521.png'),
  c512: require('@/assets/images/dummy/character/char_c522.png'),
  c513: require('@/assets/images/dummy/character/char_c523.png'),
  c514: require('@/assets/images/dummy/character/char_c524.png'),
  c515: require('@/assets/images/dummy/character/char_c525.png'),
  c521: require('@/assets/images/dummy/character/char_c511.png'),
  c522: require('@/assets/images/dummy/character/char_c512.png'),
  c523: require('@/assets/images/dummy/character/char_c513.png'),
  c524: require('@/assets/images/dummy/character/char_c514.png'),
  c555: require('@/assets/images/dummy/character/char_c555.png'),
};

// 해금(활성화): 식물류는 모았으면, 부모 노드는 바로 아래 노드가 전부 활성화면. (API 초안 협의 답변 기준)
const isActive = (id: string, chars: Character[], collected: string[]): boolean => {
  const kids = chars.filter((ch) => ch.parent_id === id);
  return kids.length ? kids.every((k) => isActive(k.id, chars, collected)) : collected.includes(id);
};

// API 응답을 화면이 쓰는 모양으로
const fetchCollected = async () => (await api.getMyCharacterCollection()).map((r) => r.character_id); // C-2a
// 상층부 반려식물: U-2 목록 첫 번째 + U-3 으로 엘프(character_id) 찾기.
// ponytail: 한 그루만 보여줌. 여러 그루 놓을 자리 생기면 목록 전체로.
const fetchMyPlant = async () => {
  const [first] = await api.getMyPlants();
  if (!first) return null;
  const detail = await api.getPlant(first.user_plant_id);
  return { id: first.user_plant_id, nickname: first.nickname, character_id: detail.plant_species?.character_id ?? null };
};

const at = (s: number) => (x: number, y: number, w: number, h: number) => ({
  position: 'absolute' as const,
  left: x * s,
  top: y * s,
  width: w * s,
  height: h * s,
});

type Step = 'idle' | 'camera' | 'analyzing' | 'result';
type Mode = 'collect' | 'register' | 'checkup';
type Line = { title: string; body: string };

// 누르는 동안 버튼은 살짝 작아지고(shrink), 깃발은 살짝 내려감(sink)
const shrink = (style: StyleProp<ViewStyle>) => ({ pressed }: PressableStateCallbackType) => [style, pressed && styles.shrink];
const sink = (style: StyleProp<ViewStyle>) => ({ pressed }: PressableStateCallbackType) => [style, pressed && styles.sink];

const PLANT = 120; // 반려식물 아이콘 크기(디자인 px)

export default function WorldScreen() {
  const { width } = useWindowDimensions();
  const s = width / W;
  const box = at(s);

  const [step, setStep] = useState<Step>('idle');
  // collect = 하층부 + 깃발(식물 수집), register = 상층부 + 깃발(반려 식물 등록), checkup = 상층부 내 식물 건강검진
  const [mode, setMode] = useState<Mode>('collect');
  const [lines, setLines] = useState<Line[]>([]); // 결과 대사, 탭할 때마다 다음 줄
  const [result, setResult] = useState<string | null>(null); // 방금 찾은 식물류 id (비석에 크게 표시)
  const [characters, setCharacters] = useState<Character[]>([]); // C-1
  const [collected, setCollected] = useState<string[]>([]); // C-2a 모은 식물류 id
  const [myPlant, setMyPlant] = useState<Awaited<ReturnType<typeof fetchMyPlant>>>(null); // 상층부 반려식물
  // 홈 메인 캐릭터. ponytail: 저장할 API 칸이 없어 메모리에만(src/api/README.md 'API에 없는 값' 참고).
  const [mainChar, setMainChar] = useState('c111');
  const [picking, setPicking] = useState(false); // 메인 캐릭터 고르는 중
  const [detail, setDetail] = useState<{ name: string; desc: string; char?: number } | null>(null); // 비석에서 연 상세

  useEffect(() => {
    api.getCharacters().then(setCharacters);
    fetchCollected().then(setCollected);
    fetchMyPlant().then(setMyPlant);
  }, []);
  const byId = (id: string | null) => characters.find((ch) => ch.id === id);

  // pos = 지금 화면 맨 위가 bg_master의 몇 px(디자인 기준)인지. 직접 애니메이션해서 속도·끝맺음을 제어.
  const pos = useSharedValue(0);
  const start = useSharedValue(0);
  const goTo = (y: number) => {
    pos.value = withTiming(y, { duration: SLIDE_MS, easing: Easing.inOut(Easing.cubic) });
  };
  // 지하철처럼: 살짝 튕기거나 조금만 끌어도 옆 역으로, 아니면 제자리. 한 번에 한 역만.
  const pan = usePanGesture({
    enabled: step === 'idle' && !detail && !picking,
    activeOffsetY: [-10, 10],
    onActivate: () => {
      'worklet';
      cancelAnimation(pos);
      start.value = pos.value;
    },
    onUpdate: (e) => {
      'worklet';
      pos.value = Math.min(Math.max(start.value - e.translationY / s, 0), Y.mimir);
    },
    onDeactivate: (e) => {
      'worklet';
      const d = pos.value - start.value;
      const dir = Math.abs(e.velocityY) > FLICK_V ? -Math.sign(e.velocityY) : Math.abs(d) > FLICK_D ? Math.sign(d) : 0;
      const from = Math.round(start.value / (H * 2)); // STOPS 간격 = H*2
      const i = Math.min(Math.max(from + dir, 0), STOPS.length - 1);
      // out(quad): 감속 꼬리가 짧아 끝에 질질 끌지 않음
      pos.value = withTiming(STOPS[i], { duration: SETTLE_MS, easing: Easing.out(Easing.quad) });
    },
  });
  const slide = useAnimatedStyle(() => ({ transform: [{ translateY: -pos.value * s }] }));

  // 반려식물: 길게 누르면 들어 올려 상층부 안에서 옮김. 짧게 누르면 검진.
  // ponytail: 위치는 메모리에만(저장할 API 칸 없음, src/api/README.md 참고).
  const plantX = useSharedValue(230);
  const plantY = useSharedValue(280);
  const plantFrom = useSharedValue({ x: 0, y: 0 });
  const lifted = useSharedValue(0);
  const plantDrag = usePanGesture({
    enabled: step === 'idle' && !detail && !picking,
    activateAfterLongPress: 400,
    onActivate: () => {
      'worklet';
      plantFrom.value = { x: plantX.value, y: plantY.value };
      lifted.value = withTiming(1, { duration: 120 });
    },
    onUpdate: (e) => {
      'worklet';
      plantX.value = Math.min(Math.max(plantFrom.value.x + e.translationX / s, 0), W - PLANT);
      plantY.value = Math.min(Math.max(plantFrom.value.y + e.translationY / s, 0), H - PLANT);
    },
    onDeactivate: () => {
      'worklet';
      lifted.value = withTiming(0, { duration: 120 });
    },
  });
  const plantStyle = useAnimatedStyle(() => ({
    left: plantX.value * s,
    top: (Y.top + plantY.value) * s,
    transform: [{ scale: 1 + lifted.value * 0.12 }],
    opacity: 1 - lifted.value * 0.15,
  }));

  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [camReady, setCamReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  const onShutter = async () => {
    // 카메라가 없거나(시뮬레이터·권한 거부) 준비 전이면 사진 없이 진행(더미만 동작).
    const photo = camReady ? await camera.current?.takePictureAsync({ quality: 0.7 }).catch(() => undefined) : undefined;
    analyze(photo?.uri);
  };
  // 왼쪽 아래: 사진첩에서 한 장 골라 촬영한 것처럼 진행. 취소하면 카메라에 그대로.
  const onGallery = async () => {
    const r = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled) analyze(r.assets[0].uri);
  };

  // 사진 → 업로드(P-1) → 검진(H-1) 또는 식별(I-1) → 수집(I-2)/등록(U-1)
  const analyze = async (uri?: string) => {
    setCamReady(false);
    setStep('analyzing');
    goTo(Y.mimir);
    try {
      const { path } = await api.uploadPhoto(uri);

      if (mode === 'checkup' && myPlant) {
        // 검진: 샘에서 바로 결과 → 확인 후 상층부로
        const h = await api.healthCheck({ user_plant_id: myPlant.id, photo_path: path });
        // needs_more_info 는 확신도 낮거나 원인 unknown 일 때만 보여줌 (API 초안 H-1)
        const unsure = h.confidence < 0.6 || h.causes[0]?.code === 'unknown';
        setLines([
          { title: '미미르', body: h.mimir_message },
          { title: `${myPlant.nickname} 검진 결과`, body: `${h.summary}\n${h.actions.map((a) => `· ${a}`).join('\n')}\n\n※ 참고용 진단이에요` },
          ...(unsure && h.needs_more_info ? [{ title: '미미르', body: h.needs_more_info }] : []),
        ]);
        setStep('result');
        return;
      }

      // 수집·등록: 비석에서 식물류 표시 → 미미르 설명 → (처음이면) 해금 → 수집은 하층부, 등록은 상층부로
      const { identification_id, candidates } = await api.identify(path);
      // ponytail: 후보 고르는 화면이 없어 1순위 자동 선택. 후보 선택 UI 붙이면 사용자가 고른 후보로.
      const top = candidates[0];
      const saved =
        mode === 'register'
          ? // ponytail: 별명 입력 화면이 없어 종 이름을 그대로 별명으로.
            await api.registerPlant({ nickname: top.korean_name, photo_path: path, species_id: top.species_id, identification_id })
          : await api.saveDiscovery({ identification_id, species_id: top.species_id, photo_path: path });
      const ch = byId(top.character_id);
      setResult(top.character_id);
      setLines([
        { title: '미미르', body: `이 아이는 ${top.korean_name}로군.` },
        ...(ch ? [{ title: ch.name, body: ch.description }] : []),
        ...(saved.is_new_character && saved.character
          ? [{ title: '새 캐릭터 해금!', body: `처음 만난 아이야. ${saved.character.name}이(가) 비석에 기록되었네.` }]
          : []),
      ]);
      setCollected(await fetchCollected());
      if (mode === 'register') setMyPlant(await fetchMyPlant());
      setStep('result');
      goTo(Y.stone);
    } catch (e) {
      // Edge Function 에러 message 는 화면 문구라 그대로 보여줌
      setLines([{ title: '미미르', body: e instanceof Error ? e.message : '문제가 생겼네. 다시 해 보게.' }]);
      setStep('result');
    }
  };

  const onNext = () => {
    if (lines.length > 1) return setLines(lines.slice(1));
    setStep('idle');
    setResult(null);
    goTo(mode === 'collect' ? Y.home : Y.top);
  };

  const openCamera = (m: Mode) => {
    setMode(m);
    setStep('camera');
  };

  // 부모 노드 상세. 초기 분화군은 배지 없는 목련을 함께 보여줌(모았을 때만)
  const openParent = (id: string) => {
    const p = byId(id);
    if (!p) return;
    const magnolia = byId('c555');
    setDetail(id === 'p55' && magnolia && collected.includes('c555')
      ? { name: `${p.name} · ${magnolia.name}`, desc: `${p.description}\n\n${magnolia.description}`, char: CHAR_IMG.c555 }
      : { name: p.name, desc: p.description });
  };
  const openChild = (id: string) => {
    const c = byId(id);
    // 아직 못 모은 식물류는 이름·설명 숨김
    setDetail(c && collected.includes(id)
      ? { name: c.name, desc: c.description }
      : { name: '???', desc: '아직 만나지 못한 아이로군. 하층부에서 찾아보게.' });
  };

  // + 깃발: 상층부 = 반려 식물 등록, 하층부 = 식물 수집
  const flags = (y: number, flagMode: Mode) => (
    <>
      <Image source={img.odin} style={box(20, y - 40, 48, 48)} />
      <Image source={img.mapFlag} style={box(-10, y, 120, 360)} />
      <Pressable style={sink(box(-10, y + 210, 120, 360))} onPress={() => openCamera(flagMode)} disabled={step !== 'idle'}>
        <Image source={img.addFlag} style={StyleSheet.absoluteFill} />
      </Pressable>
    </>
  );

  return (
    <View style={styles.fill}>
      <Stack.Screen options={{ headerShown: false }} />

      <GestureDetector gesture={pan}>
        <View style={styles.page}>
        <Animated.View style={[{ height: MASTER_H * s }, slide]}>
          <Image source={img.bgMaster} style={box(0, 0, W, MASTER_H)} />

          {/* 상층부 */}
          {flags(Y.top + 210, 'register')}
          {myPlant && (
            <GestureDetector gesture={plantDrag}>
              <Animated.View style={[styles.plant, { width: PLANT * s, height: PLANT * s }, plantStyle]}>
                <Pressable style={shrink(styles.fill)} onPress={() => openCamera('checkup')} disabled={step !== 'idle'}>
                  {myPlant.character_id && <Image source={CHAR_IMG[myPlant.character_id]} style={StyleSheet.absoluteFill} />}
                </Pressable>
              </Animated.View>
            </GestureDetector>
          )}

          {/* 홈 */}
          {flags(Y.home + 130, 'collect')}
          {/* 메인 캐릭터. 누르면 모은 캐릭터 중에서 고름 */}
          <Pressable style={shrink(box(80, Y.home + 280, 220, 220))} onPress={() => setPicking(true)} disabled={step !== 'idle'}>
            <Image source={CHAR_IMG[mainChar]} style={StyleSheet.absoluteFill} />
          </Pressable>

          {/* 비석: 빨간 원 = 식물류 묶음, 숫자 배지 = 식물류. 활성화 전엔 그림 안 그림 → 배경의 회색 그대로 */}
          <Image source={img.odin} style={box(100, Y.stone + 55, 48, 48)} />
          {PARENT_ICONS.map((p) => (
            <Pressable key={p.id} style={shrink(box(p.x - 24, Y.stone + p.y - 24, 48, 48))} onPress={() => openParent(p.id)} disabled={step !== 'idle'}>
              {isActive(p.id, characters, collected) && <Image source={p.src} style={StyleSheet.absoluteFill} />}
            </Pressable>
          ))}
          {CHILD_ICONS.map((c) => (
            <Pressable key={c.id} style={shrink(box(c.x - 15, Y.stone + c.y - 15, 30, 30))} onPress={() => openChild(c.id)} disabled={step !== 'idle'}>
              {collected.includes(c.id) && <Image source={c.src} style={StyleSheet.absoluteFill} />}
            </Pressable>
          ))}
          {step === 'result' && result && <Image source={CHAR_IMG[result]} style={box(110, Y.stone + 230, 160, 160)} />}

          {/* 샘 */}
          <Image source={img.mimir} style={box(60, Y.mimir + 180, 240, 240)} />
        </Animated.View>
        </View>
      </GestureDetector>

      {step === 'analyzing' && (
        <TextBox s={s} title="미미르" body="흠... 어떤 아이인지 살펴보는 중이네." />
      )}
      {step === 'result' && lines[0] && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onNext}>
          <TextBox s={s} title={lines[0].title} body={`${lines[0].body}\n\n(눌러서 ${lines.length > 1 ? '계속' : '돌아가기'})`} />
        </Pressable>
      )}
      {picking && (
        <Pressable style={[StyleSheet.absoluteFill, styles.dim, styles.picker]} onPress={() => setPicking(false)}>
          <Text style={styles.title}>{collected.length ? '함께할 아이를 고르게' : '아직 만난 아이가 없네. 하층부에서 찾아보게.'}</Text>
          <View style={styles.grid}>
            {collected.filter((id) => CHAR_IMG[id]).map((id) => (
              <Pressable key={id} style={shrink(null)} onPress={() => { setMainChar(id); setPicking(false); }}>
                <Image source={CHAR_IMG[id]} style={{ width: 96 * s, height: 96 * s }} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
      {detail && (
        <Pressable style={[StyleSheet.absoluteFill, styles.dim]} onPress={() => setDetail(null)}>
          {detail.char && <Image source={detail.char} style={[styles.detailChar, { width: 160 * s, height: 160 * s }]} />}
          <TextBox s={s} title={detail.name} body={`${detail.desc}\n\n(눌러서 닫기)`} />
        </Pressable>
      )}

      <Modal visible={step === 'camera'} animationType="slide" onRequestClose={() => setStep('idle')}>
        <View style={[styles.fill, styles.camBg]}>
          <Image source={img.bgCamera} style={box(0, 0, W, H)} />
          {/* 오딘의 눈: bg_camera의 흰 원(32,189 지름 296) 안에 실제 카메라 */}
          <View style={[box(32, 189, 296, 296), styles.lens, { borderRadius: 148 * s }]}>
            {permission?.granted ? (
              <CameraView ref={camera} style={styles.fill} facing={facing} onCameraReady={() => setCamReady(true)} />
            ) : (
              <Pressable style={styles.lensMsg} onPress={requestPermission}>
                <Text style={styles.lensText}>눌러서 카메라 허용</Text>
              </Pressable>
            )}
          </View>
          <Pressable style={shrink(styles.back)} onPress={() => setStep('idle')}>
            <Image source={img.backBtn} style={styles.fill} />
          </Pressable>
          <Pressable style={shrink(styles.shutter)} onPress={onShutter}>
            <Image source={img.shutter} style={styles.fill} />
          </Pressable>
          {/* ponytail: 전용 그림이 없어 시스템 아이콘. 디자인 나오면 obj_ 이미지로 교체 */}
          <Pressable style={shrink([styles.camSide, { left: 40 }])} onPress={onGallery}>
            <SymbolView name={{ ios: 'photo.on.rectangle', android: 'photo_library' }} size={32} tintColor="#555" />
          </Pressable>
          <Pressable style={shrink([styles.camSide, { right: 40 }])} onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}>
            <SymbolView name={{ ios: 'arrow.triangle.2.circlepath.camera', android: 'flip_camera_android' }} size={32} tintColor="#555" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

// obj_textbox.png 에 박힌 "이름"/"텍스트 박스" 글자를 같은 색으로 덮고 그 위에 글자를 씀
function TextBox({ s, title, body }: { s: number; title: string; body: string }) {
  const r = at(s);
  return (
    <View style={[styles.dialog, { width: 300 * s, height: 270 * s, marginLeft: -150 * s }]}>
      <Image source={img.textBox} style={StyleSheet.absoluteFill} />
      <View style={[r(46, 18, 208, 30), styles.cover]}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[r(15, 71, 270, 177), styles.cover, { padding: 12 * s }]}>
        <Text style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shrink: { transform: [{ scale: 0.9 }] },
  sink: { transform: [{ translateY: 8 }] },
  plant: { position: 'absolute' },
  page: { flex: 1, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.5)' },
  picker: { justifyContent: 'center', alignItems: 'center', gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  detailChar: { alignSelf: 'center', marginTop: 120 },
  dialog: { position: 'absolute', left: '50%', bottom: 32 },
  cover: { backgroundColor: '#777777', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 16 },
  body: { color: '#fff', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  back: { position: 'absolute', top: 56, left: 16, width: 48, height: 48 },
  camBg: { backgroundColor: '#e6e6e6' }, // bg_camera 바탕색. 세로로 긴 화면에서 아래 빈 곳 채움
  lens: { overflow: 'hidden' },
  lensMsg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lensText: { color: '#777', fontSize: 15 },
  shutter: { position: 'absolute', bottom: 80, alignSelf: 'center', width: 72, height: 72 },
  camSide: { position: 'absolute', bottom: 92, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, // 셔터(72) 가운데 높이에 맞춤
});
