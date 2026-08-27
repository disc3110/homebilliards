import type {
  ProductArchetype,
  ProductFixture,
} from "@home-billiards/contracts";
import Image from "next/image";
import Link from "next/link";

const previewImages: Record<ProductArchetype, { src: string; alt: string }> = {
  SIMPLE_ACCESSORY: {
    src: "/assets/preview-products/traeger-cherry-hardwood-pellets.jpg",
    alt: "Bag of Traeger cherry hardwood pellets",
  },
  SPECIFICATION_SKU: {
    src: "/assets/preview-products/harrows-voodoo-brass-dart.jpg",
    alt: "Harrows Voodoo brass dart set",
  },
  FURNITURE_DELIVERY: {
    src: "/assets/preview-products/whistler-indoor-table-tennis-table.jpg",
    alt: "Indoor table tennis table",
  },
  INSTALL_REQUIRED: {
    src: "/assets/preview-products/olhausen-canadiana-pool-table.png",
    alt: "Pool table cutout used for installation-flow preview",
  },
  QUOTE_ONLY: {
    src: "/assets/preview-products/olhausen-custom-augusta-pool-table.png",
    alt: "Pool table cutout used for quote-flow preview",
  },
  CONFIGURABLE_PARENT: {
    src: "/assets/preview-products/california-house-austin-pool-table.png",
    alt: "California House Austin pool table preview",
  },
};

const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 2,
});

function getPrice(fixture: ProductFixture) {
  const { price } = fixture.product;

  if (price.mode !== "DISPLAY_PRICE" || price.current === null) {
    return price.label ?? "Contact for details";
  }

  const formatted = cadFormatter.format(price.current.amount);
  return price.label ? `${price.label} ${formatted}` : formatted;
}

export function ProductCard({ fixture }: { fixture: ProductFixture }) {
  const { product } = fixture;
  const previewImage = previewImages[fixture.archetype];

  return (
    <article className="product-card">
      <Link
        className="product-card-media"
        href={product.canonicalPath}
        aria-label={`View preview of ${product.name}`}
      >
        <Image
          src={previewImage.src}
          alt={previewImage.alt}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        <span className="preview-badge">Preview</span>
      </Link>
      <div className="product-card-body">
        <div className="product-card-heading">
          <div>
            {product.brand ? (
              <p className="product-brand">{product.brand}</p>
            ) : null}
            <h3>
              <Link href={product.canonicalPath}>{product.name}</Link>
            </h3>
          </div>
          <p className="product-price">{getPrice(fixture)}</p>
        </div>
        <p className="product-description">
          {product.content.shortDescription}
        </p>
        <div className="product-card-footer">
          <span className="availability">
            <span aria-hidden="true" />
            {product.availability.label}
          </span>
          <span className="product-cta" aria-disabled="true">
            {product.cta.label}
          </span>
        </div>
      </div>
    </article>
  );
}
