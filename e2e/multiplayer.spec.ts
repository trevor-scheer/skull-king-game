import { test, expect } from "@playwright/test";
import { spawn, ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let server: ChildProcess;
let baseURL: string;
let directory: string;

async function startServer(port = 0) {
  server = spawn(process.execPath, ["e2e/server.cjs"], {
    env: { ...process.env, DATA_DIR: directory, PORT: String(port), ALLOWED_ORIGINS: baseURL ?? "" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise<string>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 15_000);
    server.stderr!.on("data", chunk => { output += chunk; });
    server.stdout!.on("data", chunk => {
      output += chunk;
      const match = output.match(/E2E_URL=(http:\/\/127\.0\.0\.1:\d+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}: ${output}`)); });
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  const timeout = setTimeout(() => server.kill("SIGKILL"), 10_000);
  try { await exited; } finally { clearTimeout(timeout); }
}

test.beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "skull-king-browser-"));
  baseURL = await startServer();
});

test.afterAll(async () => {
  await stopServer();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test("three friends finish a match after a disconnect and server restart", async ({ browser, request }) => {
  const response = await request.post(`${baseURL}/graphql`, {
    data: {
      query: `mutation { newGame(roundSchedule:[1],tieBreakers:false) }`,
    },
  });
  expect(response.ok()).toBe(true);
  const created = await response.json();
  expect(created.errors).toBeUndefined();
  const gameId = created.data.newGame;
  const contexts = await Promise.all(Array.from({ length: 3 }, () => browser.newContext()));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  const names = ["Captain Ada", "Captain Grace", "Captain Linus"];
  try {
    const lobby = await pages[0].goto(`${baseURL}/game/${gameId}`);
    expect(lobby?.status()).toBe(200);
    await pages[0].getByLabel(/Enter yer name/).fill(names[0]);
    await pages[0].getByRole("button", { name: "Board the Ship" }).click();
    await expect(pages[0].locator(".Lobby-playerList")).toContainText(names[0]);
    const invite = await pages[0].getByRole("textbox", { name: "Invite link" }).inputValue();
    expect(invite).toBe(`${baseURL}/game/${gameId}`);
    for (let index = 1; index < pages.length; index++) {
      await pages[index].goto(invite);
      await pages[index].getByLabel(/Enter yer name/).fill(names[index]);
      await pages[index].getByRole("button", { name: "Board the Ship" }).click();
      await expect(pages[index].locator(".Lobby-playerList")).toContainText(names[index]);
    }
    await expect(pages[0].locator(".Lobby-playerList li")).toHaveCount(3);
    await expect(pages[1].getByRole("button", { name: "Set Sail!" })).toHaveCount(0);
    await pages[0].getByRole("button", { name: "Set Sail!" }).click();
    for (const page of pages) await expect(page.getByRole("heading", { name: "Place Your Bid" })).toBeVisible();

    // Keep one browser's room identity across an actual offline interval and
    // restart the server against the same private checkpoint directory.
    await contexts[1].setOffline(true);
    const port = Number(new URL(baseURL).port);
    await stopServer();
    expect(await startServer(port)).toBe(baseURL);
    await contexts[1].setOffline(false);
    await pages[1].reload();
    await expect(pages[1].getByRole("heading", { name: "Place Your Bid" })).toBeVisible();
    await expect(pages[1].getByRole("button", { name: "Board the Ship" })).toHaveCount(0);

    for (const page of pages) await page.getByRole("button", { name: "0", exact: true }).click();
    for (let turn = 0; turn < 3; turn++) {
      let active = -1;
      await expect.poll(async () => {
        const enabled = await Promise.all(pages.map(page => page.locator(".Hand-playerHand button:enabled").count()));
        active = enabled.findIndex(count => count > 0);
        return active;
      }).toBeGreaterThanOrEqual(0);
      await pages[active].locator(".Hand-playerHand button:enabled").first().click();
      await expect(pages[active].locator(".Hand-playerHand button")).toHaveCount(0);
    }
    for (const page of pages) {
      await expect(page.getByRole("heading", { name: "Game Over!" })).toBeVisible();
      for (const name of names) await expect(page.locator(".Scorecard")).toContainText(name);
    }
    await pages[2].reload();
    await expect(pages[2].getByRole("heading", { name: "Game Over!" })).toBeVisible();
  } finally {
    await Promise.allSettled(contexts.map(context => context.close()));
  }
});
