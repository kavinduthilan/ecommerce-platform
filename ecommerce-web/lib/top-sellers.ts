export async function getTopSellers() {
  try {
    const res = await fetch(`${process.env.API_URL}/api/top-sellers`, {
      cache: "no-cache" 
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return []; 
  }
}