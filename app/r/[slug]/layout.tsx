import type { Metadata } from "next";
import { getBusiness } from "@/lib/restaurant-queries";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getBusiness(slug);
  if (!biz) return { title: "Not Found" };
  return {
    title: biz.name,
    description: biz.about || `${biz.name} — ${biz.cuisine || "Restaurant"}`,
  };
}

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
