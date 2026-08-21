export async function webSearch(query) {
    const response = await fetch(
        "https://api.tavily.com/search",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query,
                search_depth: "basic",
                max_results: 5,
                include_answer: false
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Tavily search failed: ${response.status}`
        );
    }

    const data = await response.json();

    const results = data.results || [];

    return results.map(result => ({
        ...result,
        content: result.content?.slice(0, 3000) || ""
    }));
}