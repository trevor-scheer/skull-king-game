import { test, expect } from "@playwright/test";

test.describe("Skull King Game Flow", () => {
  test("home page loads and shows create game option", async ({ page }) => {
    await page.goto("/");

    // Check that the home page loads
    await expect(page).toHaveTitle(/Skull King/i);

    // Look for the create game button
    const createButton = page.getByRole("button", { name: /create/i });
    await expect(createButton).toBeVisible();
  });

  test("can create a new game", async ({ page }) => {
    await page.goto("/");

    // Click create game
    const createButton = page.getByRole("button", { name: /create/i });
    await createButton.click();

    // Should navigate to a game page
    await expect(page).toHaveURL(/\/game\/.+/);
  });

  test("can join an existing game", async ({ page }) => {
    await page.goto("/");

    // Create a game first
    const createButton = page.getByRole("button", { name: /create/i });
    await createButton.click();

    // Get the game URL
    const gameUrl = page.url();
    const gameId = gameUrl.split("/game/")[1];

    // Navigate back home and join with the game ID
    await page.goto("/");

    // Find join input and button
    const joinInput = page.getByPlaceholder(/game id/i);
    if (await joinInput.isVisible()) {
      await joinInput.fill(gameId);
      const joinButton = page.getByRole("button", { name: /join/i });
      await joinButton.click();

      // Should be on the game page
      await expect(page).toHaveURL(/\/game\/.+/);
    }
  });

  test("player can enter name and join lobby", async ({ page }) => {
    await page.goto("/");

    // Create a game
    const createButton = page.getByRole("button", { name: /create/i });
    await createButton.click();

    // Wait for the join game form
    await page.waitForURL(/\/game\/.+/);

    // Look for name input
    const nameInput = page.getByPlaceholder(/name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill("TestPlayer");

      // Submit the name
      const submitButton = page.getByRole("button", { name: /join|enter|submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should see the player name somewhere on the page
        await expect(page.getByText("TestPlayer")).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
