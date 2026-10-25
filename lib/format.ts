export const formatPrice = (price?: number | null) => {
    if (price === null || price === undefined) return "Price coming soon"
    if (price === 0) return "Free"
    return new Intl.NumberFormat("en-us", {
        style: "currency",
        currency: "NGN",
        currencyDisplay: "narrowSymbol"
    }).format(price)
}
