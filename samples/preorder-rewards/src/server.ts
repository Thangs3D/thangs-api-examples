import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import {
  createThangsClient,
  ThangsApiError,
  type RewardEntitlement,
} from "./thangs.ts";

const apiKey = process.env.THANGS_API_KEY;
const apiHost =
  process.env.THANGS_API_HOST || "https://production-api.thangs.com";
const rewardId = Number(process.env.REWARD_ID);
const featureItemId = Number(process.env.FEATURE_ITEM_ID);
const unlockWhen = process.env.UNLOCK_WHEN || "backing";
const port = Number(process.env.PORT ?? 3000);

if (!apiKey) throw new Error("Set THANGS_API_KEY in .env");
if (!Number.isInteger(rewardId)) throw new Error("Set REWARD_ID in .env");
if (!Number.isInteger(featureItemId)) {
  throw new Error("Set FEATURE_ITEM_ID in .env");
}
if (unlockWhen !== "backing" && unlockWhen !== "release") {
  throw new Error('Set UNLOCK_WHEN in .env to "backing" or "release"');
}

const thangs = createThangsClient(apiKey, apiHost);

// What the sample remembers about each visitor. A real application would
// store this with its own user record, in a database.
interface Session {
  verifierCode?: string;
  userToken?: string;
}

const sessions = new Map<string, Session>();
const SESSION_COOKIE = "sid";

function getSession(req: IncomingMessage, res: ServerResponse): Session {
  const existing = (req.headers.cookie ?? "")
    .split(";")
    .map((pair) => pair.trim().split("="))
    .find(([name]) => name === SESSION_COOKIE)?.[1];
  if (existing) {
    const session = sessions.get(existing);
    if (session) return session;
  }
  const id = randomUUID();
  const session: Session = {};
  sessions.set(id, session);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${id}; HttpOnly; SameSite=Lax; Path=/`,
  );
  return session;
}

// Gets the user's rewards. If the user token is no longer valid (403), gets a
// new one with the saved verifier code and tries once more. Returns null if
// the user needs to authorize the application again.
async function getRewards(
  session: Session,
): Promise<RewardEntitlement[] | null> {
  if (!session.userToken) return null;
  try {
    return await thangs.getPreorderRewards(session.userToken);
  } catch (error) {
    if (!(error instanceof ThangsApiError) || error.status !== 403) throw error;
  }

  const grant = session.verifierCode
    ? await thangs.checkAccessGrant(session.verifierCode)
    : null;
  if (!grant) {
    delete session.userToken;
    delete session.verifierCode;
    return null;
  }
  session.userToken = grant.userToken;
  return await thangs.getPreorderRewards(session.userToken);
}

// The user backed the reward, and the reward includes the feature item.
function findBackedReward(
  rewards: RewardEntitlement[],
): RewardEntitlement | undefined {
  return rewards.find(
    (reward) =>
      reward.rewardId === rewardId &&
      reward.rewardItems.some(
        (item) => item.type === "feature" && item.id === featureItemId,
      ),
  );
}

// With UNLOCK_WHEN=backing, the feature unlocks as soon as the user backs the
// reward. With UNLOCK_WHEN=release, it unlocks once the campaign is funded and
// the user has paid (`captured`) and Thangs has delivered the reward
// (`delivered`).
function isUnlocked(reward: RewardEntitlement): boolean {
  return unlockWhen === "backing" || (reward.captured && reward.delivered);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const route = `${req.method} ${pathname}`;
  const session = getSession(req, res);

  switch (route) {
    case "GET /": {
      const html = await readFile(
        new URL("../public/index.html", import.meta.url),
      );
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // Step 1: start the authorization and hand the URL to the browser.
    case "POST /api/auth/start": {
      const { authenticateUrl, verifierCode } = await thangs.initiateAuth();
      session.verifierCode = verifierCode;
      delete session.userToken;
      sendJson(res, 200, { authenticateUrl });
      return;
    }

    // Step 2: the browser polls this until the user has clicked Allow.
    case "GET /api/auth/status": {
      if (!session.userToken && session.verifierCode) {
        const grant = await thangs.checkAccessGrant(session.verifierCode);
        if (grant) session.userToken = grant.userToken;
      }
      sendJson(res, 200, { authorized: Boolean(session.userToken) });
      return;
    }

    // Step 3: check the user's rewards and decide whether to unlock.
    case "GET /api/feature": {
      const rewards = await getRewards(session);
      if (!rewards) {
        sendJson(res, 401, { message: "Connect your Thangs account first" });
        return;
      }
      const reward = findBackedReward(rewards);
      sendJson(res, 200, {
        backed: Boolean(reward),
        unlocked: Boolean(reward && isUnlocked(reward)),
        reward: reward && {
          campaignTitle: reward.campaignTitle,
          rewardName: reward.rewardName,
        },
      });
      return;
    }

    case "POST /api/auth/disconnect": {
      delete session.userToken;
      delete session.verifierCode;
      sendJson(res, 200, { authorized: false });
      return;
    }

    default:
      sendJson(res, 404, { message: "Not found" });
  }
}

createServer((req, res) => {
  handle(req, res).catch((error: unknown) => {
    console.error(error);
    const status = error instanceof ThangsApiError ? 502 : 500;
    sendJson(res, status, { message: "Something went wrong" });
  });
}).listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
