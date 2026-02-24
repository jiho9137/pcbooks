# 포토카드북 가상 책장 — 파일 구조 (보완안)

Next.js 기반 포토카드북 가상 책장 앱의 디렉터리·파일 구조입니다.  
**스택: Next.js + Supabase + Vercel Blob + Vercel 배포.**

- **Supabase**: 로그인(Auth), DB(책·카드·설정)
- **Vercel Blob**: 이미지 파일 저장 (DB에는 URL만 저장)
- **Repo**: 앱 코드 + 책/카드 타입 정의 + 설정 기본값

---

## 프로젝트 루트

```
D:\repository2\pcbooks\
```

---

## 1. 로그인 — Supabase Auth

비밀번호 파일 없이 **Supabase Auth**로 로그인 처리.

| 구분 | 위치 | 설명 |
|------|------|------|
| 인증 | **Supabase** | 이메일/비밀번호 또는 Magic Link 등 Supabase Auth 사용 |
| UI 설정 | `login/login.config.json` (선택) | 로그인 페이지 레이아웃·문구 등 |
| 컴포넌트 | `app/`, `components/login/` | 로그인 폼, 리다이렉트 처리 |

- Repo에는 **비밀번호·세션 저장 파일 없음**. 로그인/회원 정보는 전부 Supabase.
- `lib/supabase/client.ts` 등으로 Supabase 클라이언트 설정.

---

## 2. setting — 설정

**기본값**은 repo, **유저별 값**은 Supabase에 저장.

| 경로 | 설명 | 비고 |
|------|------|------|
| `setting/book_arrangement.json` | 책장 그리드 기본값 (예: 6x6) | Repo |
| `setting/book_open_mode.json` | 책 열기 방식 기본값: `popup` \| `fullscreen` | Repo |
| `setting/bookshelf.json` | 책장 초기 페이지 구성 (배경, 그리드 옵션 등) | Repo |
| `setting/settings_button.json` | 설정 버튼 위치·레이아웃 | Repo |
| `setting/theme.json` | 테마 기본값 (`dark` \| `light`) | Repo |
| `setting/sound.json` | 페이지 넘김 소리 on/off 기본값 | Repo |
| **Supabase** `user_settings` 테이블 | 유저별로 덮어쓴 설정 (배열, 열기 방식, 테마 등) | DB |

- 앱 로드 시: repo 기본값 + Supabase 유저 설정 병합.
- 설정 변경 시: Supabase에만 업데이트 (repo는 수정하지 않음).

---

## 3. booktype — 책 타입(템플릿)

포토카드북 “종류” 정의. **Repo에만 두고 Supabase에는 넣지 않음.** TypeScript로 정의·export 해서 타입 체크·import 사용.

```
booktype/
├── booktype001/
│   ├── definition.ts       # 타입 메타 (이름, 설명 등) export
│   ├── cover.ts            # 표지: wh, 커버 이미지, 폰트, 텍스트 위치 export
│   └── spread.ts           # 내지: wh, 카드 배치, 1페이지/2페이지 표시 여부 export
├── booktype002/
│   └── ...
├── index.ts                # 사용 가능한 책 타입 목록 export
└── types.ts                # BookType, CoverConfig, SpreadConfig 등 공통 타입 (선택)
```

**cover 예시 필드**: `wh`, `cover`, `font`, `textPosition`  
**spread 예시 필드**: `wh`, `cardArrangement`, `showSpread`

---

## 4. cardtype — 카드(포토카드) 타입

카드 한 장의 형태·레이아웃 정의. **Repo에만 둠.** TypeScript로 정의·export.

```
cardtype/
├── cardtype001/
│   ├── definition.ts
│   ├── layout.ts           # 앞/뒤 wh, 서브페이지, 폰트·텍스트·이미지 위치 export
│   └── style.ts             # 카드 형태·스타일 (선택) export
├── cardtype002/
│   └── ...
├── index.ts                 # 사용 가능한 카드 타입 목록 export
├── card_style_default.ts    # 카드 기본 형태/스타일 (공통) export
└── types.ts                 # CardType, LayoutConfig 등 공통 타입 (선택)
```

