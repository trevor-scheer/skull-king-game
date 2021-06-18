import { Config, Plugin, Refs } from "pretty-format";
import { Card, isColoredCard, isSpecialCard } from "../cards";

export default {
  test(value: any) {
    return (
      value &&
      typeof value === "object" &&
      !!(isColoredCard(value) || isSpecialCard(value))
    );
  },

  serialize(
    value: Card,
    config: Config,
    indentation: string,
    _depth: number,
    _refs: Refs,
    _printer: any
  ): string {
    if (isColoredCard(value)) {
      return `${value.color.toLocaleUpperCase()} ${value.number}`;
    } else {
      return `${value.type.toLocaleUpperCase()}`;
    }
  },
} as Plugin;
