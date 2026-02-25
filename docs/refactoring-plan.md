# 책 페이지(Book View) 리팩터링 계획

단일 책장, 단일 책임, 클린코드 원칙에 맞춘 단계별 리팩터링 계획.  
훅·컴포넌트·타입/상수·API/Blob 4축 + 정크 제거를 페이즈로 나눠 진행한다.

---

## 진행 상황 (체크리스트)

- [x] **Phase 0** — `lib/book/types.ts` 생성, `lib/bookConstants.ts` 상수 보강, `page.tsx` 인라인 타입 제거
- [x] **Phase 1** — `lib/upload.ts` (uploadCardImage, deleteCardImageUrls, isBlobUrl), `page.tsx`에서 해당 레이어만 사용
- [x] **Phase 2** — useInventoryCards, useSlotAssignments, useCardUpload 훅 분리 (`app/book/[id]/hooks/`)
- [x] **Phase 3** — InventoryGrid, SlotGrid, CardSettingsModal 컴포넌트 분리
- [x] **Phase 4** — 정리·정크 제거

---

## 원칙 (Principles)

| 원칙 | 적용 |
|------|------|
| **단일 책임 (SRP)** | 한 모듈/훅/컴포넌트는 한 가지 이유로만 변경된다. |
| **클린코드** | 이름은 의도를 드러내고, 함수는 짧고, 중복은 제거한다. |
| **정크 제거** | 사용하지 않는 코드, 죽은 분기, 과한 IIFE/인라인은 제거한다. |
| **점진적·가역** | 페이즈마다 동작 유지, 필요 시 롤백 가능하게 진행한다. |

---

## 현재 문제 요약

- **`app/book/[id]/page.tsx`** 단일 파일에 1100줄 이상 집중.
- 타입이 컴포넌트 내부/인라인에 산재 (`Book`, `BookPage`, `InventoryCard`, `SlotAssignments` 등).
- 인벤토리·슬롯·카드설정·드래그로직·Blob 호출이 한 페이지에 혼재.
- 슬롯 그리드(왼/오) 드롭 로직이 거의 동일하게 2회 반복.
- `fetch("/api/upload")` 직접 호출, Blob URL 판별·삭제 로직이 페이지에 있음.
- 카드 설정 UI가 큰 IIFE로만 구현되어 재사용·테스트가 어렵다.

---

## 페이즈 개요

| 페이즈 | 목표 | 산출물 | 위험도 |
|--------|------|--------|--------|
| **0** | 타입·상수 정리 | `types/book.ts`, 기존 constants 보강 | 낮음 |
| **1** | API/Blob 레이어 | `lib/upload.ts`, 페이지는 이 레이어만 사용 | 낮음 |
| **2** | 훅 분리 | `useInventoryCards`, `useSlotAssignments`, `useCardUpload` 등 | 중간 |
| **3** | 컴포넌트 분리 | 인벤토리 그리드, 슬롯 그리드, 카드 설정 모달 | 중간 |
| **4** | 정리·정크 제거 | 중복 제거, 죽은 코드 제거, 네이밍 정리 | 낮음 |

---

## Phase 0: 타입·상수 정리 (Types & Constants)

**목표:** 타입과 상수를 한 곳으로 모아, 페이지는 “무엇을 쓰는지”만 보이게 한다.

### 0.1 타입 파일

- **파일:** `lib/book/types.ts` (또는 `types/book.ts` — 프로젝트 컨벤션에 맞춤)
- **내용:**
  - `Book` — 책 메타 (id, title, booktype_id, cardtype_id, cards_per_side_rows/cols)
  - `BookPage` — 페이지 (id, book_id, page_order, label)
  - `InventoryCard` — 인벤토리 카드 (id, frontCardTypeId, backCardTypeId, frontImage?, backImage?)
  - `SlotAssignments` — `Record<string, (InventoryCard | string | null)[]>`
  - `CardSettingsDraft` — 카드 설정 모달용 (frontCardTypeId, backCardTypeId, frontImage, backImage)
  - `ViewMode` — `"scroll" | "flip"`
