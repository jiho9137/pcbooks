import { definition as booktype001Def } from "./booktype001/definition";
import { cover as booktype001Cover } from "./booktype001/cover";
import { spread as booktype001Spread } from "./booktype001/spread";

export const booktype001 = {
  definition: booktype001Def,
  cover: booktype001Cover,
  spread: booktype001Spread,
};

export const bookTypes = [booktype001] as const;
export const bookTypeIds = bookTypes.map((b) => b.definition.id);

export type BookTypeId = (typeof bookTypeIds)[number];
