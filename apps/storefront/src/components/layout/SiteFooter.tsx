import { storefrontNavigationFixture } from "@home-billiards/contracts";
import Link from "next/link";

const visibleNodes = storefrontNavigationFixture.nodes.filter(
  (node) => node.visibility === "VISIBLE",
);

const categoryHubs = visibleNodes
  .filter((node) => node.parentId === null && node.pageType === "CATEGORY_HUB")
  .sort((left, right) => left.sortOrder - right.sortOrder);

const collections = visibleNodes
  .filter((node) => node.parentId === null && node.pageType === "COLLECTION")
  .sort((left, right) => left.sortOrder - right.sortOrder);

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main page-width">
        <div className="footer-brand">
          <Link className="wordmark wordmark--footer" href="/">
            <span>HOME</span>
            <span>BILLIARDS</span>
          </Link>
          <p>
            Premium products and planning support for game rooms and outdoor
            living.
          </p>
          <Link className="text-link text-link--light" href="/contact">
            Visit or contact the showroom
          </Link>
        </div>

        <div className="footer-column">
          <p className="footer-heading">Departments</p>
          {categoryHubs.map((node) => (
            <Link key={node.id} href={node.path}>
              {node.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <p className="footer-heading">Collections</p>
          {collections.map((node) => (
            <Link key={node.id} href={node.path}>
              {node.label}
            </Link>
          ))}
        </div>

        <div className="footer-column">
          <p className="footer-heading">Store</p>
          <Link href="/brands">Brands</Link>
          <Link href="/search">Search</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/cart">My Cart</Link>
        </div>
      </div>
      <div className="footer-bottom page-width">
        <span>© {new Date().getFullYear()} Home Billiards</span>
        <span>Storefront preview</span>
      </div>
    </footer>
  );
}
