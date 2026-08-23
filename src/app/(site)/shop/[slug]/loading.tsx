import { BottleLoader } from "@/components/BottleLoader";

export default function ProductLoading() {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-7">
      <BottleLoader variant="page" label="Loading print" />
    </main>
  );
}
