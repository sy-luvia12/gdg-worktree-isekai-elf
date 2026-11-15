import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

// 모든 좌표는 디자인 기준(가로 360, 섹션 하나 세로 800) 픽셀. 화면 폭에 맞춰 scale 곱함.
const W = 360;
const H = 800;

const img = {
  bgTop: require('@/assets/images/dummy/background/bg_top.png'),
  bg1to2: require('@/assets/images/dummy/background/bg_1trans2.png'),
  bgRoot: require('@/assets/images/dummy/background/bg_root.png'),
  bg2to3: require('@/assets/images/dummy/background/bg_2trans3.png'),
  bgStone: require('@/assets/images/dummy/background/bg_stone.png'),
  bg3to4: require('@/assets/images/dummy/background/bg_3trans4.png'),
  bgMimir: require('@/assets/images/dummy/background/bg_mimir.png'),
  bgCamera: require('@/assets/images/dummy/background/bg_camera.png'),
  mapFlag: require('@/assets/images/dummy/object/obj_mapflag.png'),
  addFlag: require('@/assets/images/dummy/object/obj_addflag.png'),
  odin: require('@/assets/images/dummy/object/obj_odin.png'),
  textBox: require('@/assets/images/dummy/object/obj_textbox.png'),
  backBtn: require('@/assets/images/dummy/object/obj_backbtn.png'),
  shutter: require('@/assets/images/dummy/object/obj_camshutter.png'),
  mimir: require('@/assets/images/dummy/character/char_mimir.png'),
  c111: require('@/assets/images/dummy/character/char_c111.png'),
};

// 위에서 아래로: 상층부, 전환, 홈, 전환, 비석, 전환, 샘
const SECTIONS = [img.bgTop, img.bg1to2, img.bgRoot, img.bg2to3, img.bgStone, img.bg3to4, img.bgMimir];
const Y = { top: 0, home: H * 2, stone: H * 4, mimir: H * 6 };
const PAGE = { top: 0, home: 2, stone: 4, mimir: 6 };
const TRANS_MS = 500; // ponytail: 전환 화면 그냥 0.5초 표시. 애니메이션 붙일 때 여기 교체.

// ponytail: 건강검진도 가짜 결과에서 랜덤 선택. 상세 페이지 로그는 아직 없음.
const CHECKUPS = [
  '잎 색이 고르고 탄탄하군. 지금처럼만 돌봐 주게.',
  '흙이 너무 축축하네. 물 주는 간격을 조금 늘리게.',
  '빛이 부족해 보이는군. 창가 쪽으로 옮겨 주게.',
];

// 식물 분류는 노션 '식물 분류' 표 기준. code = 노션 코드.
// ponytail: 설명(desc)은 노션에 없어 임시 문구.
// 주의: 진정쌍떡잎/단자엽 이미지 파일명은 옛 6번대를 5로만 낮춘 것이라 노션 코드와 반대 —
//   파일 p52·c52x = 진정쌍떡잎(노션 p51·c51x), 파일 p51·c51x = 단자엽(노션 p52·c52x).
// 비석(bg_stone)의 빨간 원(식물류) 중심 좌표. 크기 48.
const PARENT_ICONS = [
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p00.png'), x: 180, y: 616, code: 'p00', name: '육상식물', desc: '물을 떠나 땅 위로 올라온 모든 식물의 뿌리라네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p10.png'), x: 180, y: 560, code: 'p10', name: '관다발식물', desc: '물과 양분을 나르는 관다발을 얻어 키가 커질 수 있게 되었지.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p11.png'), x: 108, y: 557, code: 'p11', name: '선태식물', desc: '관다발 없이 땅에 낮게 붙어 사는 이끼 무리라네. 축축한 곳을 좋아하지.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p20.png'), x: 179, y: 501, code: 'p20', name: '진엽식물', desc: '잎맥이 갈라진 커다란 잎을 얻은 식물들이네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p21.png'), x: 251, y: 524, code: 'p21', name: '소엽식물', desc: '잎맥이 하나뿐인 작은 잎을 가진 오래된 무리라네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p30.png'), x: 178, y: 448, code: 'p30', name: '종자식물', desc: '포자 대신 씨앗으로 번식하게 된 식물들이지.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p31.png'), x: 111, y: 453, code: 'p31', name: '양치식물', desc: '아직 씨앗 없이 포자로 번식하는 무리라네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p40.png'), x: 179, y: 393, code: 'p40', name: '속씨식물', desc: '밑씨를 씨방으로 감싸 꽃을 피우고 열매를 맺게 되었지.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p41.png'), x: 261, y: 368, code: 'p41', name: '겉씨식물', desc: '밑씨가 겉으로 드러난 채 씨앗을 맺는 식물이네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p55.png'), x: 179, y: 345, code: 'p55', name: '초기 분화군', desc: '속씨식물 중 일찍 갈라져 나와 옛 꽃의 구조를 간직한 무리라네. 목련이 여기 속하지.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p52.png'), x: 180, y: 253, code: 'p51', name: '진정쌍떡잎', desc: '떡잎이 두 장이고 곧은뿌리와 그물맥을 가진 식물이네.' },
  { src: require('@/assets/images/dummy/familytree/parent icon/obj_p51.png'), x: 101, y: 303, code: 'p52', name: '단자엽', desc: '떡잎이 한 장이고 수염뿌리와 나란히맥을 가진 식물이지.' },
];

