import { definition as cardtype002Def } from "./cardtype002/definition";
import { layout as cardtype002Layout } from "./cardtype002/layout";
import { style as cardtype002Style } from "./cardtype002/style";

export const cardtype002 = {
  definition: cardtype002Def,
  layout: cardtype002Layout,
  style: cardtype002Style,
};

export const cardTypes2 = [cardtype002] as const;
export const cardTypeIds2 = cardTypes2.map((c) => c.definition.id);
