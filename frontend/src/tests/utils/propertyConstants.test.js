import { describe, expect, it } from "vitest";
import {
  getNigerianStateLabel,
  getTransactionTypeForMatterNature,
} from "../../utils/propertyConstants";

describe("getTransactionTypeForMatterNature", () => {
  it.each([
    ["property acquisition", "purchase"],
    ["land acquisition", "land_acquisition"],
    ["property sale", "sale"],
    ["lease agreement", "lease"],
    ["sublease", "sublease"],
    ["tenancy matter", "tenancy_matter"],
    ["property management", "property_management"],
    ["property development", "property_development"],
    ["title perfection", "title_perfection"],
    ["mortgage", "mortgage"],
    ["real estate finance", "mortgage"],
    ["boundary dispute", "boundary_dispute"],
    ["partition", "partition"],
    ["right of way", "right_of_way"],
    ["easement", "easement"],
    ["foreclosure", "foreclosure"],
  ])("suggests %s as %s", (natureOfMatter, expected) => {
    expect(getTransactionTypeForMatterNature(natureOfMatter)).toBe(expected);
  });

  it("does not guess when no clear transaction mapping exists", () => {
    expect(getTransactionTypeForMatterNature("land use")).toBeUndefined();
    expect(getTransactionTypeForMatterNature("other")).toBeUndefined();
  });
});

describe("getNigerianStateLabel", () => {
  it.each([
    ["lagos", "Lagos"],
    ["Lagos", "Lagos"],
    ["fct", "Federal Capital Territory"],
    ["FCT", "Federal Capital Territory"],
  ])("normalizes %s to %s", (state, expected) => {
    expect(getNigerianStateLabel(state)).toBe(expected);
  });
});
