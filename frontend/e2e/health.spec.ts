import { expect, test } from "@playwright/test";

test("displays the backend health status", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Workspace Health" }),
  ).toBeVisible();
  await expect(page.getByText("正常稼働中")).toBeVisible();
});
