import { BookData } from 'gede-book-api'

type CatalogParseResult = { page: number, title: string }

export function parseCatalogs(catalogs: BookData['catalogs']): CatalogParseResult[] {
    const returnData: CatalogParseResult[] = []
    for (let i = 0; i < catalogs.length; i++) {
        const catalog = catalogs[i]
        returnData.push({ page: catalog.page, title: catalog.title })
        if (catalog.children?.length > 0) {
            returnData.push(...parseCatalogs(catalog.children))
        }
    }
    return returnData
}