- **제거:** `page.tsx` 내부의 `type Book = ...`, `type InventoryCard = ...` 등 인라인 타입 정의 전부.
- **검증:** `page.tsx`에서 위 타입만 import 해서 사용, 빌드·타입체크 통과.

### 0.2 상수

- **기존:** `lib/bookConstants.ts` — `DEFAULT_BOOK_PAGES` 유지.
- **추가(선택):** 인벤토리/슬롯 localStorage 키 접두어, 리사이즈 min/max 등 한 곳에 상수로 두기.
- **검증:** 매직 넘버(200, 720, 12 등)가 필요한 곳은 named constant로 치환 여부만 점검.

### 산출물

- `lib/book/types.ts` (또는 `types/book.ts`)
- `page.tsx`에서 해당 타입 import만 사용, 내부 타입 정의 0개.

---

## Phase 1: API/Blob 레이어 (lib/upload.ts)

**목표:** 업로드·삭제는 한 모듈에서만 수행하고, Blob URL 판별·에러 처리도 여기서만 한다.

### 1.1 업로드/삭제 클라이언트

- **파일:** `lib/upload.ts`
- **역할:**
  - `uploadCardImage(file: File, bookId: string): Promise<string>`  
    - FormData 구성, `POST /api/upload`, 응답에서 `url` 반환.  
    - 실패 시 에러 메시지 throw 또는 `Promise.reject`.
  - `deleteCardImageUrls(urls: string[]): Promise<void>`  
    - Blob URL만 필터 후 `DELETE /api/upload` body `{ urls }`.  
    - 실패 시 로그만 하거나 throw (호출부에서 “카드는 지우고 Blob 실패는 무시” 등 정책 결정).
- **Blob URL 판별:** `isBlobUrl(url: string): boolean` — `*.blob.vercel-storage.com` 패턴 한 곳에서만 정의.
- **제거:** `page.tsx` 내부의 `fetch("/api/upload")`, `isBlobUrl` 인라인 구현, FormData 직접 다루기.

### 1.2 페이지 사용 방식

- 카드 설정: 이미지 선택/드롭 시 `uploadCardImage(file, bookId)` 호출 → 반환 URL을 draft에 반영.
- 카드 삭제: `[card.frontImage, card.backImage].filter(isBlobUrl)` 후 `deleteCardImageUrls(urls)` 호출.

### 산출물

- `lib/upload.ts` (uploadCardImage, deleteCardImageUrls, isBlobUrl)
- `page.tsx`에는 `lib/upload` 호출만 있고, fetch/Blob URL 정규식 없음.

---

## Phase 2: 훅 분리 (Hooks)

**목표:** 상태와 부수 효과를 책임 단위 훅으로 묶어, 페이지는 “조합”만 담당한다.

### 2.1 useInventoryCards

- **파일:** `app/book/[id]/hooks/useInventoryCards.ts` (또는 `hooks/useInventoryCards.ts`)
- **책임:** 인벤토리 카드 목록 + localStorage 동기화(로드/저장).
- **인터페이스:**
  - 입력: `bookId: string`
  - 반환: `[cards, setCards]` (또는 `{ cards, setCards, addCard, removeCard, updateCard }` 등 필요한 최소 API만)
- **이동 로직:** 기존 `inventoryStorageKey`, `skipNextInventorySave`, 인벤토리용 useEffect 두 개를 이 훅 안으로.
- **제거:** `page.tsx`에서 인벤토리 전용 state/effect/ref.

### 2.2 useSlotAssignments

- **파일:** `app/book/[id]/hooks/useSlotAssignments.ts`
- **책임:** 페이지별 슬롯 배치 + localStorage 동기화.
- **인터페이스:**
  - 입력: `bookId: string`
  - 반환: `[slotAssignments, setSlotAssignments]`
- **이동 로직:** `slotsStorageKey`, `skipNextSlotsSave`, 슬롯용 load/save useEffect.
- **제거:** `page.tsx`에서 슬롯 전용 state/effect/ref.