// 비석의 숫자 배지(식물 한 종류) 중심 좌표. 배지 지름 30.
const CHILD_ICONS = [
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c111.png'), char: require('@/assets/images/dummy/character/char_c111.png'), x: 74, y: 525, code: 'c111', name: '이끼류', desc: '줄기와 잎 모양을 갖춘 작은 이끼라네. 그늘지고 촉촉한 곳에 융단처럼 깔리지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c112.png'), char: require('@/assets/images/dummy/character/char_c112.png'), x: 104, y: 510, code: 'c112', name: '간류', desc: '납작한 몸으로 땅에 붙어 자라는 이끼야. 우산이끼가 대표적이지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c113.png'), char: require('@/assets/images/dummy/character/char_c113.png'), x: 133, y: 521, code: 'c113', name: '뿔이끼류', desc: '뿔처럼 길쭉한 포자체를 세우는 이끼라네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c211.png'), char: require('@/assets/images/dummy/character/char_c211.png'), x: 258, y: 483, code: 'c211', name: '석송류', desc: '작은 비늘잎이 줄기를 빽빽이 덮은 아이지. 아주 먼 옛날엔 거대한 나무였다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c311.png'), char: require('@/assets/images/dummy/character/char_c311.png'), x: 91, y: 413, code: 'c311', name: '고사리류', desc: '잎 뒷면의 포자로 번식하네. 밝은 그늘과 높은 습도를 좋아하지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c312.png'), char: require('@/assets/images/dummy/character/char_c312.png'), x: 126, y: 413, code: 'c312', name: '쇠뜨기류', desc: '마디마디 끊어지는 줄기를 가진 아이라네. 이른 봄 뱀밥을 내밀지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c411.png'), char: require('@/assets/images/dummy/character/char_c411.png'), x: 218, y: 336, code: 'c411', name: '소철류', desc: '야자처럼 생겼지만 겉씨식물이라네. 아주 천천히 자라지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c412.png'), char: require('@/assets/images/dummy/character/char_c412.png'), x: 241, y: 320, code: 'c412', name: '은행나무', desc: '살아 있는 화석이라 불리지. 가을이면 부채 모양 잎이 노랗게 물든다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c413.png'), char: require('@/assets/images/dummy/character/char_c413.png'), x: 272, y: 316, code: 'c413', name: '침엽수', desc: '바늘잎과 솔방울을 가진 나무들이지. 소나무, 전나무가 여기 속하네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c521.png'), char: require('@/assets/images/dummy/character/char_c521.png'), x: 124, y: 224, code: 'c511', name: '장미', desc: '가시 돋친 줄기에 향기로운 꽃을 피우지. 햇빛과 바람을 좋아한다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c522.png'), char: require('@/assets/images/dummy/character/char_c522.png'), x: 150, y: 204, code: 'c512', name: '국화', desc: '가을에 피는 꽃이라네. 작은 꽃이 모여 한 송이처럼 보이지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c523.png'), char: require('@/assets/images/dummy/character/char_c523.png'), x: 180, y: 196, code: 'c513', name: '콩', desc: '꼬투리 속에 씨앗을 품는 아이야. 뿌리혹이 땅을 기름지게 한다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c524.png'), char: require('@/assets/images/dummy/character/char_c524.png'), x: 208, y: 202, code: 'c514', name: '참나무', desc: '도토리를 맺는 튼튼한 나무지. 숲의 많은 생명을 먹여 살린다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c525.png'), char: require('@/assets/images/dummy/character/char_c525.png'), x: 234, y: 221, code: 'c515', name: '해바라기', desc: '해를 따라 고개를 돌리는 아이야. 햇빛을 아주 좋아한다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c511.png'), char: require('@/assets/images/dummy/character/char_c511.png'), x: 70, y: 276, code: 'c521', name: '벼', desc: '우리가 먹는 쌀이 열리는 풀이라네. 물을 아주 좋아하지.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c512.png'), char: require('@/assets/images/dummy/character/char_c512.png'), x: 95, y: 258, code: 'c522', name: '백합', desc: '크고 향기로운 꽃을 피우는 알뿌리 식물이야. 흙이 너무 축축하지 않게 해 주게.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c513.png'), char: require('@/assets/images/dummy/character/char_c513.png'), x: 125, y: 266, code: 'c523', name: '야자', desc: '따뜻한 곳에서 큰 잎을 펼치는 아이지. 밝은 빛을 좋아한다네.' },
  { src: require('@/assets/images/dummy/familytree/child icon/obj_c514.png'), char: require('@/assets/images/dummy/character/char_c514.png'), x: 145, y: 284, code: 'c524', name: '난초', desc: '섬세한 꽃을 오래 피우는 아이야. 바람이 잘 통하게, 물은 뿌리가 마르면 주게.' },
];

