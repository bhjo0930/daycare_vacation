# 어린이집 휴가 관리

Google 플랫폼 없이 무료로 시작할 수 있도록 구성한 `Next.js + Supabase + Vercel` 기반 휴가 관리 앱입니다.

## 현재 구현

- 직원별 잔여 휴가 현황
- 직원 등록, 수정, 삭제
- 월간 휴가 캘린더
- 휴가 일정 등록
- 직원, 휴가, 현황 엑셀 저장
- 담당 반 검색 및 필터
- Supabase DB 기반 직원/휴가 저장

첫 화면은 기본 샘플 데이터로 렌더링되며, 로그인 후 Supabase DB에서 최신 직원/휴가 데이터를 불러옵니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 초기 로그인

- ID: `시립감일꿈꾸는어린이집`
- 비밀번호: `1234`

## Supabase 설정

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행합니다.
3. `.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_SCHEMA=daycare_vacation
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 API에서만 사용되며 브라우저에 노출하지 않습니다.

## 배포

Vercel Environment Variables에 다음 값을 등록한 뒤 다시 배포합니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_SCHEMA` (`daycare_vacation`)

## 다음 개발 후보

- 공휴일 및 주말 제외 계산
- 대체 교사 중복 배정 경고
- Supabase Auth 로그인
- 관리자/일반 직원 권한 분리
