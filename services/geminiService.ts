
export const getSmartInsight = async (from: string, to: string, amount: number): Promise<string> => {
  const fallback = "Consultez les dernières actualités pour des informations sur les taux.";

  try {
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, amount }),
    });

    if (!response.ok) {
      throw new Error(`Insight API failed with status ${response.status}`);
    }

    const data = (await response.json()) as { insight?: string };
    return data.insight?.trim() || fallback;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return fallback;
  }
};
