export type Gender = 'male' | 'female' | 'other';

export interface Member {
  id: string;
  name: string;
  gender: Gender;
  core: boolean;
  checkedIn: boolean;
}

export interface DivOptions {
  useCore: boolean;
  balG: boolean;
}

export interface DivResult {
  teams: Member[][];
  useCore: boolean;
  balG: boolean;
}