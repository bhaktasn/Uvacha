import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  tool: "storyboard" | "image-prompt";
  currentState: Record<string, unknown>;
}

const STORYBOARD_SYSTEM_PROMPT = `You are an AI assistant helping users build storyboard JSON prompts for text-to-image generation. You help fill out form fields based on user descriptions.

The storyboard JSON has this structure:
- task: usually "create_storyboard"
- project: { title, aspect_ratio, visual_style, consistency_id }
- main_characters: array of { id, description }
- shots: array of shot objects with shot_number, shot_type, camera_angle, characters, location, action, purpose, focus, notes, text_overlays, emotional_tone, camera { lens, move, dof, aperture, framing_notes }, lighting { preset, notes }
- output: { layout, labels, style }

When the user describes their storyboard idea, you should:
1. Extract and suggest values for all relevant fields
2. Create characters with IDs and descriptions
3. Design shots with proper camera angles, lighting, and actions
4. Maintain cinematic vocabulary

IMPORTANT: When you want to update the form, respond with a JSON block wrapped in \`\`\`json and \`\`\` markers containing the partial state to merge. Only include fields you want to update.

Example response format:
"Great idea! Here's how I'd structure your coffee shop scene:

\`\`\`json
{
  "project": {
    "title": "Coffee Shop Romance",
    "aspect_ratio": "16:9",
    "visual_style": "warm cinematic, soft grain, golden hour tones"
  },
  "main_characters": [
    { "id": "emma", "description": "mid-20s woman, wavy auburn hair, cozy sweater, warm smile" }
  ],
  "shots": [
    {
      "shot_number": 1,
      "shot_type": "establishing",
      "camera_angle": "wide, exterior",
      "location": "cozy corner coffee shop on autumn morning",
      "action": "steam rising from windows, leaves falling outside",
      "purpose": "set warm, inviting mood"
    }
  ]
}
\`\`\`

This gives us a warm, inviting opening. Want me to add more shots or characters?"

Always be helpful and creative. If the user just wants to chat or ask questions, respond conversationally without JSON blocks.`;

const IMAGE_PROMPT_SYSTEM_PROMPT = `You are an AI assistant helping users build structured JSON prompts for text-to-image AI generation. You help fill out form fields based on user descriptions.

The image prompt JSON has this structure:
- task: usually "create_photo" or similar
- subject: { type, age, gender, ethnicity, clothing, expression, pose }
- environment: { location, background_elements (array), mood }
- camera: { camera_type, lens, aperture, shutter_speed, iso, framing, focus, color_grading }
- lighting: { style, key_light, fill_light, highlights, shadows }
- output: { format, resolution, style, style_notes, consistency_id }

When the user describes their image idea, you should:
1. Extract and suggest values for all relevant fields
2. Use proper photography terminology for camera settings
3. Design appropriate lighting setups
4. Maintain realistic and professional vocabulary

IMPORTANT: When you want to update the form, respond with a JSON block wrapped in \`\`\`json and \`\`\` markers containing the partial state to merge. Only include fields you want to update.

Example response format:
"I love this concept! Here's how I'd capture that nighttime city portrait:

\`\`\`json
{
  "subject": {
    "type": "person",
    "age": "late 20s",
    "gender": "female",
    "ethnicity": "Japanese",
    "clothing": "oversized vintage band tee, leather jacket, silver jewelry",
    "expression": "confident, slight smirk",
    "pose": "leaning against wall, arms crossed"
  },
  "environment": {
    "location": "Tokyo alley at night",
    "background_elements": ["neon signs", "rain-slicked pavement", "distant bokeh lights"],
    "mood": "moody, cyberpunk-inspired, vibrant"
  },
  "camera": {
    "lens": "35mm",
    "aperture": "f/1.4",
    "color_grading": "teal and magenta, lifted blacks"
  }
}
\`\`\`

The wide aperture will give us beautiful subject separation from those neon lights. Want me to adjust the lighting setup?"

Always be helpful and creative. If the user just wants to chat or ask questions, respond conversationally without JSON blocks.`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, tool, currentState } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const systemPrompt =
      tool === "storyboard"
        ? STORYBOARD_SYSTEM_PROMPT
        : IMAGE_PROMPT_SYSTEM_PROMPT;

    // Build the conversation for Gemini
    const geminiContents = [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nCurrent form state:\n\`\`\`json\n${JSON.stringify(currentState, null, 2)}\n\`\`\`\n\nPlease help the user with their request.`,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "I understand! I'm ready to help you build your " +
              (tool === "storyboard" ? "storyboard" : "image prompt") +
              ". Just describe what you're envisioning, and I'll help you fill out the form with appropriate values. Feel free to describe scenes, characters, moods, camera angles, or any creative ideas you have!",
          },
        ],
      },
    ];

    // Add the conversation history
    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from Gemini" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    // Extract JSON from the response if present
    let stateUpdate: Record<string, unknown> | null = null;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        stateUpdate = JSON.parse(jsonMatch[1]);
      } catch {
        // JSON parsing failed, that's okay - just return the text
      }
    }

    return NextResponse.json({
      message: content,
      stateUpdate,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

