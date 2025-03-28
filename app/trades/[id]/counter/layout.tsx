import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Counter Trade | RoTools Trader",
  description: "Create a counter offer for a trade",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function CounterTradeLayout({ children }: LayoutProps) {
  return (
    <div className="container py-10">
      <div className="w-full max-w-5xl mx-auto">
        {children}
      </div>
    </div>
  );
} 