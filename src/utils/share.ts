// @ts-ignore - 型定義がない場合のコンパイルエラーを防ぐ
import LZString from 'lz-string';
import { type Member } from '../types';

export function encodeMembersToUrl(members: Member[]): string {
  const jsonStr = JSON.stringify(members);
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
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error("URLデータのパースに失敗しました", e);
  }
  return null;
}