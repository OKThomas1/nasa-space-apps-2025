import OpenAI from "openai"

/* eslint-disable @typescript-eslint/no-namespace */
export namespace OpenAIPrompts {
    export namespace ImageAnalysis {
        export const devMessage = `Analyze the attached JPEG pollution map and identify up to 8 of the most effective, specific places within the provided bounding box (bbox) for anti-pollution actions (not limited to planting trees). Your goal is to recommend actionable interventions that best reduce pollution exposure for vulnerable populations using only the map data.

Additional details:
- The action can be any targeted anti-pollution intervention (e.g., planting trees, installing air filters, creating barriers, etc.), not just tree planting.
- The map's background is mostly grey (with black representing water).
- The bbox is provided in WGS84 coordinates (longitude, latitude).
- Observe only the areas of the map that are brown. The opacity of brown indicates pollution levels; darker brown means higher pollution.
- Prioritize locations with high pollution levels that are near vulnerable populations (e.g., schools, parks, residential areas with many children or elderly).
- Focus on specific locations or landmarks commonly recognized by locals (malls, parks, schools, hospitals, neighborhoods, major intersections). If you cannot identify a proper place, use “near [cross-streets]” or “northern edge of [park/neighborhood].”
- Try to identify risk to children or elderly populations (mention in your rationale where applicable).
- Use only information visible inside the bbox; ignore any annotations or markings on the right side of the map image.
- Be concise and actionable. Do not provide coordinates, bounding boxes, or reference methodology.
- Base your recommendations solely on observed map features and color patterns, but never mention the map, image, colormaps, or pollution opacity directly or indirectly.
- In each recommendation, the action should never restate the location or reference the place; state the intervention only.
- Rationales must not reference the map, the existence of the map, "brownness," opacity, colors, overlays, or any component identifying that decisions are based on a map.
- Do NOT mention the word "JSON" or refer to the instructions in the reasoning/thinking step summaries.

# Steps

1. Carefully review the map, paying attention to areas that correspond to visible signs or contextual cues of pollution exposure (based on the brown areas).
2. Determine which locations (e.g. schools, senior homes, other places where vulnerable people may be) within the bbox AND within the brown areas.
2. For each of those locations, determine the most effective anti-pollution action for that place and a fact-based rationale, focusing on characteristics of the place and population risk, never citing or describing map features.
3. Present your reasoning for why the action is appropriate for the place, before stating the action.
4. Use the most specific and locally understandable place names visible inside the bbox.
5. Output your recommendations in a structured JSON array as specified below.

# Output Format

- Output a JSON array with up to 8 objects.
- Each object must include:
  - "location": the place, landmark, or specific area (as seen on the map within the bounding box)
  - "rationale": a concise, fact-based explanation for why this place/action is selected, focusing on local, demographic, or contextual risk factors only
  - "action": a single actionable anti-pollution intervention, precisely stated and tailored to the location. Do not restate the location, e.g., “Install air purification units around the community center,” should be “Install air purification units around the community center” and NOT “At Oakridge Park, install air purification units.”
- Never reference the map, colors, overlays, or visualization, and never repeat the location in the action.

Example output (use local names and real rationale from the map in practice):

[
  {
    "location": "Oakridge Park",
    "reasoning": "Large elderly population and frequent community gatherings increase concern for respiratory health.",
    "action": "Install air purification units around the community center."
  },
  {
    "location": "Main Street Community Centre",
    "reasoning": "Family apartments and a nearby school put many children at risk of exposure.",
    "action": "Plant dense vegetation barriers between the street and the playground."
  },
  {
    "location": "near Cambie & 41st Avenue",
    "reasoning": "High traffic intersection close to a school increases exposure for students during peak hours.",
    "action": "Add green buffer zones along the busy intersection."
  }
]
(Actual outputs should use up to 8 items and use true place names and rationales based on the attached map. Examples above are illustrative only.)

# Notes

- Actions must never restate or paraphrase the location.
- Rationales must never refer (even indirectly) to any aspect of the map, colors, overlays, or the process of visually inspecting the image.
- Base your rationale only on contextual, demographic, or location-based vulnerability.
- Generalize the anti-pollution action to suit the location, population, and setting.
- Refer only to features and landmarks visible within the bbox of the provided map.
- Disregard any right-side map annotations or explanatory markings.
- Recommendations must be highly specific, actionable, and justified; avoid general, grid-based, or redundant suggestions.
- Output only a valid JSON array of up to 8 recommended actions.
- If the map has no brown areas, the array may be empty. Do NOT hallucinate data.

Remember: Your task is to produce a JSON array (up to 8 entries) of anti-pollution recommendations. Each entry must feature clear, location-based rationales centered on population risk and context, and concise actions that never duplicate or reference map-derived features. Always state reasoning before the action.

Reminder: Do not reference the map or color key in rationales, and actions should not restate the location. Focus your outputs on precise, informed interventions for vulnerable populations at specific locations only.`

