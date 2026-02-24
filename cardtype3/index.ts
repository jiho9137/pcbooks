import { definition as cardtype003Def } from "./cardtype003/definition";
import { layout as cardtype003Layout } from "./cardtype003/layout";
import { style as cardtype003Style } from "./cardtype003/style";

export const cardtype003 = {
  definition: cardtype003Def,
  layout: cardtype003Layout,
  style: cardtype003Style,
};

export const cardTypes3 = [cardtype003] as const;
export const cardTypeIds3 = cardTypes3.map((c) => c.definition.id);
