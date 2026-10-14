# 사용: YOUTUBE_API_KEY=... python3 -I youtube_조사.py 결과.json
import os, json, re, sys, urllib.request, urllib.parse
K = os.environ["YOUTUBE_API_KEY"]
B = "https://www.googleapis.com/youtube/v3/"
def get(ep, **p):
    p["key"] = K
    url = B + ep + "?" + urllib.parse.urlencode(p)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode()[:400], file=sys.stderr); sys.exit(1)
queries = ["공부법 쇼츠","공부 동기부여 쇼츠","자기계발 쇼츠","공부 자극 영상","성적 올리는 법","수학 공부법","학부모 자녀교육 쇼츠","공부 습관 만드는 법"]
ids = {}
for q in queries:
    for order in ("viewCount","relevance"):
        d = get("search", part="snippet", q=q, type="video", videoDuration="short",
                regionCode="KR", relevanceLanguage="ko", order=order, maxResults=25)
        for it in d.get("items", []):
            ids.setdefault(it["id"]["videoId"], q)
vids = list(ids)
out = []
def dur(s):
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s)
    h,mi,se = [int(x or 0) for x in m.groups()]
    return h*3600+mi*60+se
for i in range(0, len(vids), 50):
    d = get("videos", part="snippet,contentDetails,statistics", id=",".join(vids[i:i+50]))
    for v in d["items"]:
        s = dur(v["contentDetails"]["duration"])
        if s > 60: continue
        st = v["statistics"]
        out.append(dict(id=v["id"], q=ids[v["id"]], title=v["snippet"]["title"], ch=v["snippet"]["channelTitle"],
            views=int(st.get("viewCount",0)), likes=int(st.get("likeCount",0)), comments=int(st.get("commentCount",0)),
            sec=s, pub=v["snippet"]["publishedAt"][:10], desc=v["snippet"]["description"][:120].replace("\n"," ")))
out.sort(key=lambda x:-x["views"])
json.dump(out, open(sys.argv[1],"w"), ensure_ascii=False, indent=1)
print(len(out), "shorts")