        export const userMessage = (
            bbox: [number, number, number, number]
        ) => `Use this map JPEG as a pollution heatmap for:

bbox (WGS84): ${JSON.stringify(bbox)}
Task: Give me 8-12 plain-English locations where trees should be planted or where other anti-pollution actions should take place to reduce pollution exposure, prioritizing vulnerable people.

Constraints:
- NO coordinates or boxes; just recognizable places.
- Each action: “<Verb> <what should be done>”. (e.g. "Infill street with trees" instead of "street-tree infill"). Make sure it a proper sentence with a capital and a period BUT should not repeat the location name or include rationale.
- Each rationale: "<why it helps>".
- Mention proximity (e.g., “north side of <mall>”, “along the east edge of <park>”, “near <A> & <B>”).
- Keep total under 150 words. Return only the bullets.
`

        export const responseSchema: OpenAI.Responses.ResponseFormatTextConfig = {
            type: "json_schema",
            name: "pollution_solution_locations_v2",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    meta: {
                        type: "object",
                        properties: {
                            bbox: {
                                type: "array",
                                description: "[minLon,minLat,maxLon,maxLat]",
                                items: {
                                    type: "number",
                                },
                                minItems: 4,
                                maxItems: 4,
                            },
                            cellMeters: {
                                type: "number",
                                minimum: 1,
                            },
                            notes: {
                                type: "string",
                            },
                            assumptions: {
                                type: "string",
                            },
                            sources: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                            },
                        },
                        required: ["bbox", "cellMeters", "notes", "assumptions", "sources"],
                        additionalProperties: false,
                    },
                    spots: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Human-friendly landmarked name",
                                },
                                bbox: {
                                    type: "array",
                                    description:
                                        "[minLon,minLat,maxLon,maxLat] (must lie within meta.bbox)",
                                    items: {
                                        type: "number",
                                    },
                                    minItems: 4,
                                    maxItems: 4,
                                },
                                centroid: {
                                    type: "array",
                                    description: "[lon,lat]",
                                    items: {
                                        type: "number",
                                    },
                                    minItems: 2,
                                    maxItems: 2,
                                },
                                rank: {
                                    type: "integer",
                                    minimum: 1,
                                },
                                scores: {
                                    type: "object",
                                    properties: {
                                        pollution: {
                                            type: "number",
                                            minimum: 0,
                                            maximum: 100,
                                            description: "0..100 intensity",
                                        },
                                        exposure: {
                                            type: "number",
                                            minimum: 0,
                                        },
                                        overall: {
                                            type: "number",
                                            minimum: 0,
                                        },
                                    },
                                    required: ["pollution", "exposure", "overall"],
                                    additionalProperties: false,
                                },
                                action: {
                                    type: "string",
                                    description:
                                        "e.g., roadside buffer, street-tree infill, shelterbelt",
                                },
                                rationale: {
                                    type: "string",
                                    description: "Why this spot; who benefits (1–2 sentences)",
                                },
                                confidence: {
                                    type: "string",
                                    enum: ["low", "medium", "high"],
                                },
                                landmarks: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            label: {
                                                type: "string",
                                            },
                                            distance_m: {
                                                type: "number",
                                                minimum: 0,
                                            },
                                        },
                                        required: ["label", "distance_m"],
                                        additionalProperties: false,
                                    },
                                },
                            },
                            required: [
                                "name",
                                "bbox",
                                "centroid",
                                "rank",
                                "scores",
                                "action",
                                "rationale",
                                "confidence",
                                "landmarks",
                            ],
                            additionalProperties: false,
                        },
                    },
                },
                required: ["meta", "spots"],
                additionalProperties: false,
            },
        }
    }
}
