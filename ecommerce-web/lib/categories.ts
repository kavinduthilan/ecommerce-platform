export async function getCategories() {
  try {
    const res = await fetch(`${process.env.API_URL}/api/categories`, {
      next: { revalidate: 60 }, 
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return []; 
  }
}