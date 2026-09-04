import { NotFoundMagnetic } from "@/components/motion/not-found/magnetic";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4">
      <NotFoundMagnetic
        title="Page not found"
        description="This page moved, vanished, or never existed."
        homeHref="/"
        homeLabel="Back to library"
        browseHref="/"
        browseLabel="All bookmarks"
      />
    </main>
  );
}