/**
 * Minimal OpenAI embeddings helper for demo use.
 * Reads API key from Vite env: VITE_OPENAI_API_KEY
 */
export const getEmbedding = async (input: string): Promise<number[] | null> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || !input) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI embedding error", await response.text());
      return null;
    }

    const json = await response.json();
    return json?.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error("Embedding request failed", error);
    return null;
  }
};

