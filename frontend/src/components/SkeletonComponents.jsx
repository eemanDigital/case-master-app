import { Skeleton, Card } from "antd";

/**
 * Skeleton for data count cards
 */
export const DashboardCountSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <Card key={i} className="shadow-sm">
        <Skeleton.Button active block style={{ height: 80 }} />
      </Card>
    ))}
  </div>
);

/**
 * Skeleton for chart components
 */
export const ChartSkeleton = ({ height = 300 }) => (
  <Card className="shadow-sm h-full">
    <Skeleton.Node
      active
      style={{ width: "100%", height: height }}
      className="w-full">
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Skeleton.Avatar active size={64} shape="circle" />
        <Skeleton.Input active size="small" style={{ width: 200 }} />
        <div className="w-full space-y-2">
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
          <Skeleton.Input active size="small" block />
        </div>
      </div>
    </Skeleton.Node>
  </Card>
);

/**
 * Skeleton for list components
 */
export const ListSkeleton = ({ rows = 5 }) => (
  <Card className="shadow-sm h-full">
    <Skeleton active paragraph={{ rows }} />
  </Card>
);

/**
 * Skeleton for table components
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Card className="shadow-sm">
    <div className="space-y-4">
      {/* Table Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton.Input key={i} active size="small" block />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={colIndex}
              active
              size="small"
              block
              style={{ opacity: 0.6 }}
            />
          ))}
        </div>
      ))}
    </div>
  </Card>
);

/**
 * Skeleton for form components
 */
export const FormSkeleton = ({ fields = 4 }) => (
  <Card className="shadow-sm">
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton.Input active size="small" style={{ width: 120 }} />
          <Skeleton.Input active block />
        </div>
      ))}
      <Skeleton.Button active block />
    </div>
  </Card>
);

/**
 * Skeleton for card with image
 */
export const CardWithImageSkeleton = () => (
  <Card className="shadow-sm">
    <Skeleton.Image active style={{ width: "100%", height: 200 }} />
    <div className="mt-4 space-y-2">
      <Skeleton.Input active style={{ width: "70%" }} />
      <Skeleton active paragraph={{ rows: 2 }} />
      <Skeleton.Button active />
    </div>
  </Card>
);

/**
 * Skeleton for profile/user card
 */
export const ProfileSkeleton = () => (
  <Card className="shadow-sm">
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton.Avatar active size={64} />
      <div className="flex-1 space-y-2">
        <Skeleton.Input active style={{ width: "60%" }} />
        <Skeleton.Input active style={{ width: "40%" }} size="small" />
      </div>
    </div>
    <Skeleton active paragraph={{ rows: 3 }} />
  </Card>
);

/**
 * Skeleton for dashboard grid (3 columns)
 */
export const DashboardGridSkeleton = ({ items = 6, columns = 3 }) => (
  <div
    className="grid gap-4"
    style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
    }}>
    {Array.from({ length: items }).map((_, i) => (
      <ChartSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for stat cards (like dashboard metrics)
 */
export const StatCardSkeleton = () => (
  <Card className="shadow-sm">
    <div className="space-y-2">
      <Skeleton.Input active size="small" style={{ width: 100 }} />
      <div className="flex items-center justify-between">
        <Skeleton.Input active style={{ width: 80, height: 40 }} />
        <Skeleton.Avatar active size="small" shape="square" />
      </div>
      <Skeleton.Input active size="small" style={{ width: "60%" }} />
    </div>
  </Card>
);

/**
 * Skeleton for timeline/activity feed
 */
export const TimelineSkeleton = ({ items = 5 }) => (
  <Card className="shadow-sm">
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex space-x-3">
          <Skeleton.Avatar active size="small" />
          <div className="flex-1 space-y-2">
            <Skeleton.Input active style={{ width: "80%" }} size="small" />
            <Skeleton.Input active style={{ width: "60%" }} size="small" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

/**
 * Full page dashboard skeleton
 */
export const FullDashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton.Input active style={{ width: 300, height: 40 }} />
      <Skeleton.Button active />
    </div>

    {/* Count Cards */}
    <DashboardCountSkeleton />

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ListSkeleton rows={8} />
      <ListSkeleton rows={8} />
    </div>

    {/* Charts Grid */}
    <DashboardGridSkeleton items={6} />
  </div>
);

/**
 * Skeleton for modal content
 */
export const ModalSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton.Input active block />
    <Skeleton active paragraph={{ rows: 4 }} />
    <div className="flex space-x-2 justify-end">
      <Skeleton.Button active />
      <Skeleton.Button active />
    </div>
  </div>
);

/**
 * Compact skeleton for small components
 */
export const CompactSkeleton = () => (
  <div className="space-y-2">
    <Skeleton.Input active size="small" block />
    <Skeleton.Input active size="small" block style={{ opacity: 0.7 }} />
    <Skeleton.Input active size="small" block style={{ opacity: 0.5 }} />
  </div>
);
