import { definition as cardtype001Def } from "./cardtype001/definition";
import { layout as cardtype001Layout } from "./cardtype001/layout";
import { style as cardtype001Style } from "./cardtype001/style";
import { cardStyleDefault } from "./card_style_default";

export const cardtype001 = {
  definition: cardtype001Def,
  layout: cardtype001Layout,
  style: cardtype001Style,
};

export const cardTypes = [cardtype001] as const;
export const cardTypeIds = cardTypes.map((c) => c.definition.id);

export type CardTypeId = (typeof cardTypeIds)[number];

export { cardStyleDefault };
