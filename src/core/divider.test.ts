import { describe, it, expect } from 'vitest';
import { divide } from './divider';
import { type Member, type DivOptions, type Gender } from '../types';

// --- helpers ---

function member(id: string, gender: Gender = 'male', core = false): Member {
  return { id, name: `m-${id}`, gender, core, checkedIn: true };
}

function members(count: number, gender: Gender = 'male'): Member[] {
  return Array.from({ length: count }, (_, i) => member(String(i), gender));
}

/** 全メンバーがちょうど1チームに存在することを検証 */
function assertAllPlacedOnce(source: Member[], teams: Member[][]): void {
  const ids = teams.flat().map((m) => m.id);
  expect(ids).toHaveLength(source.length);
  expect(new Set(ids).size).toBe(source.length);
}

/** チームサイズの最大差が 1 以下であることを検証 */
function assertBalancedSizes(teams: Member[][]): void {
  const sizes = teams.map((t) => t.length);
  expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
}

const noOpts: DivOptions = { useCore: false, balG: false };

// --- tests ---

describe('divide / 基本的な不変条件', () => {
  it('チーム数が teamCount と一致する', () => {
    const teams = divide(members(10), 3, noOpts);
    expect(teams).toHaveLength(3);
  });

  it('全メンバーがちょうど1チームに配置される', () => {
    const src = members(15);
    assertAllPlacedOnce(src, divide(src, 3, noOpts));
  });

  it('チームサイズの差は最大 1', () => {
    assertBalancedSizes(divide(members(10), 3, noOpts));
  });

  it('15人 / 3班 → 5-5-5', () => {
    const teams = divide(members(15), 3, noOpts);
    expect(teams.map((t) => t.length)).toEqual([5, 5, 5]);
  });

  it('10人 / 3班 → 合計 10 かつサイズ差 ≤ 1', () => {
    const teams = divide(members(10), 3, noOpts);
    const total = teams.flat().length;
    expect(total).toBe(10);
    assertBalancedSizes(teams);
  });

  it('0人 → 全チームが空', () => {
    const teams = divide([], 3, noOpts);
    expect(teams).toHaveLength(3);
    teams.forEach((t) => expect(t).toHaveLength(0));
  });

  it('1班 → 全員が同じチームに入る', () => {
    const src = members(7);
    const teams = divide(src, 1, noOpts);
    expect(teams).toHaveLength(1);
    assertAllPlacedOnce(src, teams);
  });

  it('人数 === 班数 → 各班に 1 人', () => {
    const src = members(4);
    const teams = divide(src, 4, noOpts);
    teams.forEach((t) => expect(t).toHaveLength(1));
  });
});

describe('divide / useCore（幹部分散）', () => {
  it('幹部数 === 班数 → 各班にちょうど 1 人の幹部', () => {
    const src = [
      member('c1', 'male', true),
      member('c2', 'female', true),
      member('c3', 'male', true),
      ...members(12).map((m, i) => ({ ...m, id: `r${i}` })),
    ];
    const teams = divide(src, 3, { useCore: true, balG: false });
    teams.forEach((t) => {
      expect(t.filter((m) => m.core)).toHaveLength(1);
    });
  });

  it('幹部数 < 班数 → 幹部のいないチームが出ても不変条件は満たす', () => {
    const src = [
      member('c1', 'male', true),
      ...members(8).map((m, i) => ({ ...m, id: `r${i}` })),
    ];
    const teams = divide(src, 3, { useCore: true, balG: false });
    const totalCore = teams.flat().filter((m) => m.core).length;
    expect(totalCore).toBe(1);
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
  });

  it('幹部数が班数の倍数 → 各班に均等配置', () => {
    const src = [
      member('c1', 'male', true),
      member('c2', 'female', true),
      member('c3', 'male', true),
      member('c4', 'female', true),
      member('c5', 'male', true),
      member('c6', 'female', true),
      ...members(9).map((m, i) => ({ ...m, id: `r${i}` })),
    ];
    const teams = divide(src, 3, { useCore: true, balG: false });
    teams.forEach((t) => {
      expect(t.filter((m) => m.core)).toHaveLength(2);
    });
  });

  it('useCore でも全員配置・サイズ差 ≤ 1 が成立', () => {
    const src = [
      member('c1', 'female', true),
      member('c2', 'male', true),
      ...members(13).map((m, i) => ({ ...m, id: `r${i}` })),
    ];
    const teams = divide(src, 3, { useCore: true, balG: false });
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
  });
});