### 2.3 useCardUpload (또는 useCardImageUpload)

- **파일:** `app/book/[id]/hooks/useCardUpload.ts`
- **책임:** 카드 이미지 업로드 진행 상태 + 파일 선택/드롭 시 `uploadCardImage` 호출.
- **인터페이스:**
  - 입력: `bookId: string`, `onUploaded: (side: 'front'|'back', url: string) => void`
  - 반환: `{ uploadingSide, uploadFile, triggerFileSelect }` 등 (모달에서 쓰기 좋은 최소 API).
- **이동 로직:** `cardUploadingSide`, `fileInputSide`, `cardImageInputRef`, `uploadImageFile`/`handleFileInputChange`에 해당하는 부분. 내부에서 `lib/upload.uploadCardImage` 사용.
- **제거:** `page.tsx`에서 업로드 전용 state/ref/핸들러.

### 2.4 (선택) useInventoryResize

- **책임:** 인벤토리 패널 너비 + 리사이즈 마우스 이벤트만.
- **이동:** `inventoryWidth`, `isResizing`, `resizeStartX`, `resizeStartWidth`, 리사이즈 useEffect.
- 페이즈 2에서 필수는 아니고, Phase 4에서 “정리”할 때 묶어도 됨.

### 산출물

- `useInventoryCards`, `useSlotAssignments`, `useCardUpload` 훅 파일.
- `page.tsx`는 위 훅들을 조합해 데이터와 핸들러만 소비.

---

## Phase 3: 컴포넌트 분리 (Components)

**목표:** 인벤토리·슬롯 그리드·카드 설정 모달을 각각 단일 책임 컴포넌트로 분리하고, 드롭 로직 중복을 제거한다.

### 3.1 인벤토리 그리드

- **파일:** `app/book/[id]/components/InventoryGrid.tsx` (또는 `components/book/InventoryGrid.tsx`)
- **책임:** 카드 목록 렌더 + 드래그 소스 + 인벤토리로 드롭 시 처리.
- **Props:** `cards`, `cardDisplaySide`, `onDisplaySideToggle`, `onCardContextMenu`, `onDropFromSlot`, `onCreateCard` 등 (필요한 최소만).
- **이동:** 현재 aside 안의 그리드 + “카드 만들기” 버튼 + 인벤토리 onDrop.
- **제거:** `page.tsx` 안의 인벤토리용 JSX 블록.

### 3.2 슬롯 그리드 (한 페이지 단위)

- **파일:** `app/book/[id]/components/SlotGrid.tsx`
- **책임:** 한 페이지(left 또는 right)의 슬롯들 렌더 + 드래그 소스/드롭 타깃.
- **Props:** `pageId`, `slotCount`, `rows`, `cols`, `slotAssignments`(해당 페이지 슬라이스), `inventoryCards`, `cardDisplaySide`, `setSlotAssignments`, `setInventoryCards`, (선택) `pageLabel`, `onLabelEdit` 등.
- **중요:** “슬롯에 드롭” 로직(인벤토리→슬롯, 슬롯→슬롯)을 **한 번만** 구현하고, 빈 슬롯 div와 “카드 있는 슬롯” 내부 div 모두 같은 핸들러를 쓰도록 구성.
- **이동:** `renderSpreadSection` 내부의 왼쪽/오른쪽 그리드 블록을 `<SlotGrid ... />` 두 번으로 치환. 공통 드롭 로직은 SlotGrid 또는 공용 `useSlotDropHandler`로.
- **제거:** `page.tsx` 안의 슬롯 그리드 JSX 및 중복된 onDrop 블록 2세트.

### 3.3 카드 설정 모달

- **파일:** `app/book/[id]/components/CardSettingsModal.tsx`
- **책임:** 카드 타입 선택, 전/후면 이미지 입력(드롭·파일 선택·URL), 적용·삭제·닫기.
- **Props:** `card`, `draft`, `book`, `onDraftChange`, `onApply`, `onDelete`, `onClose`, `upload` 관련(또는 `useCardUpload` 반환값), `cardTypesForBook`.
- **이동:** 현재 `cardSettingsCardId && book && cardSettingsDraft && (() => { ... })()` 전체를 이 컴포넌트로. hidden file input 포함.
- **제거:** `page.tsx` 안의 IIFE 및 카드 설정용 인라인 렌더.

