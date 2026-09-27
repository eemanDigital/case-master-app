import { Card, Divider, Typography } from "antd";
import { Link } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const CookiePolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <header className="border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          LawMaster
        </Link>
      </div>
    </header>

    <main className="mx-auto max-w-5xl px-4 py-12">
      <Card className="border-0 shadow-lg">
        <div className="mb-8 text-center">
          <Title level={1}>Cookie Policy</Title>
          <Text type="secondary">Last updated: September 2026</Text>
        </div>
        <Divider />

        <Title level={4}>Browser storage used for preferences</Title>
        <Paragraph>
          LawMaster&apos;s consent control stores your choice in this
          browser&apos;s local storage under{" "}
          <Text code>lawmaster_cookie_consent</Text> and
          <Text code> lawmaster_cookie_preferences</Text>. This lets the
          application remember your selection. These entries are browser
          storage, not cookies, and are not sent to LawMaster by the consent
          control.
        </Paragraph>

        <Title level={4}>Optional preference categories</Title>
        <Paragraph>
          The consent settings include functional, analytics, and marketing
          choices. In the current frontend, these choices are saved as
          preferences only; the consent control does not load third-party
          analytics or advertising integrations based on them. This notice
          should be updated before any such integrations are enabled.
        </Paragraph>

        <Title level={4}>Change or clear your choice</Title>
        <Paragraph>
          After saving a choice, use Cookie Settings in the application to
          change it. You can also clear this site&apos;s local storage in your
          browser, which removes the saved preference and causes the consent
          prompt to appear again.
        </Paragraph>

        <Paragraph>
          For information about personal data processing, see our{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </Paragraph>
      </Card>
    </main>
  </div>
);

export default CookiePolicy;
