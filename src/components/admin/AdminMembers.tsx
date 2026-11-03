import { useEffect, useState } from "preact/hooks";

type Member = PublicMember;

const RANKS: SiteRank[] = ["normal", "editor", "admin"];
const LANGS = ["de", "fr", "ru", "es"] as const;

export function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/members/");
    const data = (await res.json().catch(() => ({}))) as { members?: Member[]; message?: string };
    if (!res.ok) {
      setError(data.message || "Could not load members.");
      return;
    }
    setMembers(data.members ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = async (memberId: string, path: string, body: Record<string, unknown>) => {
    setBusy(memberId + path);
    setError("");
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ memberId, ...body }),
    });
    const data = (await res.json().catch(() => ({}))) as { member?: Member; message?: string };
    setBusy(null);
    if (!res.ok) {
      setError(data.message || "Update failed.");
      return;
    }
    if (data.member) {
      setMembers((list) => list.map((m) => (m.id === data.member!.id ? data.member! : m)));
    } else {
      await load();
    }
  };

  return (
    <div>
      {error ? <p class="content-builder-status is-error">{error}</p> : null}
      <table class="admin-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Rank</th>
            <th>Publish</th>
            <th>Languages</th>
            <th>Discord</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <strong>{member.displayName || member.username}</strong>
                <div class="hint">@{member.username}</div>
              </td>
              <td>
                <select
                  value={member.siteRank}
                  disabled={busy !== null}
                  onChange={(e) =>
                    void patch(member.id, "/api/admin/site-rank/", {
                      siteRank: (e.currentTarget as HTMLSelectElement).value,
                    })
                  }
                >
                  {RANKS.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <label>
                  <input
                    type="checkbox"
                    checked={member.publishPermission}
                    disabled={member.siteRank !== "editor" || busy !== null}
                    onChange={(e) =>
                      void patch(member.id, "/api/admin/publish-permission/", {
                        publishPermission: (e.currentTarget as HTMLInputElement).checked,
                      })
                    }
                  />
                  {member.siteRank === "admin" ? <span class="admin-badge">always</span> : null}
                </label>
              </td>
              <td>
                {LANGS.map((locale) => {
                  const on = member.languages.includes(locale);
                  return (
                    <label key={locale} class="admin-lang-chip">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={busy !== null}
                        onChange={(e) => {
                          const checked = (e.currentTarget as HTMLInputElement).checked;
                          const languages = checked
                            ? [...new Set([...member.languages, locale])]
                            : member.languages.filter((l) => l !== locale);
                          void patch(member.id, "/api/admin/languages/", { languages });
                        }}
                      />
                      {locale}
                    </label>
                  );
                })}
              </td>
              <td>
                {member.discordLinked ? (
                  <span class="admin-badge">linked</span>
                ) : (
                  <span class="hint">—</span>
                )}
                {member.discordLinked ? (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void patch(member.id, "/api/admin/discord-role-sync/", {})}
                  >
                    Sync roles
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
