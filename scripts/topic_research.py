"""
학년별 주제 후보를 뽑는 스크립트.

네이버 오픈API(검색어트렌드=DataLab, 블로그/뉴스 검색)를 사용합니다.
사용 전 아래 환경변수가 필요합니다 (docs/SETUP_CHECKLIST.md 참고):
  NAVER_CLIENT_ID
  NAVER_CLIENT_SECRET

사용법:
  python scripts/topic_research.py --grade 중2
"""

import argparse
import json
import os
import sys
from datetime import date, timedelta

import requests

NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET")

# 학년별로 자주 검색되는 기본 시드 키워드. 실제 학원 커리큘럼에 맞게 조정하세요.
SEED_KEYWORDS_BY_GRADE = {
    "초3": ["초3 수학", "초3 수학 문제집", "초등 3학년 수학 진도"],
    "초4": ["초4 수학", "초4 분수", "초등 4학년 수학 문제집"],
    "초5": ["초5 수학", "초5 도형", "초등 5학년 수학 심화"],
    "초6": ["초6 수학", "중학 수학 선행", "초6 수학 겨울방학"],
    "중1": ["중1 수학", "중1 수학 시험기간", "중1 자유학년제 수학"],
    "중2": ["중2 수학", "중2 일차함수", "중2 수학 내신"],
    "중3": ["중3 수학", "중3 이차함수", "고등수학 선행"],
    "고1": ["고1 수학", "고1 수학 내신", "공통수학"],
    "고2": ["고2 수학", "수학1 수학2", "고2 수능 준비"],
    "고3": ["고3 수학", "수능 수학", "수시 정시 수학"],
}


def fetch_datalab_trend(keyword_group: str, keywords: list[str]) -> dict:
    """최근 3개월 검색량 추이 (상대값)."""
    end = date.today()
    start = end - timedelta(days=90)
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "timeUnit": "week",
        "keywordGroups": [{"groupName": keyword_group, "keywords": keywords}],
    }
    resp = requests.post(
        "https://openapi.naver.com/v1/datalab/search",
        headers={
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
            "Content-Type": "application/json",
        },
        data=json.dumps(body),
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()


def fetch_blog_hit_count(keyword: str) -> int:
    """해당 키워드로 현재 발행된 블로그 글 수 (경쟁도 참고용)."""
    resp = requests.get(
        "https://openapi.naver.com/v1/search/blog.json",
        headers={
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
        params={"query": keyword, "display": 1},
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json().get("total", 0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--grade", required=True, help="예: 중2, 초5, 고1")
    args = parser.parse_args()

    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print(
            "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 없습니다. "
            "docs/SETUP_CHECKLIST.md 를 먼저 진행하세요.",
            file=sys.stderr,
        )
        sys.exit(1)

    grade = args.grade
    seeds = SEED_KEYWORDS_BY_GRADE.get(grade)
    if not seeds:
        print(f"'{grade}'에 대한 시드 키워드가 없습니다. 이 스크립트 상단 표에 추가하세요.", file=sys.stderr)
        sys.exit(1)

    trend = fetch_datalab_trend(grade, seeds)

    candidates = []
    for kw in seeds:
        candidates.append({
            "keyword": kw,
            "blog_post_count": fetch_blog_hit_count(kw),
        })

    result = {
        "grade": grade,
        "trend_raw": trend,
        "candidates": candidates,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
