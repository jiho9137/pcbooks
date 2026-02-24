import { definition as booktype001Def } from "./booktype001/definition";
import { cover as booktype001Cover } from "./booktype001/cover";
import { spread as booktype001Spread } from "./booktype001/spread";
import { definition as booktype002Def } from "./booktype002/definition";
import { cover as booktype002Cover } from "./booktype002/cover";
import { spread as booktype002Spread } from "./booktype002/spread";
import { definition as booktype003Def } from "./booktype003/definition";
import { cover as booktype003Cover } from "./booktype003/cover";
import { spread as booktype003Spread } from "./booktype003/spread";

export const booktype001 = {
  definition: booktype001Def,
  cover: booktype001Cover,
  spread: booktype001Spread,
};

export const booktype002 = {
  definition: booktype002Def,
  cover: booktype002Cover,
  spread: booktype002Spread,
};

export const booktype003 = {
  definition: booktype003Def,
  cover: booktype003Cover,
  spread: booktype003Spread,
};

export const bookTypes = [booktype001, booktype002, booktype003] as const;
export const bookTypeIds = bookTypes.map((b) => b.definition.id);

export type BookTypeId = (typeof bookTypeIds)[number];
