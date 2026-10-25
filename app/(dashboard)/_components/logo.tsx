import Link from 'next/link'
import Image from 'next/image'

export const Logo = () => {
    return (
        <Link href="/dashboard" aria-label="Sabiplex dashboard" className="flex items-center">
            <Image src="/logo.svg" alt="Sabiplex" width={150} height={48} priority className="h-10 w-auto" />
        </Link>
    )
}
