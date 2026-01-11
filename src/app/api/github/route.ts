import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const GITHUB_USERNAME = "AMAN-B-H-A-T-T";
const CACHE_KEY = "github_profile_data";
const CACHE_TTL = 3600; // 1 hour

export async function GET(req: NextRequest) {
  try {
    // 1. Check Redis Cache
    const cachedData = await redis.get(CACHE_KEY);
    console.log("before cache");
    if (cachedData) {
      console.log("[GITHUB_API] Serving from cache");
      return NextResponse.json(cachedData);
    }

    // 2. Fetch from GitHub API
    console.log("[GITHUB_API] Cache miss, fetching from GitHub");
    console.log(`https://api.github.com/users/${GITHUB_USERNAME}`);
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          // Add GITHUB_TOKEN to env if you hit rate limits
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = await response.json();

    // 3. Fetch Contributions (using a public aggregator or estimation)
    // For a real production app, you'd use GraphQL with a PAT
    let totalContributions = 0;
    try {
      const contribRes = await fetch(
        `https://github-contributions-api.deno.dev/${GITHUB_USERNAME}.json`
      );
      if (contribRes.ok) {
        const contribData = await contribRes.json();
        totalContributions = contribData.total.lastYear || 0;
      }
    } catch (e) {
      console.warn("Failed to fetch contributions chart data", e);
    }

    // 4. Format Data
    const profile = {
      username: data.login,
      name: data.name,
      bio: data.bio,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      location: data.location,
      url: data.html_url,
      avatar_url: data.avatar_url,
      total_contributions: totalContributions,
      achievements: [
        { name: "Pull Shark", icon: "🦈" },
        { name: "Quickdraw", icon: "🏹" },
        { name: "YOLO", icon: "🚀" },
      ], // Simplified achievements as REST doesn't provide them easily
      last_updated: new Date().toISOString(),
    };

    // 5. Update Cache
    await redis.set(CACHE_KEY, profile, { ex: CACHE_TTL });

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("[GITHUB_API_ERROR]:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch GitHub data", message: error.message },
      { status: 500 }
    );
  }
}
