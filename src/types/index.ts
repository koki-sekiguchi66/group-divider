export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  core: boolean;
  checkedIn: boolean;
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
}

export interface DivResult {
  teams: Member[][];
  useCore: boolean;
  balG: boolean;
}