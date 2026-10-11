import { Link } from "react-router-dom"
import { LegalList, LegalPage, type LegalSection } from "@/components/legal/LegalPage"

const LAST_UPDATED = "4 October 2026"

const linkClass = "text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About YojanaAI",
    content: (
      <>
        <p>YojanaAI is an independent scheme-discovery platform.</p>
        <p>
          YojanaAI is not a government website. It is not affiliated with, endorsed by, or operated by the
          Government of India or any government department, unless explicitly stated otherwise.
        </p>
        <p>By using YojanaAI, you agree to these Terms of Use.</p>
      </>
    ),
  },
  {
    id: "informational-service",
    title: "Informational service",
    content: (
      <>
        <p>
          YojanaAI helps you discover and understand government schemes, scholarships and benefits. You can
          browse the catalog without an account, or build a profile to see schemes that may match your
          circumstances.
        </p>
        <p>
          Scheme details, deadlines and requirements can change at any time. Always check the current
          requirements on the relevant official source.
        </p>
      </>
    ),
  },
  {
    id: "eligibility-disclaimer",
    title: "Eligibility disclaimer",
    content: (
      <LegalList
        items={[
          "YojanaAI provides potential matches based on the information you provide.",
          "A match is not an official eligibility determination.",
          "Final eligibility is determined by the relevant government authority.",
          "Verify a scheme's requirements on its official source before applying.",
        ]}
      />
    ),
  },
  {
    id: "official-applications",
    title: "Official applications",
    content: (
      <>
        <p>
          Where a scheme accepts applications online, you apply through the official external portal. YojanaAI
          links to that portal where a link is available.
        </p>
        <p>
          YojanaAI does not submit applications for you, and it does not charge any fee for helping you find
          schemes.
        </p>
      </>
    ),
  },
  {
    id: "user-information",
    title: "Your information",
    content: (
      <>
        <p>
          Your matches are only as accurate as the answers in your profile, so provide information that is true
          and current, and update it when your circumstances change.
        </p>
        <LegalList
          items={[
            "Only enter information about yourself, or about someone who has asked you to help them and agreed to it.",
            "Keep your password private. You are responsible for activity on your account.",
            "Each account holds one profile.",
          ]}
        />
        <p>
          How your information is collected, used and stored is described in the{" "}
          <Link to="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "external-links",
    title: "External links",
    content: (
      <p>
        Links to official government websites and other external sites are provided for your convenience. Those
        sites operate independently of YojanaAI, under their own terms and privacy policies. YojanaAI does not
        control and is not responsible for their content or availability.
      </p>
    ),
  },
  {
    id: "accuracy",
    title: "Accuracy",
    content: (
      <>
        <p>
          Scheme information on YojanaAI is compiled from publicly available sources, including third-party
          datasets, and not every record has been verified against official government records. Pages that
          have not been verified say so.
        </p>
        <p>
          YojanaAI works to keep information useful and current, but it cannot promise that every detail is
          complete, accurate or up to date at all times. Check important details — such as eligibility
          conditions, deadlines, benefit amounts and required documents — against the official source before
          applying.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    content: (
      <p>
        The YojanaAI name, logo, interface design and original written content belong to YojanaAI. Government
        scheme information belongs to the respective government sources, and some scheme data is drawn from
        third-party datasets used under their own licences. YojanaAI does not claim ownership of government
        scheme information.
      </p>
    ),
  },
  {
    id: "prohibited-use",
    title: "Prohibited use",
    content: (
      <>
        <p>When using YojanaAI, you must not:</p>
        <LegalList
          items={[
            "Try to access another person's account or profile, or YojanaAI systems you are not authorised to use",
            "Interfere with or disrupt the service, or place an unreasonable load on it",
            "Scrape or bulk-download content using automated tools without permission",
            "Present YojanaAI as a government service, or present a potential match as an official eligibility decision",
            "Use YojanaAI to mislead people, or to charge people for access to schemes that are free to apply for",
            "Use YojanaAI for anything unlawful",
          ]}
        />
      </>
    ),
  },
  {
    id: "changes-to-service",
    title: "Changes to the service",
    content: (
      <p>
        YojanaAI is in active development. Features, scheme coverage and the way results are presented may
        change, be added or be removed over time, and the service may occasionally be unavailable.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to these terms",
    content: (
      <p>
        These terms may be updated as YojanaAI changes. The "Last updated" date at the top of this page shows
        when they were last revised. Continuing to use YojanaAI after an update means you accept the revised
        terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        YojanaAI has not yet published a dedicated contact channel. Contact details will be added to this page
        before public launch.
      </p>
    ),
  },
]

export function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms of Use"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          These terms explain what YojanaAI is, what it is not, and how to use it responsibly. Please read them
          together with the{" "}
          <Link to="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      }
      summary={[
        {
          title: "Not a government website",
          body: "YojanaAI is independent and isn't affiliated with or endorsed by any government department.",
        },
        {
          title: "Matches aren't decisions",
          body: "A potential match is not official eligibility. The relevant authority decides.",
        },
        {
          title: "Verify before applying",
          body: "Scheme details change. Check the official source, and apply on the official portal.",
        },
      ]}
      sections={sections}
    />
  )
}
