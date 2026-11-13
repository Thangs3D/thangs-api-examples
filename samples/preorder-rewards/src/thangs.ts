// A minimal client for the Thangs API endpoints this sample uses.
// Every call sends the API key, so this module must only run on the server.

const API_HOST = "https://production-api.thangs.com";

export class ThangsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface AuthInitiation {
  authenticateUrl: string;
  verifierCode: string;
}

export interface AccessGrant {
  userId: string;
  userToken: string;
}

export interface RewardItem {
  type: "model" | "collection" | "print_sku" | "membership" | "feature";
  id: number;
  label: string;
  available: boolean;
}

export interface RewardEntitlement {
  campaignId: number;
  campaignTitle: string;
  rewardId: number;
  rewardName: string;
  rewardItems: RewardItem[];
  captured: boolean;
  delivered: boolean;
}

export function createThangsClient(apiKey: string) {
  async function request<T>(
    method: string,
    path: string,
    userToken?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    };
    if (userToken) headers["x-thangs-user-token"] = userToken;

    const response = await fetch(`${API_HOST}${path}`, { method, headers });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new ThangsApiError(
        response.status,
        body.message ?? response.statusText,
      );
    }
    return (await response.json()) as T;
  }

  return {
    // https://thangs3d.github.io/thangs-api-examples/plans-and-memberships#initiate-the-authorization
    initiateAuth(): Promise<AuthInitiation> {
      return request("POST", "/public/auth/initiate");
    },

    // https://thangs3d.github.io/thangs-api-examples/plans-and-memberships#verify-user-authorization
    // Returns null while the user has not authorized your application yet.
    async checkAccessGrant(verifierCode: string): Promise<AccessGrant | null> {
      try {
        return await request(
          "GET",
          `/public/auth/access-grant/${encodeURIComponent(verifierCode)}/check`,
        );
      } catch (error) {
        if (error instanceof ThangsApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },

    // https://thangs3d.github.io/thangs-api-examples/preorder-rewards#get-a-user-s-preorder-rewards
    async getPreorderRewards(userToken: string): Promise<RewardEntitlement[]> {
      const body = await request<{ rewards: RewardEntitlement[] }>(
        "GET",
        "/public/user/preorder-rewards",
        userToken,
      );
      return body.rewards;
    },
  };
}

export type ThangsClient = ReturnType<typeof createThangsClient>;