---

## 5. 저장된 포토카드북 — Supabase + Vercel Blob

**로컬 `save/` 폴더 없음.** 책·카드·페이지는 Supabase, 이미지는 Vercel Blob.

### Supabase 테이블 (예시)

| 테이블 | 역할 |
|--------|------|
| `books` | id, user_id, title, booktype_id, cardtype_id, created_at 등 |
| `book_pages` | id, book_id, page_order, 텍스트/메타 등 |
| `cards` | id, book_id 또는 page_id, 순서, 앞/뒤 텍스트, **image_url** (Blob URL) 등 |

- **image_url**: Vercel Blob에 업로드한 뒤 받은 URL을 저장.
- 책/카드 타입 이름(`booktype001` 등)만 저장해 repo의 booktype·cardtype과 연결.

### Vercel Blob

- 업로드: 클라이언트 또는 API Route에서 `@vercel/blob`로 업로드 → URL 획득.
- 저장: 해당 URL을 `cards.image_url` 등 Supabase 컬럼에 저장.
- 불러오기: DB에서 URL 조회 후 `<img src={url} />` 또는 Next.js `Image`로 표시.

### Repo에는 없음

- ~~save/001/~~, ~~book/~~, ~~card/~~, ~~img/~~ 폴더 구조는 사용하지 않음.

---

## 6. Next.js 앱 구조

```
pcbooks/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # 로그인 또는 책장 리다이렉트
│   ├── bookshelf/
│   │   └── page.tsx             # 책장 (6x6 그리드), Supabase에서 books 목록
│   ├── book/[id]/
│   │   └── page.tsx             # 책 보기 (setting 반영)
│   ├── create/
│   │   └── page.tsx             # 새 포토카드북 만들기
│   └── api/
│       ├── auth/                 # 필요 시 Supabase와 연동 래퍼
│       ├── books/
│       │   └── [id]/route.ts    # 책 CRUD (Supabase)
│       └── upload/               # 이미지 → Vercel Blob, URL 반환
│           └── route.ts
├── components/
│   ├── login/
│   ├── bookshelf/
│   ├── book-viewer/
│   └── settings/
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # 브라우저용 클라이언트
│   │   └── server.ts            # 서버용 (선택)
│   ├── blob.ts                  # Vercel Blob 업로드 헬퍼 (선택)
│   └── loadConfig.ts            # setting(기본값), booktype·cardtype import
├── public/
├── setting/                     # 기본 설정 (JSON 또는 .ts)
├── booktype/
├── cardtype/
└── login/                       # 로그인 페이지 UI 설정만 (선택)
```

- **save/** 폴더 없음. 데이터는 Supabase + Blob.
- `lib/loadConfig.ts`: repo의 `setting/`, `booktype/`, `cardtype/`만 읽음.

---

## 요약

| 구분 | 저장 위치 | 역할 |
|------|-----------|------|
| **로그인** | Supabase Auth | 회원/세션. Repo에는 로그인 페이지 UI 설정만. |
| **setting** | Repo (기본값) + Supabase (유저별) | 책장 배열, 열기 방식, 테마, 소리 등 |
| **booktype** | Repo | 책 타입별 표지·내지 정의 |
| **cardtype** | Repo | 카드 타입별 레이아웃·스타일 |
| **저장된 책** | Supabase (메타·구조) + Vercel Blob (이미지) | 책/페이지/카드 테이블 + 이미지 URL |

booktype·cardtype은 `.ts`로 정의·export, setting 기본값은 `.json` 또는 `.ts`, 이미지는 Blob에 업로드 후 URL만 DB에 저장.  
실제 저장 위치가 `D:\repository2\pcbooks`가 아니면 경로만 교체해 사용하면 됩니다.
