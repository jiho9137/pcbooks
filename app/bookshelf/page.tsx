import BookshelfGrid from "@/components/bookshelf/BookshelfGrid";
import BookshelfHeader from "@/components/bookshelf/BookshelfHeader";

export default function BookshelfPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <BookshelfHeader />
      <main className="flex flex-1 items-center justify-center">
        <BookshelfGrid />
      </main>
    </div>
  );
}
