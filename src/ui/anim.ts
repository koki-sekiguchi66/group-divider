import { type Variants } from 'motion/react';

// ----------------------------------------------------------------------------
// アニメーションのデザイントークン（プレゼンテーション専用・副作用なし）
// 各コンポーネントで共有し、演出のテンポ・質感を統一する。
// ----------------------------------------------------------------------------

// 班分け結果：班カードを 1 枚ずつ「配る」ように見せるためのコンテナ
export const resultContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// 各班カード（下からふわっと浮き上がり、わずかにスケール）
export const teamCard: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 280, damping: 24 },
  },
};

// カード内：名前チップを連続でポップさせるためのコンテナ
export const chipContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

// 名前チップ（弾むようにポップイン）
export const chip: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 520, damping: 26 },
  },
};

// 受付リスト：初回表示時に軽いスタッグでフェードイン
export const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
};
