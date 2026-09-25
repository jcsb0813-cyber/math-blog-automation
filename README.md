# 수학학원 블로그 자동화

학년만 입력하면 네이버 블로그 발행 직전까지 자동으로 준비해주는 파이프라인입니다.

```
학년 입력
  └─ 1. 주제 선정 (검색량/이슈 기반)
  └─ 2. 본문 작성 (육아맘 + 파워블로거 톤)
  └─ 3. 학원생활 사진 선택 (동의된 사진만)
  └─ 4. 카드뉴스 4장 제작 (Canva)
  └─ 5. 교육적/법적 검수
  └─ 6. 원장님 최종검수용 패키지 생성
  └─ (원장님이 확인 후 네이버 블로그에 직접 발행)
```

## 왜 "완전 자동발행"이 아닌가

네이버 블로그는 개인 블로그에 대한 공식 자동포스팅 API를 제공하지 않습니다. 그래서
5번 검수까지는 완전 자동화하고, **최종 발행은 원장님이 결과물을 확인한 뒤 직접 클릭**하는
구조로 설계했습니다. 이 방식은 학원법상 광고 규정(과장광고 금지 등)과 미성년자 초상권
리스크를 원장님이 마지막에 한 번 더 걸러낸다는 장점도 있습니다.

## 폴더 구조

- `docs/STYLE_GUIDE.md` — 문체 가이드 (육아맘 + 교육 파워블로거 톤)
- `docs/COMPLIANCE_CHECKLIST.md` — 발행 전 필수 검수 체크리스트
- `docs/SETUP_CHECKLIST.md` — 실제로 돌리기 전에 준비해야 할 계정/키 목록 (지금 여기부터 보세요)
- `config/photo_manifest.example.json` — 동의받은 사진을 태깅해서 관리하는 형식
- `scripts/topic_research.py` — 네이버 데이터랩/검색 API로 학년별 트렌드 주제 후보 추출
- `scripts/make_reel.py` — 수학 문제 릴스 MP4(1080x1920) 생성기 (문제 → 카운트다운 → 풀이 → 정답)
- `examples/reels/` — 릴스 스펙 JSON 예시
- `.claude/skills/reels-auto/SKILL.md` — `/reels-auto 중2` 로 문제 선정부터 영상까지 자동 생성
- `.claude/skills/blog-auto/SKILL.md` — Claude Code가 이 전체 파이프라인을 실행할 때 따르는 절차
- `output/` — 회차별 결과물 (본문 초안, 카드뉴스, 검수 리포트)이 쌓이는 곳

## 수학 릴스 자동 생성

`/reels-auto 중2` 처럼 학년만 말하면 Claude가 문제를 고르고, 풀이를 검산한 뒤 영상을 만듭니다.
직접 돌릴 때는:

```
pip install -r requirements.txt
python scripts/make_reel.py examples/reels/중2_연립방정식.json
python scripts/make_reel.py examples/reels/엄마도헷갈리는/*.json   # 시리즈 전체 한 번에
```

결과: `output/<날짜>_<학년>_reel_<단원>/reel.mp4` + `cover.png` + `caption.md`.
네이버 API나 Canva 없이도 바로 동작합니다.

## 지금 당장 해야 할 일

`docs/SETUP_CHECKLIST.md`를 확인하세요. GitHub 계정, 네이버 오픈API 키, Canva 브랜드
템플릿, 사진 매니페스트 정리가 끝나야 실제로 돌려볼 수 있습니다.
