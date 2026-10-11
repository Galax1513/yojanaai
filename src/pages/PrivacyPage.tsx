import { Link } from "react-router-dom"
import { LegalList, LegalPage, type LegalSection } from "@/components/legal/LegalPage"

const LAST_UPDATED = "12 October 2026"

const linkClass = "text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
const strong = "font-medium text-fg"

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <p>
          YojanaAI is an independent scheme-discovery platform. It helps you find government schemes,
          scholarships and benefits that may match the information you choose to provide.
        </p>
        <p>
          This policy explains what information YojanaAI collects, how it is used and stored, and what
          YojanaAI does not do with it. It describes the product as it works today.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    content: (
      <>
        <p>
          <span className={strong}>Account information.</span> When you create an account, YojanaAI stores
          your email address and your password. The password is never stored as you typed it — only a
          salted, one-way hash of it is kept.
        </p>
        <p>
          <span className={strong}>Profile information.</span> When you build your profile, you voluntarily
          provide answers to questions that help evaluate scheme requirements:
        </p>
        <LegalList
          items={[
            "Name and age",
            "Gender",
            "State, district and area type (urban or rural)",
            "Education information, if you are a student: education level, course, year of study and type of institution",
            "Employment information: your current status (for example student, farmer, employed or unemployed) and occupation",
            "Annual family income",
            "Social category",
            "BPL (Below Poverty Line) card status",
            "Disability status",
          ]}
        />
        <p>
          Some questions are optional, and for questions such as BPL or disability status you can answer
          "Unknown". You can browse the scheme catalog on the Discover page without an account or a profile.
        </p>
        <p>
          <span className={strong}>Technical information.</span> To keep you signed in, your browser stores a
          sign-in token in its local storage, along with your light or dark theme choice if you pick one; the
          theme choice never leaves your device. The server keeps standard technical logs, such as the pages and
          API addresses requested and details of errors, to keep the service running and fix problems.
        </p>
        <p>
          YojanaAI does not collect identity numbers (such as Aadhaar), phone numbers, bank details, your
          precise location, or documents. It does not use advertising or analytics cookies.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    content: (
      <>
        <p>Your profile information is used to:</p>
        <LegalList
          items={[
            "Evaluate scheme requirements against the information you provided",
            "Identify potential scheme matches and show what still needs more information",
            "Personalise scheme discovery, for example narrowing results by the kind of support you are looking for",
            "Improve the experience of using YojanaAI",
          ]}
        />
        <p>
          Your email and password are used only to create your account and sign you in. YojanaAI does not
          sell your information, does not share it with advertisers, and does not send it to government
          departments.
        </p>
      </>
    ),
  },
  {
    id: "documents",
    title: "Documents",
    content: (
      <>
        <p>
          YojanaAI does not ask you to upload Aadhaar cards, income certificates, caste certificates,
          disability certificates, bank statements, marksheets, government IDs, or any other supporting
          documents. There is no feature in YojanaAI for uploading documents.
        </p>
        <p>
          Scheme pages may list the documents a scheme requires. That list is shown as information only, so
          you can prepare before applying.
        </p>
        <p>
          When you apply for a scheme, you submit any documents directly to the relevant official government
          portal — never to YojanaAI.
        </p>
      </>
    ),
  },
  {
    id: "applications",
    title: "Applications",
    content: (
      <>
        <p>YojanaAI does not submit applications on your behalf.</p>
        <p>
          YojanaAI does not automatically transmit your profile information or any documents to government
          departments.
        </p>
        <p>
          Clicking an official application or source link takes you to the relevant external website, where
          you apply directly with that organisation.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility",
    content: (
      <>
        <p>
          YojanaAI identifies schemes that may match the information you provide. Final eligibility is
          determined by the relevant government authority and the scheme's official requirements.
        </p>
        <p>
          A "potential match" means your answers fit the structured requirements YojanaAI has on record for
          that scheme. It is not an official eligibility decision, and many schemes have additional conditions
          that are only described in their official guidelines.
        </p>
      </>
    ),
  },
  {
    id: "data-storage",
    title: "Data storage",
    content: (
      <>
        <p>
          Your account and profile information are stored in YojanaAI's database. Passwords are stored only as
          salted hashes. Within YojanaAI, your profile can only be viewed or changed by your own signed-in
          account, and the sign-in token stored in your browser expires after 30 days.
        </p>
        <p>
          Your information is kept for as long as your account exists. It is not automatically deleted after a
          period of inactivity.
        </p>
        <p>
          YojanaAI is in active development, and its production hosting and security arrangements have not yet
          been finalised. This policy will be updated with details of where data is hosted before YojanaAI is
          publicly launched. No online service can guarantee that information is completely secure.
        </p>
      </>
    ),
  },
  {
    id: "third-party-websites",
    title: "Third-party websites",
    content: (
      <>
        <p>
          Scheme pages may link to official government portals and other external websites. Those websites are
          operated independently and have their own privacy policies and terms. YojanaAI is not responsible for
          how they handle your information, so review their policies before sharing information with them.
        </p>
        <p>
          YojanaAI loads its fonts from Google Fonts, which means your browser connects to Google's servers
          when the site loads.
        </p>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Updating and deleting your information",
    content: (
      <>
        <p>
          You can review and change your profile answers at any time using{" "}
          <span className={strong}>Edit profile</span> on your results page. Signing out removes the sign-in
          token from that browser.
        </p>
        <p>
          YojanaAI does not yet offer a way to delete your account or profile yourself. This policy will be
          updated when a deletion option is available.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    content: (
      <p>
        This policy will be updated as YojanaAI changes — for example, when hosting is finalised or new
        features are added. The "Last updated" date at the top of this page shows when it was last revised.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <>
        <p>
          YojanaAI has not yet published a dedicated contact channel. Contact details will be added to this
          page before public launch.
        </p>
        <p>
          For the terms that govern use of YojanaAI, see the{" "}
          <Link to="/terms" className={linkClass}>
            Terms of Use
          </Link>
          .
        </p>
      </>
    ),
  },
]

export function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro={
        <p>
          YojanaAI only asks for the information it needs to show schemes that may match you — and it never
          asks for your documents.
        </p>
      }
      summary={[
        {
          title: "No document uploads",
          body: "You never upload Aadhaar, certificates or IDs to YojanaAI. Documents go directly to official portals.",
        },
        {
          title: "No applications sent for you",
          body: "YojanaAI doesn't submit applications or pass your profile to government departments.",
        },
        {
          title: "Potential matches only",
          body: "Final eligibility is always decided by the relevant government authority.",
        },
      ]}
      sections={sections}
    />
  )
}