### 3.4 (선택) 스프레드 섹션

- **파일:** `SpreadSection.tsx` 또는 `BookSpread.tsx`
- **책임:** 왼쪽/오른쪽 페이지 레이아웃 + 라벨 편집 + SlotGrid 두 개 배치.
- 페이즈 3에서 SlotGrid까지 분리한 뒤, “한 스프레드” 단위가 여전히 크면 이 단계에서 분리.

### 산출물

- `InventoryGrid.tsx`, `SlotGrid.tsx`, `CardSettingsModal.tsx`.
- `page.tsx`는 레이아웃(헤더, aside, main)과 위 컴포넌트 조합 + 훅 조합만 유지.

---

## Phase 4: 정리·정크 제거 (Cleanup)

**목표:** 중복 제거, 사용하지 않는 코드·변수 제거, 이름 정리.

### 4.1 드롭 로직 단일화

- 슬롯 onDrop(빈 칸 + 카드 있는 칸)이 동일한 “이동/배치” 규칙을 쓰도록 하나의 함수(예: `handleSlotDrop`)로 통합.
- 데이터 전달: `getData("text/plain")` 파싱, `setSlotAssignments`/`setInventoryCards` 갱신을 한 곳에서만 수행.

### 4.2 죽은 코드 제거

- 사용하지 않는 state, 사용하지 않는 import, 주석 처리된 블록 제거.
- `viewMode`/`flipSpreadIndex` 등 실제로 UI에 쓰이지 않으면 제거하거나, “flip 모드”가 있다면 최소한으로만 유지.

### 4.3 네이밍·가독성

- 핸들러 이름: `handleSlotDrop`, `handleInventoryDrop`, `handleCardDelete` 등 일관된 접두어.
- 복잡한 조건/파생 값은 named 변수 또는 작은 유틸로 분리해 의도를 드러냄.

### 4.4 (선택) useInventoryResize

- Phase 2에서 미뤄뒀다면 여기서 `useInventoryResize` 훅으로 분리해 인벤토리 너비 관련 상태·effect 제거.

### 산출물

- 중복 제거된 `page.tsx` 및 컴포넌트/훅.
- 불필요 코드 0, 린트/타입 통과.

---

## 디렉터리 구조 (목표)

```
app/book/[id]/
  page.tsx                 # 조합만: 훅 + 레이아웃 + 컴포넌트
  hooks/
    useInventoryCards.ts
    useSlotAssignments.ts
    useCardUpload.ts
    (useInventoryResize.ts)
  components/
    InventoryGrid.tsx
    SlotGrid.tsx
    CardSettingsModal.tsx
    (SpreadSection.tsx)

lib/
  book/
    types.ts
  bookConstants.ts         # 기존 + 필요 시 상수 추가
  upload.ts                # uploadCardImage, deleteCardImageUrls, isBlobUrl
```

---

## 실행 순서 요약

1. **Phase 0** → 타입/상수 정리. 빌드·동작 동일.
2. **Phase 1** → `lib/upload.ts` 도입 후 페이지에서만 이 레이어 사용. 동작 동일.
3. **Phase 2** → 훅 하나씩 도입 후 페이지에서 사용. 각 훅 단위로 빌드·한 번씩 수동 확인.
4. **Phase 3** → 컴포넌트 하나씩 분리(인벤토리 → 슬롯 그리드 → 카드 설정 모달). 각 단계에서 화면·드래그 동작 확인.
5. **Phase 4** → 중복·정크 제거, 네이밍 정리. 최종 린트/타입/동작 점검.

각 페이즈 끝에 `npm run build` 및 핵심 시나리오(책 열기, 카드 넣기/빼기, 카드 설정·이미지 업로드·삭제) 한 번씩 확인하면 롤백 비용을 줄일 수 있다.
