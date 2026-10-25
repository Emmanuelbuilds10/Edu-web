import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"


export const Navbar = () => {
    return(
        <div className="h-full flex items-center border-b border-slate-200/70 bg-white/70 px-5 backdrop-blur-xl md:px-8">
            <MobileSidebar />
            <NavbarRoutes />
        </div>
    )
}
