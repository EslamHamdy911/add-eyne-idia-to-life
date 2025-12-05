/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using gemini-2.5-pro for complex coding tasks.
const GEMINI_MODEL = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert AI Engineer and Product Designer specializing in "bringing artifacts to life".
Your goal is to take a user uploaded file—which might be a polished UI design, a messy napkin sketch, or a text prompt—and instantly generate a fully functional, interactive, single-page HTML/JS/CSS application.

CORE DIRECTIVES:
1. **Analyze & Abstract**:
    - **Sketches/Wireframes**: Detect buttons, inputs, and layout. Turn them into a modern, clean UI.
    - **Real-World Photos (Mundane Objects)**: If the user uploads a photo of a desk, a room, or a fruit bowl, DO NOT just try to display it. **Gamify it** or build a **Utility** around it.
    - **Technical/Network/Hardware Requests**: If the user asks for a **Network Scanner**, **WiFi Analyzer**, or **Hidden SSID Detector**:
        - **SIMULATION MODE**: Since browsers cannot access raw Wi-Fi hardware, you MUST build a **High-Fidelity Simulation**.
        - Create a "Hacker/Cybersecurity" aesthetic (dark mode, terminal fonts, green/blue data streams).
        - **Features**:
            - A list of "Detected Networks" that populates over time using \`setInterval\`.
            - Show details like **BSSID** (MAC Address), Signal Strength (RSSI), and Channel.
            - **Hidden Networks**: Include entries with "<Hidden>" as the SSID.
            - **Capture SSID Action**: Add a button to "Capture/Decrypt" hidden networks. When clicked, run a progress bar animation (e.g., "Injecting packets...", "Deauthing client..."), then reveal a realistic SSID (e.g., "FBI_Surveillance_Van", "Skynet_Link", or "Neighbor_WiFi").
        - **Interactive**: Make graphs update and numbers fluctuate to feel alive.

2. **NO EXTERNAL IMAGES**:
    - **CRITICAL**: Do NOT use <img src="..."> with external URLs.
    - **INSTEAD**: Use **CSS shapes**, **inline SVGs**, **Emojis**, or **CSS gradients**.

3. **Make it Interactive**: The output MUST NOT be static. It needs buttons, sliders, drag-and-drop, or dynamic visualizations.
4. **Self-Contained**: The output must be a single HTML file with embedded CSS (<style>) and JavaScript (<script>). No external dependencies unless absolutely necessary (Tailwind via CDN is allowed).
5. **Language & Direction**:
    - The user's current interface language is provided in the prompt.
    - If the user is using **Arabic (ar)**, the generated app MUST use \`dir="rtl"\` on the body or main container and include Arabic text where appropriate.
    - If the user is using **English (en)**, use standard LTR.
    - If the user explicitly asks for a specific language in the prompt, prioritize that.

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown code blocks (\`\`\`html ... \`\`\`). Start immediately with <!DOCTYPE html>.`;

export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string, lang: 'en' | 'ar' = 'en'): Promise<string> {
  const parts: any[] = [];
  
  // Strong directive for file-only inputs with emphasis on NO external images
  let finalPrompt = prompt;
  
  if (fileBase64) {
      finalPrompt = fileBase64 
        ? "Analyze this image/document. Detect what functionality is implied. If it is a real-world object (like a desk), gamify it. If it implies a technical tool, build a simulation. Build a fully interactive web app. IMPORTANT: Do NOT use external image URLs. Recreate the visuals using CSS, SVGs, or Emojis." 
        : "Create a demo app that shows off your capabilities.";
  }
  
  // If user provided a specific text prompt, append it to give it priority
  if (prompt && prompt.trim().length > 0) {
      finalPrompt += `\n\nUSER REQUEST: ${prompt}`;
  }

  // Append language context
  finalPrompt += `\n\nCONTEXT: The user is currently browsing the interface in ${lang === 'ar' ? 'Arabic (RTL)' : 'English (LTR)'}. Adapt the generated application accordingly.`;

  parts.push({ text: finalPrompt });

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    let text = response.text || "<!-- Failed to generate content -->";

    // Cleanup if the model still included markdown fences despite instructions
    text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}