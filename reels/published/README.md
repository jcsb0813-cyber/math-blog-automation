# 발행용 최종 mp4 보관함

`output/reels/`는 렌더링 작업 공간이라 `.gitignore`에 포함되어 매번 초기화됩니다
(세션이 끝나면 사라짐). 반면 이 폴더(`reels/published/`)는 **git에 커밋되는 영구
보관용**입니다 — `daily-reels` 자동화(및 수동 렌더링 결과물)가 여기에 최종 mp4를
저장하면, 세션이 끝나도 GitHub 저장소에 그대로 남습니다.

## 파일명 규칙
```
reels/published/<YYYY-MM-DD>_<topic-slug>.mp4
```
예: `2026-09-27_prime-spiral.mp4`

## 용량 관리
용량이 너무 커지면(예: 저장소가 수백 MB를 넘어가면) 오래된 회차부터 GitHub Release
에셋으로 옮기고 이 폴더에서는 지우는 것을 고려하세요. `reels/topics_log.json`에는
어떤 영상이 어떤 주제였는지 기록이 남아있으니 삭제해도 기획 이력은 보존됩니다.
