import { expect, test } from "@playwright/test";
test("both source fixtures render identical nonempty WebGL pixels", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4173");
  await expect(page.locator("#stage")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#status")).toContainText(
    "SP38_3875_KNOWN_VERSION_RISK",
  );
  await page.locator("#debug").uncheck();
  const pixels = () =>
    page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const copy = document.createElement("canvas");
      copy.width = canvas.width;
      copy.height = canvas.height;
      const ctx = copy.getContext("2d")!;
      ctx.drawImage(canvas, 0, 0);
      return Array.from(ctx.getImageData(360, 180, 1, 1).data);
    });
  expect(await pixels()).toEqual([244, 163, 64, 255]);
  const spine = await page.locator("canvas").screenshot();
  await page.locator("#source").selectOption("dragonbones");
  await expect(page.locator("#status")).toContainText("DragonBones 5.5");
  expect(await pixels()).toEqual([244, 163, 64, 255]);
  expect(await page.locator("canvas").screenshot()).toEqual(spine);
  await page.locator("#debug").check();
  expect(await page.locator("canvas").screenshot()).not.toEqual(spine);
  await page.screenshot({
    path: "test-results/compatibility-lab.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