describe('divide / balG（男女均等）', () => {
  it('男 6 + 女 6 + 3班 → 各班 2M 2F', () => {
    const src = [
      ...Array.from({ length: 6 }, (_, i) => member(`m${i}`, 'male')),
      ...Array.from({ length: 6 }, (_, i) => member(`f${i}`, 'female')),
    ];
    const teams = divide(src, 3, { useCore: false, balG: true });
    teams.forEach((t) => {
      expect(t.filter((m) => m.gender === 'male')).toHaveLength(2);
      expect(t.filter((m) => m.gender === 'female')).toHaveLength(2);
    });
  });

  it('割り切れない場合でもチームごとの性別差が ≤ 1', () => {
    // 男 7 + 女 5 = 12人, 3班
    const src = [
      ...Array.from({ length: 7 }, (_, i) => member(`m${i}`, 'male')),
      ...Array.from({ length: 5 }, (_, i) => member(`f${i}`, 'female')),
    ];
    const teams = divide(src, 3, { useCore: false, balG: true });
    const maleCounts = teams.map((t) => t.filter((m) => m.gender === 'male').length);
    const femaleCounts = teams.map((t) => t.filter((m) => m.gender === 'female').length);
    expect(Math.max(...maleCounts) - Math.min(...maleCounts)).toBeLessThanOrEqual(1);
    expect(Math.max(...femaleCounts) - Math.min(...femaleCounts)).toBeLessThanOrEqual(1);
  });

  it('全員同じ性別でも不変条件を満たす', () => {
    const src = Array.from({ length: 9 }, (_, i) => member(`m${i}`, 'male'));
    const teams = divide(src, 3, { useCore: false, balG: true });
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
  });

  it('balG でも全員配置・サイズ差 ≤ 1 が成立', () => {
    const src = [
      ...Array.from({ length: 9 }, (_, i) => member(`m${i}`, 'male')),
      ...Array.from({ length: 6 }, (_, i) => member(`f${i}`, 'female')),
    ];
    const teams = divide(src, 3, { useCore: false, balG: true });
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
  });
});

describe('divide / fixedGroups（メンバー固定）', () => {
  it('固定グループのメンバーは必ず同じ班に入る', () => {
    const src = members(12);
    const teams = divide(src, 3, { useCore: false, balG: false, fixedGroups: [['0', '1', '2']] });
    const team = teams.find((t) => t.some((m) => m.id === '0'));
    expect(team).toBeDefined();
    expect(team!.some((m) => m.id === '1')).toBe(true);
    expect(team!.some((m) => m.id === '2')).toBe(true);
  });

  it('複数の固定グループがそれぞれ同じ班にまとまる', () => {
    const src = members(12);
    const teams = divide(src, 3, {
      useCore: false,
      balG: false,
      fixedGroups: [['0', '1'], ['2', '3', '4']],
    });
    const findTeam = (id: string) => teams.find((t) => t.some((m) => m.id === id))!;
    expect(findTeam('0')).toBe(findTeam('1'));
    expect(findTeam('2')).toBe(findTeam('3'));
    expect(findTeam('3')).toBe(findTeam('4'));
  });

  it('固定グループがあっても全員が1度ずつ配置される', () => {
    const src = members(13);
    const teams = divide(src, 3, { useCore: false, balG: false, fixedGroups: [['0', '1', '2', '3']] });
    assertAllPlacedOnce(src, teams);
  });

  it('固定グループ内の幹部・性別も分散カウントに反映される', () => {
    const src = [
      member('c1', 'male', true),
      member('c2', 'female', true),
      ...members(10).map((m, i) => ({ ...m, id: `r${i}` })),
    ];
    // c1, c2 を固定グループにすると、幹部分散の対象からは外れて同じ班に固まる
    const teams = divide(src, 3, { useCore: true, balG: false, fixedGroups: [['c1', 'c2']] });
    const team = teams.find((t) => t.some((m) => m.id === 'c1'))!;
    expect(team.some((m) => m.id === 'c2')).toBe(true);
    assertAllPlacedOnce(src, teams);
  });

  it('存在しないIDや空配列を含む固定グループは無視される', () => {
    const src = members(9);
    const teams = divide(src, 3, {
      useCore: false,
      balG: false,
      fixedGroups: [['nope'], [], ['0', '1']],
    });
    assertAllPlacedOnce(src, teams);
    const findTeam = (id: string) => teams.find((t) => t.some((m) => m.id === id))!;
    expect(findTeam('0')).toBe(findTeam('1'));
  });

  it('fixedGroups 未指定でも従来どおり動作する', () => {
    const src = members(9);
    const teams = divide(src, 3, { useCore: false, balG: false });
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
  });
});

describe('divide / useCore + balG の組み合わせ', () => {
  it('両方オンでも不変条件がすべて成立', () => {
    const src = [
      member('c1', 'male', true),
      member('c2', 'female', true),
      member('c3', 'male', true),
      ...Array.from({ length: 6 }, (_, i) => member(`m${i}`, 'male')),
      ...Array.from({ length: 6 }, (_, i) => member(`f${i}`, 'female')),
    ];
    const teams = divide(src, 3, { useCore: true, balG: true });
    assertAllPlacedOnce(src, teams);
    assertBalancedSizes(teams);
    // 幹部は各班1人
    teams.forEach((t) => {
      expect(t.filter((m) => m.core)).toHaveLength(1);
    });
  });
});
