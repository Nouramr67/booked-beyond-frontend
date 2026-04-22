export type Book = {
  id: number;
  title: string;
  author: string;
  category: string;
  year: string;
  status: "Available" | "Borrowed";
  description: string;
};

export type BookPayload = Omit<Book, "id">;

const API_BASE_URL = import.meta.env.VITE_LIBRARY_API_URL ?? "";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("Set VITE_LIBRARY_API_URL when the Laravel API is ready.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Library API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const libraryApi = {
  isConfigured: Boolean(API_BASE_URL),
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: { name: string; email: string } }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (name: string, email: string, password: string) =>
    apiRequest<{ token: string; user: { name: string; email: string } }>("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  getBooks: () => apiRequest<Book[]>("/api/books"),
  createBook: (book: BookPayload) =>
    apiRequest<Book>("/api/books", {
      method: "POST",
      body: JSON.stringify(book),
    }),
  updateBook: (id: number, book: BookPayload) =>
    apiRequest<Book>(`/api/books/${id}`, {
      method: "PUT",
      body: JSON.stringify(book),
    }),
  deleteBook: (id: number) =>
    apiRequest<{ success: boolean }>(`/api/books/${id}`, {
      method: "DELETE",
    }),
};