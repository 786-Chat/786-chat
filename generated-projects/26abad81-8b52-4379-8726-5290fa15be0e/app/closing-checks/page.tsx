import { WeeklyChecksView } from "@/components/weekly-checks-view";
import { MobileBackButton } from "@/components/mobile-back-button";

export default function ClosingChecksPage() {
  return (
    <>
      <MobileBackButton />
      <WeeklyChecksView mode="closing" />
    </>
  );
}
