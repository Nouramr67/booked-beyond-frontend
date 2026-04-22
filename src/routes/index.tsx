import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import { Book, BookPayload, libraryApi } from "../lib/libraryApi";

export const Route = createFileRoute("/")({
  component: Index,
});

type AuthView = "login" | "signup";

const demoBooks: Book[] = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self Improvement",
    year: "2018",
    status: "Available",
    description: "Small habits and practical systems for long-term growth.",
  },
  {
    id: 2,
    title: "Clean Code",
    author: "Robert C. Martin",
    category: "Programming",
    year: "2008",
    status: "Borrowed",
    description: "Guidelines for writing readable and maintainable code.",
  },
];

const emptyBook: BookPayload = {
  title: "",
  author: "",
  category: "",
  year: "",
  status: "Available",
  description: "",
};

function Index() {
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState<Book[]>(demoBooks);
  const [bookForm, setBookForm] = useState<BookPayload>(emptyBook);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const visibleBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) => {
      const text = `${book.title} ${book.author} ${book.category}`.toLowerCase();
      return text.includes(query);
    });
  }, [books, search]);

  const apiNote = libraryApi.isConfigured
    ? "Connected mode: API URL is configured."
    : "Demo mode: set VITE_LIBRARY_API_URL to connect with Laravel API.";

  async function onAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const name = String(formData.get("name") || "").trim();

    try {
      if (libraryApi.isConfigured) {
        if (authView === "login") {
          await libraryApi.login(email, password);
        } else {
          await libraryApi.signup(name, email, password);
        }
      }
      setIsAuthed(true);
    } catch {
      setError("Authentication failed. Please check API and credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function onBookSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (editingId === null) {
        if (libraryApi.isConfigured) {
          const created = await libraryApi.createBook(bookForm);
          setBooks((prev) => [created, ...prev]);
        } else {
          setBooks((prev) => [{ ...bookForm, id: Date.now() }, ...prev]);
        }
      } else {
        if (libraryApi.isConfigured) {
          const updated = await libraryApi.updateBook(editingId, bookForm);
          setBooks((prev) => prev.map((book) => (book.id === editingId ? updated : book)));
        } else {
          setBooks((prev) => prev.map((book) => (book.id === editingId ? { ...book, ...bookForm } : book)));
        }
      }

      setBookForm(emptyBook);
      setEditingId(null);
    } catch {
      setError("Book action failed. Verify backend API routes.");
    }
  }

  async function handleDelete(id: number) {
    setError("");
    try {
      if (libraryApi.isConfigured) {
        await libraryApi.deleteBook(id);
      }
      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch {
      setError("Delete failed. Verify backend API routes.");
    }
  }

  function handleEdit(book: Book) {
    setEditingId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      year: book.year,
      status: book.status,
      description: book.description,
    });
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-background">
        <div className="app-shell flex min-h-screen items-center justify-center">
          <section className="panel w-full max-w-md space-y-4" aria-label="Authentication">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Book Library</h1>
              <p className="text-sm text-muted-foreground">{apiNote}</p>
            </div>

            <div className="inline-flex rounded-md border border-input bg-muted p-1" role="tablist">
              <button
                type="button"
                onClick={() => setAuthView("login")}
                className={authView === "login" ? "btn-main h-9" : "btn-soft h-9"}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthView("signup")}
                className={authView === "signup" ? "btn-main h-9" : "btn-soft h-9"}
              >
                Signup
              </button>
            </div>

            <form className="space-y-3" onSubmit={onAuthSubmit}>
              {authView === "signup" && (
                <input required name="name" className="field" placeholder="Full name" />
              )}
              <input required name="email" type="email" className="field" placeholder="Email" />
              <input required name="password" type="password" className="field" placeholder="Password" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="submit" className="btn-main w-full" disabled={loading}>
                {loading ? "Please wait..." : authView === "login" ? "Login" : "Create account"}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="app-shell space-y-5">
        <header className="panel flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Library Home</h1>
            <p className="text-sm text-muted-foreground">Manage books with add, update, and delete actions.</p>
          </div>
          <input
            className="field md:max-w-xs"
            placeholder="Search books"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search books"
          />
        </header>

        <section className="grid gap-5 md:grid-cols-[320px_1fr]">
          <form className="panel space-y-3" onSubmit={onBookSubmit}>
            <h2 className="text-lg font-semibold text-foreground">
              {editingId === null ? "Add New Book" : "Update Book"}
            </h2>
            <input
              required
              className="field"
              placeholder="Title"
              value={bookForm.title}
              onChange={(event) => setBookForm((prev) => ({ ...prev, title: event.target.value }))}
            />
            <input
              required
              className="field"
              placeholder="Author"
              value={bookForm.author}
              onChange={(event) => setBookForm((prev) => ({ ...prev, author: event.target.value }))}
            />
            <input
              required
              className="field"
              placeholder="Category"
              value={bookForm.category}
              onChange={(event) => setBookForm((prev) => ({ ...prev, category: event.target.value }))}
            />
            <input
              required
              className="field"
              placeholder="Year"
              value={bookForm.year}
              onChange={(event) => setBookForm((prev) => ({ ...prev, year: event.target.value }))}
            />
            <select
              className="field"
              value={bookForm.status}
              onChange={(event) =>
                setBookForm((prev) => ({ ...prev, status: event.target.value as Book["status"] }))
              }
            >
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
            </select>
            <textarea
              className="field h-24 py-2"
              placeholder="Description"
              value={bookForm.description}
              onChange={(event) => setBookForm((prev) => ({ ...prev, description: event.target.value }))}
            />

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-main">
                {editingId === null ? "Add Book" : "Save Changes"}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  className="btn-soft"
                  onClick={() => {
                    setEditingId(null);
                    setBookForm(emptyBook);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>

          <section className="panel space-y-3" aria-label="Books list">
            <h2 className="text-lg font-semibold text-foreground">Books</h2>
            <div className="space-y-3">
              {visibleBooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No books found.</p>
              ) : (
                visibleBooks.map((book) => (
                  <article key={book.id} className="rounded-md border border-border p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{book.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {book.author} • {book.category} • {book.year}
                        </p>
                        <p className="mt-1 text-sm text-foreground">{book.description}</p>
                      </div>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        {book.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn-soft h-9" onClick={() => handleEdit(book)}>
                        Update
                      </button>
                      <button type="button" className="btn-danger h-9" onClick={() => handleDelete(book.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
