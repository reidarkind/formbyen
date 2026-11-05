import { describe, expect, it } from "vitest";
import type { Form2dId } from "../former/definisjoner";
import { omrissForForm } from "./omriss";
import { vurderTegning } from "./vurder";

describe("tegning av former", () => {
  it("godtar omrisset og avviser en prikk i hjørnet", () => {
    const former: Form2dId[] = ["sirkel", "trekant", "kvadrat", "rektangel", "femkant", "sekskant"];
    for (const form of former) {
      const omriss = omrissForForm(form);
      expect(omriss.maske.some(Boolean)).toBe(true);
      expect(vurderTegning(omriss, omriss)).toBe(true);
      const prikk = { ...omriss, maske: omriss.maske.map(() => false) };
      prikk.maske[0] = true;
      expect(vurderTegning(prikk, omriss)).toBe(false);
    }
  });
});
