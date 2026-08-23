import { BottleLoader } from "@/components/BottleLoader";

export default function MyOrdersLoading() {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-7">
      <BottleLoader variant="page" label="Loading orders" />
    </main>
  );
}
