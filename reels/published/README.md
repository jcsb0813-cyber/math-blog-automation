# 발행용 최종 mp4 보관함

`output/reels/`는 렌더링 작업 공간이라 `.gitignore`에 포함되어 매번 초기화됩니다
(세션이 끝나면 사라짐). 반면 이 폴더(`reels/published/`)는 **git에 커밋되는 영구
보관용**입니다 — `daily-reels` 자동화(및 수동 렌더링 결과물)가 여기에 최종 mp4를
저장하면, 세션이 끝나도 GitHub 저장소에 그대로 남습니다.

## 폴더 규칙
하루치 배치(현재 5개)는 날짜별 하위 폴더에 모아서 저장합니다 — 골라 쓰기 편하도록:
```
reels/published/<YYYY-MM-DD>/<topic-slug>.mp4
```
예: `reels/published/2026-09-27/prime_spiral.mp4`

(과거 회차 중 일부는 날짜별 폴더 도입 전이라 `reels/published/<YYYY-MM-DD>_<slug>.mp4`
평평한 이름으로 남아있을 수 있습니다.)

## 용량 관리
용량이 너무 커지면(예: 저장소가 수백 MB를 넘어가면) 오래된 회차부터 GitHub Release
에셋으로 옮기고 이 폴더에서는 지우는 것을 고려하세요. `reels/topics_log.json`에는
어떤 영상이 어떤 주제였는지 기록이 남아있으니 삭제해도 기획 이력은 보존됩니다.
