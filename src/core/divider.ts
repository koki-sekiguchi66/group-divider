import { type Member, type DivOptions } from '../types';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getTeamSizes(totalSize: number, teamCount: number): number[] {
  const base = Math.floor(totalSize / teamCount);
  const remainder = totalSize % teamCount;
  return Array.from({ length: teamCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function divide(members: Member[], teamCount: number, options: DivOptions): Member[][] {
  const { useCore, balG } = options;
  const sizes = getTeamSizes(members.length, teamCount);
  const teams: Member[][] = Array.from({ length: teamCount }, () => []);
  const cap = [...sizes];
  const placed = new Set<string>();

  // 幹部を各班に分散
  if (useCore) {
    const coreMembers = shuffle(members.filter((m) => m.core));
    let ti = 0;
    for (const m of coreMembers) {
      for (let k = 0; k < teamCount; k++) {
        const t = (ti + k) % teamCount;
        if (cap[t] > 0) {
          teams[t].push(m);
          cap[t]--;
          placed.add(m.id);
          ti = (t + 1) % teamCount;
          break;
        }
      }
    }
  }

  const rest = members.filter((m) => !placed.has(m.id));

  // 男女均等
  if (balG) {
    const byG: Record<string, Member[]> = {
      male: shuffle(rest.filter((m) => m.gender === 'male')),
      female: shuffle(rest.filter((m) => m.gender === 'female')),
      other: shuffle(rest.filter((m) => m.gender === 'other')),
    };

    const gs = ['male', 'female', 'other'].sort((a, b) => byG[b].length - byG[a].length);

    for (const g of gs) {
      for (const m of byG[g]) {
        let best = -1;
        for (let k = 0; k < teamCount; k++) {
          if (cap[k] <= 0) continue;
          
          const getGCount = (team: Member[], gender: string) => team.filter((x) => x.gender === gender).length;

          if (
            best === -1 ||
            getGCount(teams[k], g) < getGCount(teams[best], g) ||
            (getGCount(teams[k], g) === getGCount(teams[best], g) && teams[k].length < teams[best].length)
          ) {
            best = k;
          }
        }
        if (best !== -1) {
          teams[best].push(m);
          cap[best]--;
        }
      }
    }
  } else {
    // 完全ランダム
    for (const m of shuffle(rest)) {
      let best = -1;
      for (let k = 0; k < teamCount; k++) {
        if (cap[k] > 0 && (best === -1 || cap[k] > cap[best])) best = k;
      }
      if (best !== -1) {
        teams[best].push(m);
        cap[best]--;
      }
    }
  }

  return teams;
}