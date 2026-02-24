# Vercel Blob 설정 (카드 이미지 업로드)

카드 이미지는 **드래그앤드롭** 시 Vercel Blob에 업로드되고, 저장되는 값은 **URL**만 있습니다 (기존처럼 URL 직접 입력도 그대로 사용 가능).

## 1. Vercel에서 Blob 스토어 만들기

1. [Vercel 대시보드](https://vercel.com) → 해당 프로젝트 선택
2. **Storage** 탭 → **Create Database** → **Blob** 선택
3. 스토어 이름 입력 후 **Create**
4. 접근 권한: **Public** (이미지 URL을 `<img src>`로 바로 쓰기 위해)
5. 생성 후 프로젝트에 `BLOB_READ_WRITE_TOKEN` 환경 변수가 자동 추가됨

## 2. 로컬에서 토큰 쓰기

**방법 A – Vercel CLI (권장)**

```bash
vercel env pull
```

`.env.local`에 `BLOB_READ_WRITE_TOKEN`이 내려옵니다.

**방법 B – 수동**

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. `BLOB_READ_WRITE_TOKEN` 값 복사
3. 프로젝트 루트 `.env.local`에 추가:

```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx...
```

## 3. 동작 방식

- **카드 설정** 모달에서 이미지를 **드래그앤드롭**하면 → `POST /api/upload`로 파일 전송 → Blob에 업로드 → 반환된 **URL**을 카드의 전면/후면 이미지로 저장
- **이미지 URL**을 직접 입력하면 → 그대로 URL만 저장 (업로드 없음)
- 기존에 **data URL(base64)** 로 저장된 카드도 그대로 표시됨

## 4. 참고

- 한 파일당 **4.5MB** 이하 권장 (Vercel 서버리스 요청 제한)
- Blob 스토어를 만들기 전에 업로드하면 API에서 500 에러가 날 수 있으므로, 배포/실행 전에 위 설정을 먼저 해 두는 것이 좋습니다.
