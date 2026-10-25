/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            "utfs.io"
        ],
        // The seeded demo courses use an SVG placeholder cover.
        dangerouslyAllowSVG: true,
        contentDispositionType: "inline",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    }
};

export default nextConfig;
