import { describe, expect, it } from "vitest";
import { ALLE_2D, ALLE_3D, form2d, form3d } from "./definisjoner";

describe("formdefinisjoner", () => {
  it("gir kvadratet like sider og rette vinkler, og sirkelen ingen hjørner", () => {
    expect(form2d("kvadrat")).toMatchObject({ sider: 4, hjorner: 4, retteVinkler: 4, likeSider: true, rund: false });
    expect(form2d("rektangel").likeSider).toBe(false);
    expect(form2d("sirkel")).toMatchObject({ sider: 0, hjorner: 0, rund: true });
    expect(form2d("trekant").sider).toBe(3);
    expect(form2d("sekskant").hjorner).toBe(6);
    expect(ALLE_2D).toHaveLength(8);
  });

  it("bruker samme egenskaper til stempel og telling", () => {
    expect(form3d("kube")).toMatchObject({ kanter: 12, hjorner: 8, flater: 6, stempel: "kvadrat" });
    expect(form3d("sylinder").stempel).toBe("sirkel");
    expect(form3d("sylinder").sider).toContain("rektangel");
    expect(form3d("kjegle").stempel).toBe("sirkel");
    expect(form3d("pyramide").stempel).toBe("kvadrat");
    expect(form3d("prisme").stempel).toBe("trekant");
    expect(form3d("kule").flater).toBe(1);
    expect(ALLE_3D).toHaveLength(6);
    for (const id of ALLE_3D) {
      const form = form3d(id);
      expect(form.flater).toBeGreaterThan(0);
      expect(form2d(form.stempel).id).toBe(form.stempel);
    }
  });
});
