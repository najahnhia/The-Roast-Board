import React, { useState, useEffect, useRef } from "react";
import { Heart, Plus, X, Skull, TrendingUp, Users, Newspaper, Loader2 } from "lucide-react";

const AVATARS = ["😈","🤡","🦍","🐔","🦆","🐸","🦥","🐷","🦄","👻","🤖","🐍","🦖","🐒","🦝","🧌"];
const CATEGORIES = ["All", "Funny", "Gaming", "Cricket", "School", "Friends", "Random"];
const LEVELS = [
  { name: "New Roaster", min: 0 },
  { name: "Funny Guy", min: 5 },
  { name: "Roast Master", min: 15 },
  { name: "Roast Legend", min: 30 },
];
function getLevel(points) {
  return [...LEVELS].reverse().find((x) => points >= x.min) || LEVELS[0];
}


const STATE_KEY = "roastboard-state-v2";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Resize/compress an uploaded image file down to a small square JPEG data URL
// so it stays well under the storage size limit.
function fileToCompressedDataUrl(file, maxDim = 240, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like an image."));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function Avatar({ profile, size = 24 }) {
  if (profile.photo) {
    return (
      <img
        src={profile.photo}
        alt={profile.name}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--ink)",
          flexShrink: 0,
        }}
      />
    );
  }
  return <span style={{ fontSize: size }}>{profile.avatar}</span>;
}

