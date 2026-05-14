import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI =- new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Placeholder prompt 
// TODO: discuss with team a better prompt.
const SYSTEM_PROMPT = `You are a food accessibility analyst for Vancouver, BC.
You are given statistics about a dissemination area and its nearby food assets
(grocery stores, community gardens, farmers markets, etc.) based on walking distance.

Write a 3-4 sentence summary for a {persona}.

If persona is "planner":
- Use policy-relevant language
- Highlight gaps, underserved populations, and infrastructure needs
- Reference specific metrics

If persona is "resident":
- Use plain, accessible language
- Focus on what this means for daily life
- Mention nearby food options and what's missing

Rules:
- Only reference data you are given. Do not fabricate statistics.
- Be specific, mention actual numbers from the data.
- If relevant, include recent local news about this Vancouver neighbourhood, prioritize food access news (grocery openings/closures, community food programs, farmers markets) 
  but also include relevant infrastructure news (transit changes, new developments, housing projects, community services) that could impact food accessibility.
- Keep it concise (3-4 sentences max).`;

const cache = new Map();
        
export async function generateDASummary(stats, nearbyFoodAssets, persona) {
  const cacheKey = `${stats.dauid}-${persona}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const dataContext = `
    Dissemination Area: ${stats.dauid}
    Population Density: ${stats.population_density_per_km2} per km²
    Average Household Size: ${stats.avg_household_size}
    Median Household Income: $${Number(stats.median_household_income).toLocaleString()}
    Low Income (LIM-AT): ${stats.pct_low_income_lim_at}%
    Shelter Cost 30%+: ${stats.pct_shelter_cost_30pct_plus}%
    Commute by Car: ${stats.pct_commute_car}%
    Commute by Transit: ${stats.pct_commute_transit}%
    Commute by Walking: ${stats.pct_commute_walk}%

    Nearby Food Assets (by walking distance):
    ${nearbyFoodAssets.length === 0
      ? 'No food assets within walking distance.'
      : nearbyFoodAssets.map(f =>
        `- ${f.name} (${f.category}) — ${f.range_seconds / 60} min walk`
      ).join('\n')
    }
  `;
  
  const prompt = SYSTEM_PROMPT.replace('{persona}', persona);

  const model = genAI.getGenerativeModel({
    // Switch model here
    model: 'gemini-2.0-flash',
    tools: [{googleSearch: {}}],
  });

  const result = await model.generateContext({
    contents: [{role: 'user', parts: [{text: prompt + '\n\n' + dataContext}] }],
  });

  const summary = result.response.text();

  cache.set(cacheKey, summary);

  return summary;
}

export function clearCacheEntry(dauid, persona) {
  cache.delete(`${dauid}-${persona}`);
}

