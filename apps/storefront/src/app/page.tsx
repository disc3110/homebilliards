import { storefrontProductFixtures } from "@home-billiards/contracts";
import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/catalog/ProductCard";
import { departments, planningGuides, services } from "@/data/homepage";

export default function StorefrontHome() {
  return (
    <main id="main-content">
      <section className="home-hero">
        <div className="hero-content page-width">
          <h1>
            Canada&apos;s Destination for Luxury Game Rooms &amp; Outdoor Living
          </h1>
          <p className="hero-lead">Curated for How You Live</p>
          <div className="hero-actions">
            <Link className="button button--dark" href="/billiards/pool-tables">
              Shop Pool Tables
            </Link>
            <Link
              className="button button--light"
              href="/billiards/pool-tables/austin-pool-table"
            >
              Build the Austin
            </Link>
            <Link className="button button--light" href="/contact">
              Visit the Showroom
            </Link>
          </div>
        </div>

        <div className="hero-strip" aria-label="Home Billiards highlights">
          <div>
            <p className="eyebrow">Delivery</p>
            <strong>Local install planning</strong>
            <span>Support from the showroom through final setup.</span>
          </div>
          <div>
            <p className="eyebrow">Selection</p>
            <strong>Indoor and outdoor living</strong>
            <span>Game-room staples, patio cooking, and accessories.</span>
          </div>
          <div>
            <p className="eyebrow">Custom</p>
            <strong>Finish and cloth guidance</strong>
            <span>Compare the choices that shape the finished room.</span>
          </div>
          <div>
            <p className="eyebrow">Showroom</p>
            <strong>Room-planning support</strong>
            <span>Bring measurements, photos, or a wish list.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner page-width">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Shop departments</p>
              <h2>Everything for the home, not just the table.</h2>
            </div>
            <Link className="button button--outline" href="/billiards">
              Start with billiards
            </Link>
          </div>

          <div className="department-grid">
            {departments.map((department) => (
              <Link
                className={
                  department.featured
                    ? "department-card department-card--featured"
                    : "department-card"
                }
                href={department.href}
                key={department.title}
              >
                <span className="department-media">
                  <Image
                    src={department.image}
                    alt={department.imageAlt}
                    fill
                    sizes={
                      department.featured
                        ? "(max-width: 860px) 100vw, 50vw"
                        : "(max-width: 860px) 50vw, 25vw"
                    }
                  />
                </span>
                <span className="department-copy">
                  <span className="eyebrow">{department.eyebrow}</span>
                  <span className="department-title">{department.title}</span>
                  <span>{department.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--feature">
        <div className="feature-layout page-width">
          <div className="feature-media">
            <Image
              src="/assets/austin-lifestyle-promo.png"
              alt="California House Austin pool table in a finished room"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
            />
          </div>
          <div className="feature-copy">
            <p className="eyebrow">Featured builder</p>
            <h2>California House Austin Pool Table</h2>
            <p className="lead">
              A guided preview for choosing table details while keeping room
              access, delivery, and installation in view.
            </p>
            <div className="feature-facts">
              <div>
                <span>Experience</span>
                <strong>Guided builder</strong>
              </div>
              <div>
                <span>Product model</span>
                <strong>One parent product</strong>
              </div>
              <div>
                <span>Choices</span>
                <strong>Structured options</strong>
              </div>
              <div>
                <span>Fulfillment</span>
                <strong>Review required</strong>
              </div>
            </div>
            <Link
              className="button button--dark"
              href="/billiards/pool-tables/austin-pool-table"
            >
              Customize the Austin
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="section-inner page-width">
          <div className="section-heading section-heading--products">
            <div>
              <p className="eyebrow">Storefront preview</p>
              <h2>One visual system for every product journey.</h2>
            </div>
            <p>
              Synthetic fixtures are shown only to validate layout and CTA
              behavior. BigCommerce remains the future source of approved data.
            </p>
          </div>
          <div className="product-grid">
            {storefrontProductFixtures.map((fixture) => (
              <ProductCard fixture={fixture} key={fixture.fixtureId} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner page-width">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Services</p>
              <h2>Help for the room, the move, and the table.</h2>
            </div>
            <Link className="button button--outline" href="/contact">
              Request service
            </Link>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <Link
                className="editorial-card"
                href="/contact"
                key={service.title}
              >
                <span className="editorial-card-media">
                  <Image
                    src={service.image}
                    alt={service.imageAlt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  />
                </span>
                <span className="editorial-card-body">
                  <span className="eyebrow">{service.eyebrow}</span>
                  <span className="editorial-card-title">{service.title}</span>
                  <span>{service.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--warm">
        <div className="section-inner page-width">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Planning ideas</p>
              <h2>Useful direction before you choose the room.</h2>
            </div>
            <Link className="button button--outline" href="/contact">
              Get planning help
            </Link>
          </div>
          <div className="guide-grid">
            {planningGuides.map((guide) => (
              <Link className="guide-card" href={guide.href} key={guide.title}>
                <span className="guide-card-media">
                  <Image
                    src={guide.image}
                    alt={guide.imageAlt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                  />
                </span>
                <span className="guide-card-body">
                  <span className="eyebrow">{guide.eyebrow}</span>
                  <span className="guide-card-title">{guide.title}</span>
                  <span>{guide.description}</span>
                  <span className="text-link">Explore</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="studio-band">
        <div className="page-width">
          <div>
            <p className="eyebrow">Design center</p>
            <h2>Bring the room dimensions, photos, and finish ideas.</h2>
            <p>
              Start planning the table, game, finish, cloth, lighting, and
              installation path around the way the room will be used.
            </p>
          </div>
          <Link className="button button--light" href="/contact">
            Plan a visit
          </Link>
        </div>
      </section>
    </main>
  );
}
