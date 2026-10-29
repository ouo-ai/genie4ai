import Link from "next/link";
import { ArrowUpRight, MoveUpRight } from "lucide-react";
import { Hero3DWebGL } from "@/components/hero-webgl";
import { Pricing } from "@/components/pricing";
import { FAQ, SITE_URL } from "@/lib/site";
const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Genie 4 AI",
    url: SITE_URL,
    description:
      "Genie 4 AI is an independent World Labs Marble 3D world creation studio.",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Genie 4 AI",
    url: SITE_URL,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web browser",
    description:
      "Genie 4 AI creates explorable 3D worlds from images or text using World Labs Marble 1.1. Independent from Google DeepMind.",
    offers: [
      { name: "Creator monthly", price: 100, unitText: "month" },
      { name: "Pro monthly", price: 200, unitText: "month" },
      { name: "Creator annual", price: 960, unitText: "year" },
      { name: "Pro annual", price: 1920, unitText: "year" },
    ].map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price,
      priceCurrency: "USD",
      url: `${SITE_URL}/#pricing`,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: o.price,
        priceCurrency: "USD",
        unitText: o.unitText,
        billingDuration: o.unitText === "year" ? "P1Y" : "P1M",
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];
export default function HomePage() {
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemas).replace(/</g, "\\u003c"),
        }}
      />
      <Hero3DWebGL />
      <section className="intro-strip shell">
        <p>
          FROM A SINGLE FRAME.
          <br />
          <strong>TO A PLACE YOU CAN EXPLORE.</strong>
        </p>
        <p>
          Genie 4 AI is a browser studio for turning images and text into
          spatial scenes with World Labs Marble. Create a world, explore its 3D
          representation, then download the assets returned by the model.
        </p>
      </section>
      <section className="section shell" id="process">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / THE CREATIVE PROCESS</p>
            <h2>
              Your idea.
              <br />
              <span className="muted">Another dimension.</span>
            </h2>
          </div>
          <p className="section-aside">
            For concept artists, spatial storytellers
            <br />
            and people with places in their heads.
          </p>
        </div>
        <div className="process-list">
          {[
            {
              n: "01",
              title: "Begin with a frame.",
              text: "Upload an image of a place you own or have permission to use. Or describe an imagined scene in words.",
              tag: "JPG / PNG / WEBP",
            },
            {
              n: "02",
              title: "Let the world take shape.",
              text: "Marble interprets your input into a 3D scene. Generation is asynchronous; you can return to your saved job in the studio.",
              tag: "WORLD LABS MARBLE 1.1",
            },
            {
              n: "03",
              title: "Step inside. Take it further.",
              text: "Move through the Gaussian splat in your browser. Download available splats, panorama and collider mesh for your next creative step.",
              tag: "EXPLORE / DOWNLOAD",
            },
          ].map((item) => (
            <article key={item.n}>
              <span className="step-number">{item.n}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className="step-tag">
                {item.tag}
                <MoveUpRight size={16} />
              </span>
            </article>
          ))}
        </div>
        <p className="fine">
          AI scenes can contain visual artifacts and incomplete geometry.
          Results vary by input. This viewer explores a generated scene and does
          not simulate live gameplay.{" "}
          <a
            href="https://docs.worldlabs.ai/api/overview"
            target="_blank"
            rel="noreferrer"
          >
            About the World Labs API ↗
          </a>
        </p>
      </section>
      <Pricing />
      <section className="section shell faq" id="faq">
        <div>
          <p className="eyebrow">04 / BEFORE YOU STEP IN</p>
          <h2>
            A few things
            <br />
            <span className="muted">to know.</span>
          </h2>
          <p className="fine">
            Looking for Google’s research?
            <br />
            <a
              href="https://deepmind.google/models/genie/"
              target="_blank"
              rel="noreferrer"
            >
              Visit the official DeepMind Genie page ↗
            </a>
          </p>
        </div>
        <div>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span>+</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="final-cta shell">
        <p className="eyebrow">THE NEXT PLACE DOESN’T EXIST. YET.</p>
        <h2>
          Start with
          <br />a possibility.
        </h2>
        <Link href="/studio" className="action">
          Open the studio <ArrowUpRight size={18} />
        </Link>
      </section>
    </main>
  );
}
