import Link from "next/link";

export default function AboutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#e5e2e1",
        padding: "48px 24px",
        fontFamily: 'Inter, "Aptos", "Segoe UI Variable", "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginBottom: 24,
            color: "#00f0ff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Back to Flux
        </Link>
        <p
          style={{
            margin: 0,
            color: "rgba(229,226,225,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          About This Project
        </p>
        <h1
          style={{
            margin: "12px 0 16px",
            fontSize: "clamp(2.2rem, 5vw, 4.5rem)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          Flux
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 680,
            color: "rgba(229,226,225,0.78)",
            lineHeight: 1.7,
            fontSize: 16,
          }}
        >
          Flux exists because basic image and document resizing should not require uploading personal files to a random
          third-party server. This project is for people who want a simple tool for resizing and converting images
          without turning a private file into someone else&apos;s backend payload.
        </p>
        <p
          style={{
            margin: "16px 0 0",
            maxWidth: 680,
            color: "rgba(229,226,225,0.7)",
            lineHeight: 1.7,
            fontSize: 15,
          }}
        >
          Flux may be slightly slower than sites that process everything on their own servers, because the work is done
          locally in your browser instead. That is an intentional tradeoff. A little slower is better than giving up
          privacy for convenience when the file might be sensitive.
        </p>
        <div
          style={{
            marginTop: 28,
            display: "grid",
            gap: 18,
            maxWidth: 720,
          }}
        >
          <section
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 22, letterSpacing: "-0.03em" }}>Processed Locally</h2>
            <p style={{ margin: 0, color: "rgba(229,226,225,0.78)", lineHeight: 1.7, fontSize: 15 }}>
              In this app, image resizing and export are handled locally in your browser. Your files are not uploaded
              to this site&apos;s server just to be cropped, resized, or converted.
            </p>
          </section>
          <section
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 22, letterSpacing: "-0.03em" }}>No Ads, No Tracking</h2>
            <p style={{ margin: 0, color: "rgba(229,226,225,0.78)", lineHeight: 1.7, fontSize: 15 }}>
              Flux has no ads and no tracking scripts. It is meant to be a utility, not an attention funnel, and not a
              data collection surface pretending to be a free tool.
            </p>
          </section>
          <section
            style={{
              padding: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: 22, letterSpacing: "-0.03em" }}>Server Upload Risk</h2>
            <p style={{ margin: 0, color: "rgba(229,226,225,0.78)", lineHeight: 1.7, fontSize: 15 }}>
              A lot of online image tools send uploaded files to their own servers for processing. That is a real
              problem when the file is not just a casual photo, but something sensitive like an ID, tax form, bank
              statement, medical document, legal paperwork, or any private image you do not want sitting on a stranger&apos;s
              infrastructure. Even if a site claims files are temporary, you are still trusting their server, storage,
              logging, and retention behavior. Flux is built around avoiding that trust requirement whenever possible.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