export default function RoastBoard() {
  const [state, setState] = useState({
    profiles: [], posts: [], comments: [], currentUser: "Anonymous",
  });
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [tab, setTab] = useState("feed");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("new");
  const [anonymous, setAnonymous] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [reported, setReported] = useState([]);
  const [toast, setToast] = useState("");
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState(AVATARS[0]);
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [postAuthor, setPostAuthor] = useState("");
  const [postTarget, setPostTarget] = useState("");
  const [postText, setPostText] = useState("");
  const [postCategory, setPostCategory] = useState("Funny");
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STATE_KEY, true);
        if (res && res.value) {
          setState({ profiles: [], posts: [], comments: [], currentUser: "Anonymous", ...JSON.parse(res.value) });
        }
      } catch (e) {
        // no existing state yet, that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persist(next) {
    setState(next);
    try {
      const ok = await window.storage.set(STATE_KEY, JSON.stringify(next), true);
      if (!ok) setSaveError(true);
      else setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  async function handlePhotoFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("That's not an image file.");
      return;
    }
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setNewProfilePhoto(dataUrl);
    } catch (err) {
      setPhotoError(err.message || "Couldn't process that photo.");
    } finally {
      setPhotoBusy(false);
    }
  }

  function addProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    const profile = {
      id: uid(),
      name,
      avatar: newProfileAvatar,
      photo: newProfilePhoto || null,
      createdAt: Date.now(),
    };
    const next = { ...stateRef.current, profiles: [...stateRef.current.profiles, profile] };
    persist(next);
    setNewProfileName("");
    setNewProfileAvatar(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
    setNewProfilePhoto(null);
    setPhotoError("");
    setShowAddProfile(false);
  }

  function addPost() {
    const text = postText.trim();
    const author = postAuthor.trim() || "anonymous coward";
    if (!text || !postTarget) return;
    const post = {
      id: uid(),
      targetId: postTarget,
      author: anonymous ? "Anonymous" : author,
      text,
      category: postCategory,
      likes: [],
      createdAt: Date.now(),
    };
    const next = { ...stateRef.current, posts: [post, ...stateRef.current.posts] };
    persist(next);
    setPostText("");
    setShowAddPost(false);
  }

  function toggleLike(postId) {
    const voter = (postAuthor.trim() || "someone") + "-voter";
    const next = {
      ...stateRef.current,
      posts: stateRef.current.posts.map((p) => {
        if (p.id !== postId) return p;
        const has = p.likes.includes(voter);
        return { ...p, likes: has ? p.likes.filter((v) => v !== voter) : [...p.likes, voter] };
      }),
    };
    persist(next);
  }


  function addComment(postId) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    const comment = {
      id: uid(), postId, author: state.currentUser || "Anonymous",
      text, createdAt: Date.now(),
    };
    persist({ ...stateRef.current, comments: [...(stateRef.current.comments || []), comment] });
    setCommentDrafts((d) => ({ ...d, [postId]: "" }));
    setToast("Comment added.");
  }

  function reportPost(postId) {
    if (!reported.includes(postId)) {
      setReported((r) => [...r, postId]);
      setToast("Report recorded for review.");
    }
  }

  const allComments = state.comments || [];

  const profiles = state.profiles;
  const posts = state.posts;
  const comments = allComments;

  const filteredPosts = [...posts]
    .filter((p) => {
      const target = profileById(p.targetId);
      if (!target) return false;
      const q = search.trim().toLowerCase();
      return (category === "All" || (p.category || "Funny") === category) &&
        (!q || p.text.toLowerCase().includes(q) || target.name.toLowerCase().includes(q));
    })
    .sort((a, b) => sortMode === "hot"
      ? b.likes.length - a.likes.length
      : b.createdAt - a.createdAt);

  const totalLikes = posts.reduce((n, p) => n + p.likes.length, 0);
  const boardLevel = getLevel(totalLikes + posts.length);
  const roastOfDay = [...posts].sort((a, b) => b.likes.length - a.likes.length)[0];

  function profileById(id) {
    return profiles.find((p) => p.id === id);
  }

  function likesFor(profileId) {
    return posts.filter((p) => p.targetId === profileId).reduce((sum, p) => sum + p.likes.length, 0);
  }

  const leaderboard = [...profiles]
    .map((p) => ({ ...p, totalLikes: likesFor(p.id), roastCount: posts.filter((x) => x.targetId === p.id).length }))
    .sort((a, b) => b.totalLikes - a.totalLikes);

  const mostWanted = leaderboard[0];

  return (
    <div style={{ background: "var(--paper)", minHeight: "100%", fontFamily: "var(--font-body)", color: "var(--ink)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Special+Elite&family=Inter:wght@400;500;600;700&display=swap');
        :root {
          --paper: #EDE6D6;
          --paper-dark: #E2D9C4;
          --ink: #1C1B18;
          --tabloid-red: #C41E3A;
          --stamp-blue: #2F4858;
          --mustard: #E8A33D;
          --faded-line: #C9BFA8;
          --font-display: 'Anton', sans-serif;
          --font-body: 'Special Elite', 'Courier New', monospace;
          --font-ui: 'Inter', sans-serif;
        }
        .rb-btn {
          font-family: var(--font-ui);
          font-weight: 600;
          cursor: pointer;
          border: 2px solid var(--ink);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .rb-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--ink); }
        .rb-btn:active { transform: translate(1px, 1px); box-shadow: none; }
        .rb-tab { font-family: var(--font-ui); font-weight: 700; cursor: pointer; }
        .rb-card { background: white; border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--faded-line); }
        .rb-stamp {
          font-family: var(--font-display);
          border: 4px solid var(--tabloid-red);
          color: var(--tabloid-red);
          transform: rotate(-6deg);
          display: inline-block;
          padding: 2px 10px;
          letter-spacing: 2px;
          opacity: 0.9;
        }
        @media (prefers-reduced-motion: no-preference) {
          .rb-stamp { animation: stampIn 0.35s ease-out; }
        }
        @keyframes stampIn {
          0% { transform: rotate(-6deg) scale(2.2); opacity: 0; }
          70% { transform: rotate(-6deg) scale(0.95); opacity: 1; }
          100% { transform: rotate(-6deg) scale(1); opacity: 0.9; }
        }
        .rb-input {
          font-family: var(--font-ui);
          border: 2px solid var(--ink);
          background: white;
          padding: 8px 10px;
          width: 100%;
        }
        .rb-input:focus, .rb-btn:focus-visible, .rb-tab:focus-visible {
          outline: 3px solid var(--stamp-blue);
          outline-offset: 2px;
        }
        .rb-avatar-btn {
          font-size: 22px;
          padding: 4px 8px;
          border: 2px solid transparent;
          cursor: pointer;
          background: transparent;
        }
        .rb-avatar-btn.selected { border-color: var(--ink); background: var(--mustard); }
      `}</style>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 10, fontFamily: "var(--font-ui)" }}>
          <Loader2 size={20} className="rb-spin" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Pulling up the files...
        </div>
      ) : (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 60px" }}>
          {/* Header */}
          <header style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
            <button className="rb-btn" onClick={() => setShowRules(true)} style={{ marginBottom: 8, background: "white", padding: "6px 10px", fontSize: 11 }}>
              🛡️ COMMUNITY RULES
            </button>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, letterSpacing: 3, color: "var(--stamp-blue)", fontWeight: 700 }}>
              A COMPLETELY UNBIASED PUBLICATION
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 9vw, 64px)", margin: "4px 0 0", letterSpacing: 1, lineHeight: 0.95 }}>
              THE ROAST BOARD
            </h1>
            <div style={{ height: 3, background: "var(--ink)", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 600, color: "var(--stamp-blue)" }}>
              <span>VOL. 1, NO. WHATEVER</span>
              <span>{profiles.length} SUSPECT{profiles.length === 1 ? "" : "S"} ON FILE</span>
              <span>{posts.length} REPORT{posts.length === 1 ? "" : "S"} FILED</span>
            </div>
          </header>

          {saveError && (
            <div style={{ background: "#fff3cd", border: "2px solid var(--mustard)", padding: 10, marginBottom: 16, fontFamily: "var(--font-ui)", fontSize: 13 }}>
              Couldn't save that to the board — check your connection and try again.
            </div>
          )}

          {mostWanted && mostWanted.totalLikes > 0 && (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span className="rb-stamp">MOST WANTED: {mostWanted.name.toUpperCase()}</span>
            </div>
          )}

          {/* Tabs */}
          <nav style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid var(--ink)" }}>
            {[
              { id: "feed", label: "FEED", icon: Newspaper },
              { id: "leaderboard", label: "LEADERBOARD", icon: TrendingUp },
              { id: "profiles", label: "SUSPECTS", icon: Users },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  className="rb-tab"
                  onClick={() => { setTab(t.id); setActiveProfileId(null); }}
                  style={{
                    background: active ? "var(--ink)" : "transparent",
                    color: active ? "var(--paper)" : "var(--ink)",
                    border: "none",
                    padding: "8px 14px",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </nav>

          {/* FEED TAB */}
          {tab === "feed" && (
            <section>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div className="rb-card" style={{ padding: 12 }}>
                  <b style={{ fontFamily: "var(--font-ui)" }}>{boardLevel.name}</b>
                  <div style={{ fontSize: 11, color: "var(--stamp-blue)", marginTop: 3 }}>BOARD LEVEL</div>
                </div>
                <div className="rb-card" style={{ padding: 12 }}>
                  <b style={{ fontFamily: "var(--font-ui)" }}>{totalLikes + posts.length}</b>
                  <div style={{ fontSize: 11, color: "var(--stamp-blue)", marginTop: 3 }}>TOTAL POINTS</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <input className="rb-input" style={{ flex: 1, minWidth: 180 }}
                  placeholder="🔎 Search roasts or suspects..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="rb-input" style={{ width: "auto" }} value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
                  <option value="new">Newest</option>
                  <option value="hot">Most liked</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10 }}>
                {CATEGORIES.map((c) => (
                  <button key={c} className="rb-btn"
                    onClick={() => setCategory(c)}
                    style={{ padding: "6px 9px", background: category === c ? "var(--ink)" : "white", color: category === c ? "white" : "var(--ink)", whiteSpace: "nowrap", fontSize: 11 }}>
                    {c}
                  </button>
                ))}
              </div>

              {roastOfDay && (
                <div className="rb-card" style={{ padding: 14, marginBottom: 16, borderLeft: "7px solid var(--tabloid-red)" }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 24 }}>🔥 ROAST OF THE DAY</div>
                  <div style={{ marginTop: 6 }}>{roastOfDay.text}</div>
                  <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--stamp-blue)", marginTop: 6 }}>
                    {roastOfDay.likes.length} likes
                  </div>
                </div>
              <button
                className="rb-btn"
                onClick={() => setShowAddPost((v) => !v)}
                style={{ background: "var(--tabloid-red)", color: "white", padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
                disabled={profiles.length === 0}
                title={profiles.length === 0 ? "Add a suspect first" : ""}
              >
                <Plus size={16} /> FILE A REPORT
              </button>

              {profiles.length === 0 && (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--stamp-blue)" }}>
                  No suspects on file yet. Head to the "Suspects" tab and add your first friend to get the roasting started.
                </p>
              )}

              {showAddPost && (
                <div className="rb-card" style={{ padding: 16, marginBottom: 18 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <select className="rb-input" value={postTarget} onChange={(e) => setPostTarget(e.target.value)}>
                      <option value="">Who's it about?</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>
                      ))}
                    </select>
                    <input
                      className="rb-input"
                      placeholder="Your name (so they know who to blame)"
                      value={postAuthor}
                      onChange={(e) => setPostAuthor(e.target.value)}
                      maxLength={40}
                    />
                    <select className="rb-input" value={postCategory} onChange={(e) => setPostCategory(e.target.value)}>
                      {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <textarea
                      className="rb-input"
                      placeholder="Write a playful roast..."
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={3}
                      maxLength={400}
                    />
                    <label style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}>
                      <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> Post anonymously
                    </label>
                    <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--stamp-blue)" }}>
                      Keep it playful: no threats, hate, private information, or humiliating content.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="rb-btn" onClick={addPost} style={{ background: "var(--mustard)", padding: "8px 14px" }}>
                        Publish
                      </button>
                      <button className="rb-btn" onClick={() => setShowAddPost(false)} style={{ background: "white", padding: "8px 14px" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {posts.length === 0 && profiles.length > 0 && (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--stamp-blue)" }}>
                  The blotter is empty. Be the first to file a report.
                </p>
              )}

              <div style={{ display: "grid", gap: 14 }}>
                {filteredPosts.map((post) => {
                  const target = profileById(post.targetId);
                  if (!target) return null;
                  return (
                    <article key={post.id} className="rb-card" style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <button
                          onClick={() => { setActiveProfileId(target.id); setTab("profiles"); }}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}
                        >
                          <Avatar profile={target} size={30} />
                          <span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, textDecoration: "underline" }}>{target.name}</span>
                        </button>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--stamp-blue)" }}>{timeAgo(post.createdAt)}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 700, color: "var(--stamp-blue)", marginBottom: 5 }}>
                        {(post.category || "Funny").toUpperCase()}
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.5, margin: "0 0 10px" }}>{post.text}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-ui)" }}>
                        <span style={{ fontSize: 12, color: "var(--stamp-blue)" }}>— filed by {post.author}</span>
                        <button
                          className="rb-btn"
                          onClick={() => toggleLike(post.id)}
                          style={{ background: "white", padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                        >
                          <Heart size={14} fill={postAuthor && post.likes.includes((postAuthor.trim() || "someone") + "-voter") ? "var(--tabloid-red)" : "none"} color="var(--tabloid-red)" />
                          {post.likes.length}
                        </button>
                        <button className="rb-btn" onClick={() => setCommentDrafts((d) => ({ ...d, [post.id]: d[post.id] ?? "" }))}
                          style={{ background: "white", padding: "5px 10px", fontSize: 12 }}>
                          💬 {(comments.filter((c) => c.postId === post.id).length)}
                        </button>
                        <button className="rb-btn" onClick={() => reportPost(post.id)}
                          style={{ background: "white", padding: "5px 10px", fontSize: 12 }}>
                          🛡️ {reported.includes(post.id) ? "Reported" : "Report"}
                        </button>
                      </div>
                      {commentDrafts[post.id] !== undefined && (
                        <div style={{ marginTop: 10 }}>
                          {comments.filter((c) => c.postId === post.id).map((c) => (
                            <div key={c.id} style={{ borderTop: "1px dashed var(--faded-line)", padding: "7px 0", fontFamily: "var(--font-ui)", fontSize: 12 }}>
                              <b>{c.author}</b> — {c.text}
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: 6 }}>
                            <input className="rb-input" placeholder="Friendly reply..." maxLength={200}
                              value={commentDrafts[post.id]} onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}/>
                            <button className="rb-btn" onClick={() => addComment(post.id)} style={{ background: "var(--mustard)", padding: "7px 10px" }}>Post</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* LEADERBOARD TAB */}
          {tab === "leaderboard" && (
            <section>
              {leaderboard.length === 0 ? (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--stamp-blue)" }}>No suspects yet — nobody to rank.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {leaderboard.map((p, i) => (
                    <div key={p.id} className="rb-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 26, width: 40, color: i === 0 ? "var(--tabloid-red)" : "var(--ink)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Avatar profile={p} size={34} />
                      <button
                        onClick={() => { setActiveProfileId(p.id); setTab("profiles"); }}
                        style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 15, textDecoration: "underline" }}
                      >
                        {p.name}
                      </button>
                      <span style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--stamp-blue)" }}>{p.roastCount} roast{p.roastCount === 1 ? "" : "s"}</span>
                      <span style={{ fontFamily: "var(--font-ui)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <Heart size={14} fill="var(--tabloid-red)" color="var(--tabloid-red)" /> {p.totalLikes}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* PROFILES TAB */}
          {tab === "profiles" && !activeProfileId && (
            <section>
              <button
                className="rb-btn"
                onClick={() => setShowAddProfile((v) => !v)}
                style={{ background: "var(--stamp-blue)", color: "white", padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={16} /> ADD A SUSPECT
              </button>

              {showAddProfile && (
                <div className="rb-card" style={{ padding: 16, marginBottom: 18 }}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <input
                      className="rb-input"
                      placeholder="Friend's name"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      maxLength={30}
                    />
                    <div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, marginBottom: 6, color: "var(--stamp-blue)" }}>Mugshot photo (optional):</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            border: "2px solid var(--ink)",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "var(--paper-dark)",
                            flexShrink: 0,
                          }}
                        >
                          {newProfilePhoto ? (
                            <img src={newProfilePhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 28 }}>{newProfileAvatar}</span>
                          )}
                        </div>
                        <label
                          className="rb-btn"
                          style={{ background: "white", padding: "8px 12px", fontSize: 12, display: "inline-block", position: "relative" }}
                        >
                          {photoBusy ? "Processing..." : newProfilePhoto ? "Change photo" : "Upload photo"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoFile}
                            style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
                          />
                        </label>
                        {newProfilePhoto && (
                          <button
                            className="rb-btn"
                            onClick={() => setNewProfilePhoto(null)}
                            style={{ background: "white", padding: "8px 10px", fontSize: 12 }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {photoError && (
                        <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--tabloid-red)", marginTop: 6 }}>{photoError}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 12, marginBottom: 6, color: "var(--stamp-blue)" }}>
                        Or pick an emoji mugshot{newProfilePhoto ? " (used if you remove the photo)" : ""}:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {AVATARS.map((a) => (
                          <button
                            key={a}
                            className={`rb-avatar-btn${newProfileAvatar === a ? " selected" : ""}`}
                            onClick={() => setNewProfileAvatar(a)}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="rb-btn" onClick={addProfile} style={{ background: "var(--mustard)", padding: "8px 14px" }}>
                        Add to file
                      </button>
                      <button
                        className="rb-btn"
                        onClick={() => { setShowAddProfile(false); setNewProfilePhoto(null); setPhotoError(""); }}
                        style={{ background: "white", padding: "8px 14px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {profiles.length === 0 ? (
                <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--stamp-blue)" }}>No one's been added yet. Add your first friend above.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveProfileId(p.id)}
                      className="rb-card"
                      style={{ padding: 14, textAlign: "center", cursor: "pointer", background: "white" }}
                    >
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <Avatar profile={p} size={56} />
                      </div>
                      <div style={{ fontFamily: "var(--font-ui)", fontWeight: 700, fontSize: 14, marginTop: 6 }}>{p.name}</div>
                      <div style={{ fontFamily: "var(--font-ui)", fontSize: 11, color: "var(--stamp-blue)", marginTop: 2 }}>
                        {posts.filter((x) => x.targetId === p.id).length} report{posts.filter((x) => x.targetId === p.id).length === 1 ? "" : "s"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SINGLE PROFILE VIEW */}
          {tab === "profiles" && activeProfileId && (() => {
            const p = profileById(activeProfileId);
            if (!p) return null;
            const profilePosts = posts.filter((x) => x.targetId === p.id);
            return (
              <section>
                <button
                  onClick={() => setActiveProfileId(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--stamp-blue)", marginBottom: 14, fontWeight: 600 }}
                >
                  ← BACK TO ALL SUSPECTS
                </button>
                <div className="rb-card" style={{ padding: 20, textAlign: "center", marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Avatar profile={p} size={90} />
                  </div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: "6px 0" }}>{p.name.toUpperCase()}</h2>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20, fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--stamp-blue)" }}>
                    <span>{profilePosts.length} report{profilePosts.length === 1 ? "" : "s"}</span>
                    <span>{likesFor(p.id)} total likes</span>
                  </div>
                </div>
                {profilePosts.length === 0 ? (
                  <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--stamp-blue)" }}>Nothing filed on {p.name} yet. Clean record — for now.</p>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {profilePosts.map((post) => (
                      <article key={post.id} className="rb-card" style={{ padding: 14 }}>
                        <div style={{ fontFamily: "var(--font-ui)", fontSize: 10, color: "var(--stamp-blue)", fontWeight: 700 }}>{(post.category || "Funny").toUpperCase()}</div><p style={{ fontSize: 15, lineHeight: 1.5, margin: "4px 0 8px" }}>{post.text}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--stamp-blue)" }}>
                          <span>— {post.author} · {timeAgo(post.createdAt)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Heart size={13} fill="var(--tabloid-red)" color="var(--tabloid-red)" /> {post.likes.length}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
