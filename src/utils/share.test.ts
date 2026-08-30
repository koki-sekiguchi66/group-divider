import { describe, it, expect, beforeEach } from 'vitest';
import LZString from 'lz-string';
import { encodeMembersToUrl, decodeMembersFromUrl } from './share';
import { type Member } from '../types';

// --- helpers ---

function resetUrl(): void {
  window.history.pushState({}, '', 'http://localhost/');
}

function applyUrl(url: string): void {
  const { search } = new URL(url);
  window.history.pushState({}, '', search || '/');
}

const BASE: Member[] = [
  { id: 'a', name: '田中太郎', gender: 'male',   core: true,  checkedIn: true  },
  { id: 'b', name: '山田花子', gender: 'female', core: false, checkedIn: false },
  { id: 'c', name: '佐藤次郎', gender: 'other',  core: false, checkedIn: true  },
];

// --- tests ---

describe('encodeMembersToUrl', () => {
  beforeEach(resetUrl);

  it('?data= クエリパラメータを含む URL を返す', () => {
    const url = encodeMembersToUrl(BASE);
    expect(url).toMatch(/\?data=/);
  });

  it('メンバーが空でも URL を返す', () => {
    const url = encodeMembersToUrl([]);
    expect(typeof url).toBe('string');
    expect(url).toMatch(/\?data=/);
  });

  it('異なるメンバーリストは異なる URL になる', () => {
    const url1 = encodeMembersToUrl([BASE[0]]);
    const url2 = encodeMembersToUrl([BASE[1]]);
    expect(url1).not.toBe(url2);
  });
});

describe('decodeMembersFromUrl', () => {
  beforeEach(resetUrl);

  it('data パラメータがない場合は null を返す', () => {
    expect(decodeMembersFromUrl()).toBeNull();
  });

  it('不正なデータの場合は null を返す', () => {
    window.history.pushState({}, '', '?data=!!invalid!!');
    expect(decodeMembersFromUrl()).toBeNull();
  });

  it('空文字の data パラメータは null を返す', () => {
    window.history.pushState({}, '', '?data=');
    expect(decodeMembersFromUrl()).toBeNull();
  });
});

describe('encode → decode ラウンドトリップ', () => {
  beforeEach(resetUrl);

  it('名前・性別・core フラグが復元される', () => {
    const url = encodeMembersToUrl(BASE);
    applyUrl(url);

    const decoded = decodeMembersFromUrl();
    expect(decoded).not.toBeNull();
    expect(decoded!).toHaveLength(BASE.length);

    decoded!.forEach((m, i) => {
      expect(m.name).toBe(BASE[i].name);
      expect(m.gender).toBe(BASE[i].gender);
      expect(m.core).toBe(BASE[i].core);
    });
  });

  it('復元後の checkedIn は常に false', () => {
    const url = encodeMembersToUrl(BASE);
    applyUrl(url);

    const decoded = decodeMembersFromUrl()!;
    decoded.forEach((m) => expect(m.checkedIn).toBe(false));
  });

  it('復元後の id は空でなく新規発行される', () => {
    const url = encodeMembersToUrl(BASE);
    applyUrl(url);

    const decoded = decodeMembersFromUrl()!;
    const ids = decoded.map((m) => m.id);
    ids.forEach((id) => expect(id.length).toBeGreaterThan(0));
    // 元の id ('a','b','c') とは異なる（新規発行）
    expect(ids).not.toEqual(BASE.map((m) => m.id));
  });

  it('日本語の名前が文字化けしない', () => {
    const japanese: Member[] = [
      { id: '1', name: '鈴木一郎',     gender: 'male',   core: false, checkedIn: false },
      { id: '2', name: '高橋さくら',   gender: 'female', core: true,  checkedIn: false },
      { id: '3', name: '渡辺　勇気',   gender: 'other',  core: false, checkedIn: false },
    ];
    const url = encodeMembersToUrl(japanese);
    applyUrl(url);

    const decoded = decodeMembersFromUrl()!;
    decoded.forEach((m, i) => expect(m.name).toBe(japanese[i].name));
  });

  it('空リストをエンコードしてデコードすると空配列', () => {
    const url = encodeMembersToUrl([]);
    applyUrl(url);

    const decoded = decodeMembersFromUrl();
    expect(decoded).not.toBeNull();
    expect(decoded!).toHaveLength(0);
  });

  it('タグが復元される', () => {
    const withTags: Member[] = [
      { id: '1', name: '田中', gender: 'male', core: false, checkedIn: false, tags: ['肉奉行', 'ドライバー'] },
      { id: '2', name: '鈴木', gender: 'female', core: true, checkedIn: false, tags: [] },
      { id: '3', name: '佐藤', gender: 'other', core: false, checkedIn: false },
    ];
    const url = encodeMembersToUrl(withTags);
    applyUrl(url);

    const decoded = decodeMembersFromUrl()!;
    expect(decoded[0].tags).toEqual(['肉奉行', 'ドライバー']);
    expect(decoded[1].tags).toEqual([]);
    expect(decoded[2].tags).toEqual([]);
  });

  it('タグを持たない旧形式のデータも読み込める', () => {
    // タグ導入前の [名前, 性別番号, 幹部フラグ] 形式
    const legacy = LZString.compressToEncodedURIComponent(JSON.stringify([['田中', 0, 1]]));
    window.history.pushState({}, '', `?data=${legacy}`);

    const decoded = decodeMembersFromUrl()!;
    expect(decoded).toHaveLength(1);
    expect(decoded[0].name).toBe('田中');
    expect(decoded[0].gender).toBe('male');
    expect(decoded[0].core).toBe(true);
    expect(decoded[0].tags).toEqual([]);
  });

  it('大人数（30人）でもラウンドトリップが成立する', () => {
    const large: Member[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      name: `メンバー${i + 1}`,
      gender: (['male', 'female', 'other'] as const)[i % 3],
      core: i % 5 === 0,
      checkedIn: false,
    }));
    const url = encodeMembersToUrl(large);
    applyUrl(url);

    const decoded = decodeMembersFromUrl()!;
    expect(decoded).toHaveLength(30);
    decoded.forEach((m, i) => {
      expect(m.name).toBe(large[i].name);
      expect(m.gender).toBe(large[i].gender);
      expect(m.core).toBe(large[i].core);
    });
  });
});
