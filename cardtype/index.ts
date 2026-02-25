import { definition as cardtype001Def } from "./defaultcard/definition";
import { layout as cardtype001Layout } from "./defaultcard/layout";
import { style as cardtype001Style } from "./defaultcard/style";
import { definition as cardtype002Def } from "./image/definition";
import { layout as cardtype002Layout } from "./image/layout";
import { style as cardtype002Style } from "./image/style";
import { definition as cardtype003Def } from "./instagramstyle/definition";
import { layout as cardtype003Layout } from "./instagramstyle/layout";
import { style as cardtype003Style } from "./instagramstyle/style";
import { cardStyleDefault } from "./card_style_default";

export const cardtype001 = {
  definition: cardtype001Def,
  layout: cardtype001Layout,
  style: cardtype001Style,
};

export const cardtype002 = {
  definition: cardtype002Def,
  layout: cardtype002Layout,
  style: cardtype002Style,
};

export const cardtype003 = {
  definition: cardtype003Def,
  layout: cardtype003Layout,
  style: cardtype003Style,
};

export const cardTypes = [cardtype001, cardtype002, cardtype003] as const;
export const cardTypeIds = cardTypes.map((c) => c.definition.id);

export type CardTypeId = (typeof cardTypeIds)[number];

export { cardStyleDefault };
