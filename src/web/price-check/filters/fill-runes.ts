import { ItemCategory, ItemRarity, ParsedItem } from "@/parser";
import { StatFilter } from "./interfaces";
import { applyEleRune, recalculateItemProperties } from "@/parser/calc-base";
import { BaseType, ITEM_BY_REF, RUNE_DATA_BY_RUNE } from "@/assets/data";
import { parseModifiersPoe2, replaceHashWithValues } from "@/parser/Parser";
import { ModifierType, sumStatsByModType } from "@/parser/modifiers";
import {
  calculatedStatToFilter,
  FiltersCreationContext,
  finalFilterTweaks,
} from "./create-stat-filters";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { filterItemProp } from "./pseudo/item-property";
import { ADDED_RUNE_LINE } from "@/parser/advanced-mod-desc";
import { filterPseudo } from "./pseudo";
import { ItemEditorType } from "@/parser/meta";

export function handleApplyItemEdits(
  filters: StatFilter[],
  item: ParsedItem,
  filterStorage: StatFilter[],
  currencyItem: string,
  editType?: ItemEditorType,
) {
  if (filterStorage.length !== 0) return;
  // Testing with just one stat
  const newFilters = createNewStatFilter(item, currencyItem);
  if (!newFilters) return;

  for (const filter of newFilters) {
    // get on/off state of old filter
    const oldFilter = filters.find(
      (stat) => stat.statRef === filter.statRef && stat.tag === filter.tag,
    );
    if (oldFilter) {
      filter.disabled = oldFilter.disabled;
    }
  }
  // Store a copy of the current filters, then replace contents
  filterStorage.splice(
    0,
    filterStorage.length,
    ...JSON.parse(JSON.stringify(filters)),
  );

  // Clear and add new filters into the `filters` array
  filters.splice(0, filters.length, ...newFilters);
}

export function handleRemoveItemEdits(
  filters: StatFilter[],
  item: ParsedItem,
  filterStorage: StatFilter[],
) {
  // reset back to normal
  for (const filterToApply of filterStorage) {
    // get on/off state of old filter
    const oldFilter = filters.find(
      (stat) =>
        stat.statRef === filterToApply.statRef &&
        stat.tag === filterToApply.tag,
    );
    if (oldFilter) {
      filterToApply.disabled = oldFilter.disabled;
    }
  }

  filters.splice(0, filters.length, ...filterStorage);
  filterStorage.length = 0;
}

function createNewStatFilter(
  item: ParsedItem,
  newRune: string,
): StatFilter[] | undefined {
  if (!item.category) return;
  const newItem = JSON.parse(JSON.stringify(item)) as ParsedItem;
  const runeData = RUNE_DATA_BY_RUNE[newRune].find((rune) =>
    rune.categories.includes(item.category!),
  );
  if (!runeData) return;
  const runeItem = ITEM_BY_REF("ITEM", runeData.refName)![0];

  const emptyRuneCount = item.runeSockets!.empty;
  const statString = replaceHashWithValues(
    runeData.baseStat + ADDED_RUNE_LINE,
    runeData.values.map((v) => v * emptyRuneCount),
  );
  parseModifiersPoe2([statString], newItem);
  newItem.statsByType = sumStatsByModType(newItem.newMods);
  const range = AppConfig<PriceCheckWidget>("price-check")!.searchStatRange;
  const ctx: FiltersCreationContext = {
    item: newItem,
    filters: [],
    searchInRange: newItem.rarity === ItemRarity.Normal ? 100 : range,
    statsByType: newItem.statsByType.map((calc) => {
      if (
        calc.type === ModifierType.Fractured &&
        calc.stat.trade.ids[ModifierType.Explicit]
      ) {
        return { ...calc, type: ModifierType.Explicit };
      } else {
        return calc;
      }
    }),
  };

  if (
    runeItem.refName.includes("Glacial Rune") ||
    runeItem.refName.includes("Storm Rune") ||
    runeItem.refName.includes("Desert Rune")
  ) {
    applyEleRune(newItem, runeItem.refName, runeData.values);
  }

  recalculateItemProperties(newItem, item);
  filterItemProp(ctx);
  filterPseudo(ctx);
  if (item.isVeiled) {
    ctx.statsByType = ctx.statsByType.filter(
      (mod) => mod.type !== ModifierType.Veiled,
    );
  }

  ctx.filters.push(
    ...ctx.statsByType.map((mod) =>
      calculatedStatToFilter(
        mod,
        ctx.searchInRange,
        newItem,
        mod.type !== "added-rune",
      ),
    ),
  );
  if (item.isVeiled) {
    ctx.filters.forEach((filter) => {
      filter.disabled = true;
    });
  }

  finalFilterTweaks(ctx);

  ctx.filters = ctx.filters.map((filter) => {
    if (
      filter.sources.some(
        (source) => source.modifier.info.type === ModifierType.AddedRune,
      )
    ) {
      filter.editorAdded = runeItem;
    }
    return filter;
  });
  return ctx.filters;
}

export function selectRuneEffectByItemCategory(
  category: ItemCategory,
  rune: BaseType["rune"],
) {
  if (!rune) return;

  return rune.find((rune) => rune.categories.includes(category));
}

export function getRuneNameByRef(ref: string) {
  const rune = ITEM_BY_REF("ITEM", ref);
  if (!rune) return "error";
  return rune[0].name;
}
