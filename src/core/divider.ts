import { type Member, type DivOptions } from '../types';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// score が最小の班（同点の場合は人数が少ない班）のインデックスを返す
function pickLeastLoadedTeam(teams: Member[][], score: (team: Member[]) => number = (t) => t.length): number {
  let best = 0;
  for (let k = 1; k < teams.length; k++) {
    if (
      score(teams[k]) < score(teams[best]) ||
      (score(teams[k]) === score(teams[best]) && teams[k].length < teams[best].length)
    ) {
      best = k;
    }
  }
  return best;
}

const hasTag = (m: Member, tag: string) => (m.tags ?? []).includes(tag);

export function divide(members: Member[], teamCount: number, options: DivOptions): Member[][] {
  const { useCore, balG, fixedGroups = [], spreadTags = [], spreadCheckedIn = false } = options;
  const teams: Member[][] = Array.from({ length: teamCount }, () => []);
  const placed = new Set<string>();

  // 固定グループを配置（人数が多いグループから、最も人数の少ない班へ丸ごと入れる）
  const groups = shuffle(fixedGroups)
    .map((ids) => ids.map((id) => members.find((m) => m.id === id)).filter((m): m is Member => !!m))
    .filter((g) => g.length > 0)
    .sort((a, b) => b.length - a.length);

  for (const group of groups) {
    const remaining = group.filter((m) => !placed.has(m.id));
    if (remaining.length === 0) continue;
    const t = pickLeastLoadedTeam(teams);
    teams[t].push(...remaining);
    remaining.forEach((m) => placed.add(m.id));
  }

  // 幹部を各班に分散
  if (useCore) {
    const coreMembers = shuffle(members.filter((m) => !placed.has(m.id) && m.core));
    for (const m of coreMembers) {
      const t = pickLeastLoadedTeam(teams, (team) => team.filter((x) => x.core).length);
      teams[t].push(m);
      placed.add(m.id);
    }
  }

  // 指定タグごとに各班へ分散
  for (const tag of spreadTags) {
    const tagged = shuffle(members.filter((m) => !placed.has(m.id) && hasTag(m, tag)));
    for (const m of tagged) {
      const t = pickLeastLoadedTeam(teams, (team) => team.filter((x) => hasTag(x, tag)).length);
      teams[t].push(m);
      placed.add(m.id);
    }
  }

  // 到着済みメンバーを各班へ分散（未到着者も含めて班分けするモード）
  if (spreadCheckedIn) {
    const arrived = shuffle(members.filter((m) => !placed.has(m.id) && m.checkedIn));
    for (const m of arrived) {
      const t = pickLeastLoadedTeam(teams, (team) => team.filter((x) => x.checkedIn).length);
      teams[t].push(m);
      placed.add(m.id);
    }
  }

  const remainder = members.filter((m) => !placed.has(m.id));

  // 男女均等
  if (balG) {
    const byG: Record<string, Member[]> = {
      male: shuffle(remainder.filter((m) => m.gender === 'male')),
      female: shuffle(remainder.filter((m) => m.gender === 'female')),
      other: shuffle(remainder.filter((m) => m.gender === 'other')),
    };

    const gs = ['male', 'female', 'other'].sort((a, b) => byG[b].length - byG[a].length);

    for (const g of gs) {
      for (const m of byG[g]) {
        const t = pickLeastLoadedTeam(teams, (team) => team.filter((x) => x.gender === g).length);
        teams[t].push(m);
      }
    }
  } else {
    // 完全ランダム
    for (const m of shuffle(remainder)) {
      const t = pickLeastLoadedTeam(teams);
      teams[t].push(m);
    }
  }

  return teams;
}
