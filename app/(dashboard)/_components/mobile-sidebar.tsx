import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition" aria-label="Open navigation">
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r-slate-200 bg-white p-0">
        <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
        <SheetDescription className="sr-only">Switch between your learning and teaching pages.</SheetDescription>
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
};
