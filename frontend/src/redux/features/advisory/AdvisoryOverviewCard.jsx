import { Tag } from "antd";

export const AdvisoryOverviewCard = ({ detail, matterId }) => {
  const matter = detail?.matter;

  const Section = ({ label, children }) => (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </Text>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );

  const TagList = ({ items = [], color = "default" }) => (
    <div className="flex flex-wrap gap-1.5">
      {items.length > 0 ? (
        items.map((item, i) => (
          <Tag key={i} color={color} className="rounded-full text-xs">
            {item}
          </Tag>
        ))
      ) : (
        <Text type="secondary" className="text-xs">
          None specified
        </Text>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <Text className="text-sm font-semibold text-slate-700 block mb-3">
        Overview
      </Text>

      {matter?.description && (
        <Section label="Description">
          <p className="text-slate-600 leading-relaxed">{matter.description}</p>
        </Section>
      )}

      {detail?.requestDescription && (
        <Section label="Request Description">
          <p className="text-slate-600 leading-relaxed">
            {detail.requestDescription}
          </p>
        </Section>
      )}

      {detail?.scope && (
        <Section label="Scope">
          <p className="text-slate-600 leading-relaxed">{detail.scope}</p>
        </Section>
      )}

      <Section label="Jurisdiction">
        <TagList items={detail?.jurisdiction || []} color="geekblue" />
      </Section>

      <Section label="Applicable Laws">
        <TagList items={detail?.applicableLaws || []} color="purple" />
      </Section>

      <Section label="Regulatory Bodies">
        <TagList items={detail?.regulatoryBodies || []} color="orange" />
      </Section>

      {matter?.tags?.length > 0 && (
        <Section label="Tags">
          <div className="flex flex-wrap gap-1.5">
            {matter.tags.map((t) => (
              <span
                key={t}
                className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                #{t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {matter?.generalComment && (
        <Section label="General Comment">
          <p className="text-slate-500 italic text-sm">
            {matter.generalComment}
          </p>
        </Section>
      )}
    </div>
  );
};