// 목련(c555)은 비석에 배지가 없는 예외 — 초기 분화군(p55) 원을 누르면 함께 보여줌.
const MAGNOLIA = { char: require('@/assets/images/dummy/character/char_c555.png'), code: 'c555', name: '목련', desc: '이른 봄 크고 탐스러운 꽃을 피우는 아이야. 옛 꽃의 모습을 간직하고 있다네.' };

// ponytail: AI 분석 대신 전체 식물 중 랜덤 선택. 실제 API 붙이면 응답 사용.
const RESULTS = [...CHILD_ICONS, MAGNOLIA];
const MY_PLANT = CHILD_ICONS.find((c) => c.name === '백합')!; // 상층부에 있는 내 식물, 건강검진 대상

const at =(s: number) => (x: number, y: number, w: number, h: number) => ({
  position: 'absolute' as const,
  left: x * s,
  top: y * s,
  width: w * s,
  height: h * s,
});

type Step = 'idle' | 'camera' | 'analyzing' | 'result';
type Mode = 'collect' | 'register' | 'checkup';

export default function WorldScreen() {
  const { width } = useWindowDimensions();
  const s = width / W;
  const box = at(s);

  // 현재 보이는 SECTIONS 인덱스. 짝수 = 화면, 홀수 = 전환(bg trans)
  const [page, setPage] = useState(PAGE.top);
  const [step, setStep] = useState<Step>('idle');
  const [result, setResult] = useState(RESULTS[0]);
  // collect = 하층부 + 깃발(식물 수집), register = 상층부 + 깃발(반려 식물 등록), checkup = 상층부 내 식물 건강검진
  const [mode, setMode] = useState<Mode>('collect');
  const [lines, setLines] = useState<{ title: string; body: string }[]>([]); // 결과 대사, 탭할 때마다 다음 줄
  // ponytail: 해금 목록은 메모리에만. 앱 끄면 사라짐 — 저장소 붙일 때 AsyncStorage/서버로.
  const [found, setFound] = useState<string[]>([]);
  const [detail, setDetail] = useState<{ name: string; desc: string; char?: number } | null>(null); // 비석에서 연 식물(류) 상세

  // 목표 화면 직전의 전환 이미지를 TRANS_MS 동안 보여준 뒤 목표로 이동
  const goTo = (target: number) => {
    setPage((cur) => {
      if (cur === target) return cur;
      setTimeout(() => setPage(target), TRANS_MS);
      return target > cur ? target - 1 : target + 1;
    });
  };

  const touchY = useRef(0);
  const moved = useRef(false); // 이번 터치가 슬라이드였으면 true → 버튼 onPress 무시
  const onTouchEnd = (y: number) => {
    const dy = y - touchY.current;
    if (step !== 'idle' || detail || page % 2 === 1 || Math.abs(dy) < 50) return;
    const next = page + (dy < 0 ? 2 : -2); // 손가락 위로 = 아래 화면
    if (next >= 0 && next < SECTIONS.length) goTo(next);
  };

  const onShutter = () => {
    setStep('analyzing');
    goTo(PAGE.mimir);
    // 미미르 화면에서 잠시 대기 → 비석으로 이동
    setTimeout(() => {
      setStep('result');
      if (mode === 'checkup') {
        // 검진: 샘에서 바로 결과 → 확인 후 상층부로
        const body = CHECKUPS[Math.floor(Math.random() * CHECKUPS.length)];
        setLines([{ title: `${MY_PLANT.name} 검진 결과`, body }]);
        return;
      }
      // 수집·등록: 비석에서 식물류 표시 → 미미르 설명 → (수집이고 처음이면) 해금 → 수집은 하층부, 등록은 상층부로
      // ponytail: 등록 후 이름 입력·상층부 배치는 아직 없음(기획상 미구현).
      const r = RESULTS[Math.floor(Math.random() * RESULTS.length)];
      const isNew = mode === 'collect' && !found.includes(r.name);
      setResult(r);
      setLines([
        { title: '미미르', body: `이 아이는 ${r.name}로군.` },
        { title: r.name, body: r.desc },
        ...(isNew ? [{ title: '새 캐릭터 해금!', body: `처음 만난 아이야. ${r.name}이(가) 비석에 기록되었네.` }] : []),
      ]);
      if (isNew) setFound((f) => [...f, r.name]);
      goTo(PAGE.stone);
    }, 2500);
  };

  const onNext = () => {
    if (lines.length > 1) return setLines(lines.slice(1));
    setStep('idle');
    goTo(mode === 'collect' ? PAGE.home : PAGE.top);
  };

  const openCamera = (m: Mode) => {
    setMode(m);
    setStep('camera');
  };

  // + 깃발: 상층부 = 반려 식물 등록, 하층부 = 식물 수집
  const flags = (y: number, flagMode: Mode) => (
    <>
      <Image source={img.odin} style={box(20, y - 40, 48, 48)} />
      <Image source={img.mapFlag} style={box(-10, y, 120, 360)} />
      <Pressable style={box(-10, y + 210, 120, 360)} onPress={() => !moved.current && openCamera(flagMode)} disabled={step !== 'idle'}>
        <Image source={img.addFlag} style={StyleSheet.absoluteFill} />
      </Pressable>
    </>
  );

  return (
    <View style={styles.fill}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={styles.page}
        onTouchStart={(e) => { touchY.current = e.nativeEvent.pageY; moved.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.nativeEvent.pageY - touchY.current) > 10) moved.current = true; }}
        onTouchEnd={(e) => onTouchEnd(e.nativeEvent.pageY)}>
        <View style={{ height: H * SECTIONS.length * s, transform: [{ translateY: -page * H * s }] }}>
          {SECTIONS.map((src, i) => (
            <Image key={i} source={src} style={box(0, H * i, W, H)} />
          ))}

          {/* 상층부 */}
          {flags(Y.top + 210, 'register')}
          <Pressable style={box(230, Y.top + 280, 120, 120)} onPress={() => !moved.current && openCamera('checkup')} disabled={step !== 'idle'}>
            <Image source={MY_PLANT.char} style={StyleSheet.absoluteFill} />
          </Pressable>

          {/* 홈 */}
          {flags(Y.home + 130, 'collect')}
          {/* 메인 캐릭터. ponytail: 고정값 — 메인 캐릭터 변경 기능 붙일 때 state로 */}
          <Image source={img.c111} style={box(80, Y.home + 280, 220, 220)} />

          {/* 비석 */}
          <Image source={img.odin} style={box(100, Y.stone + 55, 48, 48)} />
          {/* 빨간 원 = 식물류, 숫자 배지 = 식물 한 종류. 누르면 설명 오버레이 */}
          {PARENT_ICONS.map((p) => (
            <Pressable key={p.name} style={box(p.x - 24, Y.stone + p.y - 24, 48, 48)} onPress={() => !moved.current &&
                // 초기 분화군은 배지 없는 목련을 함께 보여줌(발견했을 때만)
                setDetail(p.code === 'p55' && found.includes(MAGNOLIA.name)
                  ? { name: `${p.name} · ${MAGNOLIA.name}`, desc: `${p.desc}\n\n${MAGNOLIA.desc}`, char: MAGNOLIA.char }
                  : p)}
              disabled={step !== 'idle'}>
              <Image source={p.src} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
          {CHILD_ICONS.map((c) => (
            <Pressable
              key={c.name}
              style={box(c.x - 15, Y.stone + c.y - 15, 30, 30)}
              // 미발견 식물은 이름·설명 숨김
              onPress={() => !moved.current && setDetail(found.includes(c.name) ? c : { name: '???', desc: '아직 만나지 못한 아이로군. 하층부에서 찾아보게.' })}
              disabled={step !== 'idle'}>
              <Image source={c.src} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
          {step === 'result' && mode !== 'checkup' && <Image source={result.char} style={box(110, Y.stone + 230, 160, 160)} />}

          {/* 샘 */}
          <Image source={img.mimir} style={box(60, Y.mimir + 180, 240, 240)} />
        </View>
      </View>

      {step === 'analyzing' && (
        <TextBox s={s} title="미미르" body="흠... 어떤 아이인지 살펴보는 중이네." />
      )}
      {step === 'result' && lines[0] && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onNext}>
          <TextBox s={s} title={lines[0].title} body={`${lines[0].body}\n\n(눌러서 ${lines.length > 1 ? '계속' : '돌아가기'})`} />
        </Pressable>
      )}
      {detail && (
        <Pressable style={[StyleSheet.absoluteFill, styles.dim]} onPress={() => setDetail(null)}>
          {detail.char && <Image source={detail.char} style={[styles.detailChar, { width: 160 * s, height: 160 * s }]} />}
          <TextBox s={s} title={detail.name} body={`${detail.desc}\n\n(눌러서 닫기)`} />
        </Pressable>
      )}

      <Modal visible={step === 'camera'} animationType="slide" onRequestClose={() => setStep('idle')}>
        <View style={styles.fill}>
          <Image source={img.bgCamera} style={StyleSheet.absoluteFill} contentFit="cover" />
          <Pressable style={styles.back} onPress={() => setStep('idle')}>
            <Image source={img.backBtn} style={styles.fill} />
          </Pressable>
          {/* ponytail: 실제 촬영 없음(dummy). expo-camera 붙이면 여기서 takePictureAsync */}
          <Pressable style={styles.shutter} onPress={onShutter}>
            <Image source={img.shutter} style={styles.fill} />
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
  page: { flex: 1, overflow: 'hidden' },
  dim: { backgroundColor: 'rgba(0,0,0,0.5)' },
  detailChar: { alignSelf: 'center', marginTop: 120 },
  dialog: { position: 'absolute', left: '50%', bottom: 32 },
  cover: { backgroundColor: '#777777', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 16 },
  body: { color: '#fff', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  back: { position: 'absolute', top: 56, left: 16, width: 48, height: 48 },
  shutter: { position: 'absolute', bottom: 80, alignSelf: 'center', width: 72, height: 72 },
});
