export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  core: boolean;
  checkedIn: boolean;
  /** 「肉奉行」など自由に付けられるタグ。既存データとの互換のため任意項目 */
  tags?: string[];
}

// 常に同じ班にしたいメンバーの固定グループ
export interface FixedGroup {
  id: string;
  memberIds: string[];
}

export interface DivOptions {
  useCore: boolean;
  balG: boolean;
  fixedGroups?: string[][];
  /** 各班にできるだけ散らばらせたいタグ */
  spreadTags?: string[];
}

export interface DivResult {
  teams: Member[][];
  useCore: boolean;
  balG: boolean;
}