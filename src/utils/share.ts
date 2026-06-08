import LZString from 'lz-string';
import { type Member, type Gender } from '../types';

// 性別と数値を相互変換するためのマッピング定義
const GENDER_MAP: Record<Gender, number> = { male: 0, female: 1, other: 2 };
const REVERSE_GENDER_MAP: Record<number, Gender> = { 0: 'male', 1: 'female', 2: 'other' };

export function encodeMembersToUrl(members: Member[]): string {
  // ① IDや出欠情報を捨て[名前, 性別番号, 幹部フラグ(0|1)] に変換
  const minimalData = members.map(m => [
    m.name,
    GENDER_MAP[m.gender],
    m.core ? 1 : 0
  ]);
  
  const jsonStr = JSON.stringify(minimalData);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  
  const url = new URL(window.location.href);
  url.searchParams.set('data', compressed);
  return url.toString();
}

export function decodeMembersFromUrl(): Member[] | null {
  const urlParams = new URLSearchParams(window.location.search);
  const compressed = urlParams.get('data');
  if (!compressed) return null;
  
  try {
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;
    const parsed: unknown = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      // ② 最小データ [名前, 性別番号, 幹部フラグ] から Member オブジェクトへ再構築
      const rows = parsed as [string, number, number][];
      return rows.map((row) => ({
        id: Math.random().toString(36).slice(2, 10), // IDは復元時に新規発行
        name: row[0],
        gender: REVERSE_GENDER_MAP[row[1]] || 'male',
        core: row[2] === 1,
        checkedIn: false
      }));
    }
  } catch (e) {
    console.error("URLデータのパースに失敗しました", e);
  }
  return null;
}