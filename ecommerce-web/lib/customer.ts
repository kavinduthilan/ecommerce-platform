export type CustomerInput = {
  name: string;
  phone: number;
  email?: string;
  address: string;
  city: string;
  notes?: string;
};


export type CreateCustomerResult = 
       | { ok: true; id: number }
  | { ok: false; error: string };

export async function createCustomer(customer: CustomerInput): Promise<CreateCustomerResult>{
     try {

      const res = await fetch(`${process.env.API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer }),
        cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.message ?? "Please try again." };
    }
    return { ok: true , id: data.id as number};
      
     } catch (error) {
      return { ok: false, error: "Please try again....!!!" };
     }
}