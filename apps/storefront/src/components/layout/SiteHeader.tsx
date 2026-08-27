import {
  storefrontNavigationFixture,
  type NavigationNode,
} from "@home-billiards/contracts";
import Link from "next/link";

const visibleNodes = storefrontNavigationFixture.nodes.filter(
  (node) => node.visibility === "VISIBLE",
);

const primaryNodes = visibleNodes
  .filter((node) => node.parentId === null && node.placement === "HEADER")
  .sort((left, right) => left.sortOrder - right.sortOrder);

const childrenFor = (parentId: string): NavigationNode[] =>
  visibleNodes
    .filter((node) => node.parentId === parentId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h2l2 10h9l2-7H7" />
      <circle cx="10" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </svg>
  );
}

function SearchForm({ compact = false }: { compact?: boolean }) {
  return (
    <form
      className={
        compact ? "header-search header-search--mobile" : "header-search"
      }
      action="/search"
      role="search"
    >
      <label className="sr-only" htmlFor={compact ? "mobile-search" : "search"}>
        Search products
      </label>
      <input
        id={compact ? "mobile-search" : "search"}
        name="q"
        type="search"
        placeholder="Search pool tables, cues, games, and more"
      />
      <button type="submit" aria-label="Submit search">
        <SearchIcon />
      </button>
    </form>
  );
}

function Wordmark() {
  return (
    <Link className="wordmark" href="/" aria-label="Home Billiards home">
      <span>HOME</span>
      <span>BILLIARDS</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-primary page-width">
        <Wordmark />
        <SearchForm />
        <div className="header-actions" aria-label="Store utilities">
          <Link href="/contact">Contact Us</Link>
          <Link className="cart-link" href="/cart">
            <CartIcon />
            <span>My Cart</span>
          </Link>
        </div>

        <details className="mobile-menu">
          <summary>
            <span>Menu</span>
            <span className="menu-lines" aria-hidden="true" />
          </summary>
          <div className="mobile-menu-panel">
            <SearchForm compact />
            <nav aria-label="Mobile catalog navigation">
              {primaryNodes.map((node) => {
                const children = childrenFor(node.id);

                if (children.length === 0) {
                  return (
                    <Link
                      key={node.id}
                      className="mobile-direct-link"
                      href={node.path}
                    >
                      {node.label}
                    </Link>
                  );
                }

                return (
                  <details className="mobile-nav-group" key={node.id}>
                    <summary>{node.label}</summary>
                    <div>
                      <Link className="mobile-all-link" href={node.path}>
                        Shop all {node.label}
                      </Link>
                      {children.map((child) => (
                        <Link key={child.id} href={child.path}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                );
              })}
              <div className="mobile-utility-links">
                <Link href="/contact">Contact Us</Link>
                <Link href="/cart">My Cart</Link>
              </div>
            </nav>
          </div>
        </details>
      </div>

      <nav className="desktop-nav" aria-label="Main catalog navigation">
        <ul className="page-width">
          {primaryNodes.map((node) => {
            const children = childrenFor(node.id);

            if (children.length === 0) {
              return (
                <li key={node.id}>
                  <Link href={node.path}>{node.label}</Link>
                </li>
              );
            }

            return (
              <li className="desktop-nav-group" key={node.id}>
                <details>
                  <summary>{node.label}</summary>
                  <div className="mega-menu">
                    <div className="mega-menu-inner page-width">
                      <div className="mega-menu-heading">
                        <p className="eyebrow">Shop department</p>
                        <Link href={node.path}>{node.label}</Link>
                      </div>
                      <div className="mega-menu-links">
                        {children.map((child) => (
                          <Link key={child.id} href={child.path}>
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
