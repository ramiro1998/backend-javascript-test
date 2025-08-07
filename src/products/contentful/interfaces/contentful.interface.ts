export interface ContentfulProductFields {
    sku: string;
    name: string;
    brand: string;
    model: string;
    category: string;
    color: string;
    price: number;
    currency: string;
    stock: number;
}

export interface ContentfulProductEntry {
    sys: {
        id: string;
    };
    fields: ContentfulProductFields;
}