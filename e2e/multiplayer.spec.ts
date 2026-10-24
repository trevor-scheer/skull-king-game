import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let server: ChildProcess;
let baseURL: string;
let directory: string;
const qaDirectory =
  process.env.SKULL_KING_QA_DIRECTORY ?? "/tmp/skull-king-table-qa";

async function startServer(port = 0) {
  server = spawn(process.execPath, ["e2e/server.cjs"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATA_DIR: directory,
      PORT: String(port),
      ALLOWED_ORIGINS: baseURL ?? "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise<string>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(
      () => reject(new Error(`Server did not start: ${output}`)),
      15_000,
    );
    server.stderr!.on("data", (chunk) => {
      output += chunk;
    });
    server.stdout!.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/E2E_URL=(http:\/\/127\.0\.0\.1:\d+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited ${code}: ${output}`));
    });
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  const timeout = setTimeout(() => server.kill("SIGKILL"), 10_000);
  try {
    await exited;
  } finally {
    clearTimeout(timeout);
  }
}

test.beforeAll(async () => {
  mkdirSync(qaDirectory, { recursive: true });
  directory = mkdtempSync(join(tmpdir(), "skull-king-browser-"));
  baseURL = await startServer();
});

test.afterAll(async () => {
  await stopServer();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test("three friends finish a match after a disconnect and server restart", async ({
  browser,
  request,
}) => {
  const response = await request.post(`${baseURL}/graphql`, {
    data: {
      query: `mutation { newGame(roundSchedule:[1],tieBreakers:false) }`,
    },
  });
  expect(response.ok()).toBe(true);
  const created = await response.json();
  expect(created.errors).toBeUndefined();
  const gameId = created.data.newGame;
  const contexts = await Promise.all(
    Array.from({ length: 3 }, () => browser.newContext()),
  );
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  const names = ["Captain Ada", "Captain Grace", "Captain Linus"];
  try {
    const lobby = await pages[0].goto(`${baseURL}/game/${gameId}`);
    expect(lobby?.status()).toBe(200);
    await pages[0].getByLabel(/Enter yer name/).fill(names[0]);
    await pages[0].getByRole("button", { name: "Board the Ship" }).click();
    await expect(pages[0].locator(".Lobby-playerList")).toContainText(names[0]);
    const invite = await pages[0]
      .getByRole("textbox", { name: "Invite link" })
      .inputValue();
    expect(invite).toBe(`${baseURL}/game/${gameId}`);
    for (let index = 1; index < pages.length; index++) {
      await pages[index].goto(invite);
      await pages[index].getByLabel(/Enter yer name/).fill(names[index]);
      await pages[index]
        .getByRole("button", { name: "Board the Ship" })
        .click();
      await expect(pages[index].locator(".Lobby-playerList")).toContainText(
        names[index],
      );
    }
    await expect(pages[0].locator(".Lobby-playerList li")).toHaveCount(3);
    await expect(
      pages[1].getByRole("button", { name: "Set Sail!" }),
    ).toHaveCount(0);
    await pages[0].getByRole("button", { name: "Set Sail!" }).click();
    for (const page of pages) {
      await expect(
        page.getByRole("heading", { name: "Place Your Bid" }),
      ).toBeVisible();
      await expect(page.locator(".Hand-playerHand > li")).toHaveCount(1);
    }

    // Keep one browser's room identity across an actual offline interval and
    // restart the server against the same private checkpoint directory.
    await contexts[1].setOffline(true);
    const port = Number(new URL(baseURL).port);
    await stopServer();
    expect(await startServer(port)).toBe(baseURL);
    await contexts[1].setOffline(false);
    await pages[1].reload();
    await expect(
      pages[1].getByRole("heading", { name: "Place Your Bid" }),
    ).toBeVisible();
    await expect(
      pages[1].getByRole("button", { name: "Board the Ship" }),
    ).toHaveCount(0);

    for (const page of pages)
      await page.getByRole("button", { name: "0", exact: true }).click();
    for (let turn = 0; turn < 3; turn++) {
      let active = -1;
      await expect
        .poll(async () => {
          const enabled = await Promise.all(
            pages.map((page) =>
              page.locator(".Hand-playerHand button:enabled").count(),
            ),
          );
          active = enabled.findIndex((count) => count > 0);
          return active;
        })
        .toBeGreaterThanOrEqual(0);
      await pages[active]
        .locator(".Hand-playerHand button:enabled")
        .first()
        .click();
      await expect(
        pages[active].locator(".Hand-playerHand button"),
      ).toHaveCount(0);
    }
    for (const page of pages) {
      await expect(
        page.getByRole("heading", { name: "Game Over!" }),
      ).toBeVisible();
      for (const name of names)
        await expect(page.locator(".Scorecard")).toContainText(name);
    }
    await pages[2].reload();
    await expect(
      pages[2].getByRole("heading", { name: "Game Over!" }),
    ).toBeVisible();
    await pages[0]
      .getByRole("button", { name: "Rematch with this crew" })
      .click();
    await expect(pages[0].locator(".Lobby-playerList li")).toHaveCount(3);
    await pages[1].getByRole("button", { name: "Join the rematch" }).click();
    await expect(pages[1].locator(".Lobby-playerList li")).toHaveCount(3);
    expect(pages[1].url()).toBe(pages[0].url());
    await expect(
      pages[1].getByRole("button", { name: "Board the Ship" }),
    ).toHaveCount(0);
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
  }
});

test("an account resumes on another device and records practice without ranking it", async ({
  browser,
  request,
}) => {
  const first = await browser.newContext();
  const second = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const username = `crew_${Date.now()}`;
  const password = "A long test passphrase 42";
  try {
    const page = await first.newPage();
    await page.goto(`${baseURL}/account`);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await page.getByLabel("Username", { exact: true }).fill(username);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .locator("form")
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: `Welcome, ${username}` }),
    ).toBeVisible();
    await expect(page.locator(".RecoveryCode code")).not.toBeEmpty();
    const created = await (
      await request.post(`${baseURL}/graphql`, {
        data: {
          query: "mutation { newGame(roundSchedule:[1],tieBreakers:false) }",
        },
      })
    ).json();
    const gameId = created.data.newGame;
    await page.goto(`${baseURL}/game/${gameId}`);
    await page.getByLabel(/Enter yer name/).fill("Practice Captain");
    await page.getByRole("button", { name: "Board the Ship" }).click();
    await expect(page.locator(".AccountResume")).toContainText(
      `Seat saved to ${username}`,
    );
    await page.getByRole("button", { name: "Add practice pirate" }).click();
    await expect(page.locator(".Lobby-playerList li")).toHaveCount(2);
    await page.getByRole("button", { name: "Set Sail!" }).click();
    await expect(
      page.getByRole("heading", { name: "Place Your Bid" }),
    ).toBeVisible();
    await first.close();

    const mobile = await second.newPage();
    await mobile.goto(`${baseURL}/account`);
    await mobile.getByLabel("Username", { exact: true }).fill(username);
    await mobile.getByLabel("Password", { exact: true }).fill(password);
    await mobile
      .locator("form")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Resume game", exact: true })
      .click();
    await expect(
      mobile.getByRole("heading", { name: "Place Your Bid" }),
    ).toBeVisible();
    await mobile
      .getByRole("button", { name: "Table options", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Let autoplay take my turns" })
      .click();
    await expect(
      mobile.getByRole("heading", { name: "Game Over!" }),
    ).toBeVisible({ timeout: 30_000 });
    await mobile.getByRole("link", { name: "History", exact: true }).click();
    await expect(mobile.locator("tbody tr")).toHaveCount(1);
    await expect(mobile.locator("tbody")).toContainText("Practice");
    await mobile
      .getByRole("link", { name: "Leaderboard", exact: true })
      .click();
    await expect(mobile.locator(".AccountPage")).toContainText(
      "Finish a human match",
    );
    await expect(mobile.locator("tbody")).toHaveCount(0);
    await mobile
      .getByRole("link", { name: "Learn to play", exact: true })
      .click();
    for (const answer of [
      "GREEN 3",
      "BLACK 2",
      "Mermaid",
      "Avoid winning another trick",
      "40",
    ]) {
      await mobile.getByRole("button", { name: answer, exact: true }).click();
      await expect(mobile.getByRole("status")).toContainText("Correct.");
      await mobile.getByRole("button", { name: "Next lesson" }).click();
    }
    await expect(
      mobile.getByRole("heading", { name: "You’re ready for the table." }),
    ).toBeVisible();
    expect(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  } finally {
    await Promise.allSettled([first.close(), second.close()]);
  }
});

test("custom setup supports a full crew and readable responsive hands", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: /Everything, including the expansion/ })
    .click();
  await page.getByText("Customize individual cards", { exact: false }).click();
  await expect(
    page.getByRole("checkbox", { name: /^White Whale/ }),
  ).toBeChecked();
  await page
    .getByLabel("Round schedule", { exact: true })
    .selectOption("custom");
  await page.getByLabel("Cards per round, separated by commas").fill("10");
  await page.getByText("Scoring & special rules", { exact: false }).click();
  await page.getByRole("checkbox", { name: /^Pirate abilities/ }).check();
  await page
    .getByRole("button", { name: "Start New Voyage", exact: true })
    .click();
  await page.getByLabel(/Enter yer name/).fill("Captain Longname");
  await page.getByRole("button", { name: "Board the Ship" }).click();
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(1);
  const gameId = page.url().split("/").pop();
  for (let index = 1; index <= 8; index++) {
    const result = await (
      await request.post(`${baseURL}/graphql`, {
        data: {
          query:
            "mutation($gameId:String!,$name:String!) { addPlayer(gameId:$gameId,name:$name) }",
          variables: { gameId, name: `Captain of the Seas ${index}` },
        },
      })
    ).json();
    expect(result.errors).toBeUndefined();
  }
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(9);
  await page.getByRole("button", { name: "Set Sail!" }).click();
  await expect(page.locator(".Hand-playerHand > li")).toHaveCount(10);
  await expect(page.locator(".GameTable-opponent")).toHaveCount(8);
  await expect(
    page.getByRole("heading", { name: "Place Your Bid" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".Hand-playerHand")
      .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: join(qaDirectory, "desktop-full-crew.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator(".Hand-playerHand")
      .evaluate((element) => element.scrollWidth > element.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: join(qaDirectory, "phone-full-crew.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await expect(page.locator(".Hand")).toBeInViewport();
  const scoreButton = page.getByRole("button", {
    name: "Scorecard",
    exact: true,
  });
  await scoreButton.click();
  const scoreDialog = page.getByRole("dialog", {
    name: "Scorecard",
    exact: true,
  });
  await expect(scoreDialog).toBeVisible();
  await expect(scoreDialog).toContainText(
    "Scores appear here after the first round",
  );
  await page.keyboard.press("Escape");
  await expect(scoreDialog).not.toBeVisible();
  await expect(scoreButton).toBeFocused();
  await scoreButton.click();
  await page.getByRole("button", { name: "Close scorecard" }).click();
  await expect(scoreDialog).not.toBeVisible();
  await page
    .locator(".BidForm")
    .getByRole("button", { name: "0", exact: true })
    .click();
  await expect(page.locator(".AwaitingBids")).toBeVisible();
});

test("an unavailable page file offers recovery instead of a developer error", async ({
  page,
}) => {
  await page.goto(baseURL);
  await page.route("**/assets/Tutorial-*.js", (route) => route.abort());
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Learn to play", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The table needs a refresh" }),
  ).toBeVisible();
  await expect(page.getByText("Unexpected Application Error!")).toHaveCount(0);
  await page.unroute("**/assets/Tutorial-*.js");
  await page.getByRole("button", { name: "Reload game", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Learn Skull King by playing" }),
  ).toBeVisible();
});

test("the crew shares a bid reveal and a phone player inspects before a keyboard-confirmed play", async ({
  browser,
  request,
}) => {
  const created = await (
    await request.post(`${baseURL}/graphql`, {
      data: {
        query: "mutation { newGame(roundSchedule:[3],tieBreakers:false) }",
      },
    })
  ).json();
  expect(created.errors).toBeUndefined();
  const gameId = created.data.newGame;
  const names = ["Captain Ada", "Captain Anne", "Captain Grace"];
  const contexts = await Promise.all([
    browser.newContext({ viewport: { width: 1280, height: 720 } }),
    browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
    browser.newContext({ viewport: { width: 1280, height: 720 } }),
  ]);
  const pages = await Promise.all(contexts.map((context) => context.newPage()));
  try {
    for (let index = 0; index < pages.length; index++) {
      await pages[index].goto(`${baseURL}/game/${gameId}`);
      await pages[index].getByLabel(/Enter yer name/).fill(names[index]);
      await pages[index]
        .getByRole("button", { name: "Board the Ship" })
        .click();
      await expect(pages[index].locator(".Lobby-playerList")).toContainText(
        names[index],
      );
    }
    await pages[0].getByRole("button", { name: "Set Sail!" }).click();
    for (const page of pages) {
      await expect(
        page.getByRole("heading", { name: "Place Your Bid" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "0", exact: true }).click();
    }
    await Promise.all(
      pages.map((page) =>
        expect(
          page.getByRole("status", {
            name: "Bids locked. The crew is chanting before the reveal.",
          }),
        ).toBeVisible(),
      ),
    );
    for (const page of pages) {
      const table = page.getByRole("region", { name: "Game table" });
      await expect(table.getByText("Bid hidden", { exact: true })).toHaveCount(
        2,
      );
      await expect(table.getByText("Bid 0", { exact: true })).toHaveCount(0);
    }
    await pages[0].screenshot({
      path: join(qaDirectory, "desktop-bid-ritual.png"),
      fullPage: true,
    });
    await pages[1].screenshot({
      path: join(qaDirectory, "phone-bid-ritual.png"),
      fullPage: true,
    });
    await Promise.all(
      pages.map((page) =>
        expect(
          page
            .getByRole("region", { name: "Game table" })
            .getByText("Bid 0", { exact: true }),
        ).toHaveCount(2),
      ),
    );
    for (const page of pages) {
      await expect(
        page.getByRole("status", {
          name: "Bids locked. The crew is chanting before the reveal.",
        }),
      ).toHaveCount(0);
    }

    const phone = pages[1];
    await expect(phone.locator(".TurnStatus strong")).toHaveText("Your turn");
    await expect(pages[0].locator(".TurnStatus strong")).toHaveText(
      "Captain Anne’s turn",
    );
    await expect(
      pages[0].locator('.GameTable-opponent[aria-current="true"]'),
    ).toContainText("Captain Anne");
    await phone.screenshot({
      path: join(qaDirectory, "phone-your-turn.png"),
      animations: "disabled",
    });
    await pages[0].screenshot({
      path: join(qaDirectory, "desktop-opponent-turn.png"),
      animations: "disabled",
    });
    await expect(phone.getByText(/Your Turn!/)).toBeVisible();
    const cards = phone.locator(".Hand-playerHand > li");
    await expect(cards).toHaveCount(3);
    const inspect = cards.first().getByRole("button", { name: /^Inspect / });
    const inspectedName = (await inspect.getAttribute("aria-label"))!.replace(
      /^Inspect /,
      "",
    );
    const preview = phone.getByRole("region", { name: "Selected card" });
    await inspect.tap();
    await expect(preview).toBeVisible();
    await expect(cards).toHaveCount(3);
    await phone.getByRole("button", { name: "Close card preview" }).tap();
    await expect(preview).toHaveCount(0);
    await inspect.focus();
    await phone.keyboard.press("Enter");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText("Ready to play?");
    await expect(cards).toHaveCount(3);
    await expect(
      phone
        .getByRole("list", { name: "Cards on the table" })
        .getByRole("listitem"),
    ).toHaveCount(0);
    await phone.screenshot({
      path: join(qaDirectory, "phone-card-inspection.png"),
      fullPage: true,
    });
    expect(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const play = preview.getByRole("button", { name: /^Play/ }).first();
    await expect(play).toBeEnabled();
    await play.focus();
    await phone.keyboard.press("Enter");
    await expect(cards).toHaveCount(2);
    await expect(preview).toHaveCount(0);
    await expect(phone.locator(".TurnStatus strong")).toHaveText(
      "Captain Grace’s turn",
    );
    await expect(pages[2].locator(".TurnStatus--yours strong")).toHaveText(
      "Your turn",
    );
    await pages[2].screenshot({
      path: join(qaDirectory, "desktop-your-turn.png"),
      animations: "disabled",
    });
    await pages[2].emulateMedia({ reducedMotion: "reduce" });
    expect(
      await pages[2].locator(".TurnStatus").evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe("none");
    for (const page of pages) {
      const tableCards = page.getByRole("list", { name: "Cards on the table" });
      await expect(tableCards.getByRole("listitem")).toHaveCount(1);
      await expect(tableCards).toContainText("Captain Anne");
      const tableBounds = await page.locator(".GameTable").boundingBox();
      const cardBounds = await tableCards.getByRole("listitem").boundingBox();
      expect(cardBounds!.y).toBeGreaterThanOrEqual(tableBounds!.y);
      expect(cardBounds!.y + cardBounds!.height).toBeLessThanOrEqual(
        tableBounds!.y + tableBounds!.height,
      );
      if (inspectedName !== "Tigress")
        await expect(tableCards).toContainText(inspectedName);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await pages[0].evaluate(() => window.scrollTo(0, 0));
    for (const page of pages) {
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true);
      const scores = page.getByRole("button", {
        name: "Scorecard",
        exact: true,
      });
      await scores.click();
      await expect(
        page.getByRole("dialog", { name: "Scorecard", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(scores).toBeFocused();
    }
    const desktopHand = await pages[0]
      .locator(".Hand-playerHand")
      .boundingBox();
    expect(desktopHand!.y + desktopHand!.height).toBeLessThanOrEqual(720);
    const desktopCard = pages[0].locator(".Hand-playerHand > .Card").first();
    const surface = desktopCard.locator(".Card-surface");
    const resting = await surface.boundingBox();
    expect(resting!.width).toBeGreaterThan(110);
    await desktopCard.hover();
    await expect
      .poll(async () => (await surface.boundingBox())!.y)
      .toBeLessThan(resting!.y - 15);
    await pages[0].screenshot({ path: join(qaDirectory, "desktop-hover.png") });
    await pages[0].mouse.move(0, 0);
    await pages[0].screenshot({
      path: join(qaDirectory, "desktop-preview.png"),
      animations: "disabled",
    });
    await pages[0].screenshot({
      path: join(qaDirectory, "desktop-card-played.png"),
      animations: "disabled",
      fullPage: true,
    });
    await phone.screenshot({
      path: join(qaDirectory, "phone-card-played.png"),
      animations: "disabled",
      fullPage: true,
    });
  } finally {
    await Promise.allSettled(contexts.map((context) => context.close()));
  }
});

test("practice pirates pause between visible card flights", async ({
  page,
  request,
}) => {
  const created = await (
    await request.post(`${baseURL}/graphql`, {
      data: {
        query: "mutation { newGame(roundSchedule:[3],tieBreakers:false) }",
      },
    })
  ).json();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/game/${created.data.newGame}`);
  await page.getByLabel(/Enter yer name/).fill("Patient Captain");
  await page.getByRole("button", { name: "Board the Ship" }).click();
  await page.getByRole("button", { name: "Add practice pirate" }).click();
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(2);
  await page.getByRole("button", { name: "Add practice pirate" }).click();
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(3);
  await page.getByRole("button", { name: "Set Sail!" }).click();
  await page.getByRole("button", { name: "0", exact: true }).click();
  const played = page.locator(".PlayedCards-cards > li");
  await expect(played).toHaveCount(1);
  const firstPlay = Date.now();
  await expect(page.locator("body > .CardFlight")).toBeVisible();
  await expect(page.locator("body > .CardFlight")).toHaveCount(0);
  await expect(played).toHaveCount(1);
  await expect(played).toHaveCount(2);
  expect(Date.now() - firstPlay).toBeGreaterThan(1000);
  await expect(page.locator("body > .CardFlight")).toBeVisible();
  await expect(page.locator("body > .CardFlight")).toHaveCount(0);
  await expect(page.locator(".Hand--myTurn")).toBeVisible();
  await expect(page.locator(".GameTable-opponentHand > span")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Scorecard", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Scorecard", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.screenshot({ path: join(qaDirectory, "phone-paced-play.png") });
});

test("hover stays engaged while moving along the lower edge of a lifted card", async ({
  page,
  request,
}) => {
  const created = await (
    await request.post(`${baseURL}/graphql`, {
      data: {
        query: "mutation { newGame(roundSchedule:[1],tieBreakers:false) }",
      },
    })
  ).json();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${baseURL}/game/${created.data.newGame}`);
  await page.getByLabel(/Enter yer name/).fill("Hover Captain");
  await page.getByRole("button", { name: "Board the Ship" }).click();
  await page.getByRole("button", { name: "Add practice pirate" }).click();
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(2);
  await page.getByRole("button", { name: "Add practice pirate" }).click();
  await expect(page.locator(".Lobby-playerList li")).toHaveCount(3);
  await page.getByRole("button", { name: "Set Sail!" }).click();
  const card = page.locator(".Hand-playerHand > li");
  await expect(card).toHaveCount(1);
  const bounds = (await card.boundingBox())!;
  await card.evaluate((element) => {
    element.setAttribute("data-hover-enters", "0");
    element.setAttribute("data-hover-leaves", "0");
    element.addEventListener("pointerenter", () =>
      element.setAttribute(
        "data-hover-enters",
        String(Number(element.getAttribute("data-hover-enters")) + 1),
      ),
    );
    element.addEventListener("pointerleave", () =>
      element.setAttribute(
        "data-hover-leaves",
        String(Number(element.getAttribute("data-hover-leaves")) + 1),
      ),
    );
  });
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height - 6,
  );
  // Tiny natural pointer movements must not restart the lift as the card rises.
  for (let step = 0; step < 20; step++) {
    await page.waitForTimeout(40);
    await page.mouse.move(
      bounds.x + bounds.width / 2 + (step % 2),
      bounds.y + bounds.height - 6,
    );
  }
  await expect(card).toHaveAttribute("data-hover-enters", "1");
  await expect(card).toHaveAttribute("data-hover-leaves", "0");
});

test("reference card is one click away, readable on a phone, and keyboard dismissible", async ({
  page,
  request,
}, testInfo) => {
  const created = await (
    await request.post(`${baseURL}/graphql`, {
      data: {
        query: "mutation { newGame(roundSchedule:[3],tieBreakers:false) }",
      },
    })
  ).json();
  const gameId = created.data.newGame;
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${baseURL}/game/${gameId}`);
  await page.getByLabel(/Enter yer name/).fill("Reference Reader");
  await page.getByRole("button", { name: "Board the Ship" }).click();
  await page.getByRole("button", { name: "Add practice pirate" }).click();
  await page.getByRole("button", { name: "Set Sail!" }).click();
  const opener = page.getByRole("button", {
    name: "Reference card",
    exact: true,
  });
  await opener.click();
  const reference = page.getByRole("dialog", {
    name: "Reference card",
    exact: true,
  });
  await expect(
    reference.getByRole("heading", { name: "Card hierarchy" }),
  ).toBeVisible();
  await expect(
    reference.getByRole("heading", { name: "Bonus points" }),
  ).toBeVisible();
  await expect(reference).toContainText(
    "Mermaid wins a trick containing both Skull King and a Pirate",
  );
  await page.screenshot({
    path: testInfo.outputPath("reference-desktop.png"),
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(reference).not.toBeVisible();
  await expect(opener).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await opener.click();
  await expect(reference).toBeVisible();
  expect(
    await reference.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("reference-phone-hierarchy.png"),
    animations: "disabled",
  });
  await reference
    .getByRole("heading", { name: "Bonus points" })
    .scrollIntoViewIfNeeded();
  await expect(
    reference.getByText("Mermaid captures Skull King"),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("reference-phone-bonuses.png"),
    animations: "disabled",
  });
  await reference.getByRole("button", { name: "Close reference card" }).click();
  await expect(opener).toBeFocused();
});
