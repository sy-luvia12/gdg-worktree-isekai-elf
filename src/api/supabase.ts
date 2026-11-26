import { createClient } from '@supabase/supabase-js';

// 값은 .env.local 에서 옴 (git에 안 올라감).
// ponytail: 로그인 세션 저장소 없음 → 앱 껐다 켜면 로그아웃됨. 로그인 붙일 때 auth.storage 추가.
export const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
);
