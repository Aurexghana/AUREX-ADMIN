import { apiFetch } from "@/lib/api/client";
import { cached, invalidate } from "@/lib/cache";

export type TestimonialState = "draft" | "published";

export type Testimonial = {
  id: string;
  quote: string;
  authorInitials: string;
  authorTitle: string;
  state: TestimonialState;
  order: number;
  updatedAt: string;
};

type TestimonialApiRow = {
  id: string;
  quote: string;
  author_initials: string;
  author_title: string;
  state: TestimonialState;
  order: number;
  updated_at: string;
};

function toTestimonial(row: TestimonialApiRow): Testimonial {
  return {
    id: row.id,
    quote: row.quote,
    authorInitials: row.author_initials,
    authorTitle: row.author_title,
    state: row.state,
    order: row.order,
    updatedAt: row.updated_at.slice(0, 10),
  };
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  try {
    const { data } = await cached("testimonials:", () => apiFetch<TestimonialApiRow[]>("/testimonials"));
    return data.map(toTestimonial);
  } catch {
    return [];
  }
}

export async function createTestimonial(input: {
  quote: string;
  authorInitials: string;
  authorTitle: string;
}): Promise<Testimonial> {
  const { data } = await apiFetch<TestimonialApiRow>("/testimonials", {
    method: "POST",
    body: { quote: input.quote, author_initials: input.authorInitials, author_title: input.authorTitle },
  });
  invalidate("testimonials");
  return toTestimonial(data);
}

export async function updateTestimonial(
  id: string,
  input: { quote?: string; authorInitials?: string; authorTitle?: string; state?: TestimonialState },
): Promise<Testimonial> {
  const { data } = await apiFetch<TestimonialApiRow>(`/testimonials/${id}`, {
    method: "PATCH",
    body: {
      ...(input.quote !== undefined && { quote: input.quote }),
      ...(input.authorInitials !== undefined && { author_initials: input.authorInitials }),
      ...(input.authorTitle !== undefined && { author_title: input.authorTitle }),
      ...(input.state !== undefined && { state: input.state }),
    },
  });
  invalidate("testimonials");
  return toTestimonial(data);
}

export async function moveTestimonial(id: string, direction: "up" | "down"): Promise<Testimonial[]> {
  const { data } = await apiFetch<TestimonialApiRow[]>(`/testimonials/${id}/move`, {
    method: "PATCH",
    body: { direction },
  });
  invalidate("testimonials");
  return data.map(toTestimonial);
}

export async function deleteTestimonial(id: string): Promise<void> {
  await apiFetch(`/testimonials/${id}`, { method: "DELETE" });
  invalidate("testimonials");
}
